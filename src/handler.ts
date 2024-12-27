import { writeFileSync } from "fs";
import {
  generateFeed,
  getAllPrograms,
  parseFeed,
  saveProgramEpisodes,
  setProgramUpdatedTimestamp,
} from "./utils";
import { Episode, RadioProgram, SRFeedEpisode } from "./types";
import { DatabaseSync } from "node:sqlite";

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

const getFeed = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("failed getting feed", { url });
      return null;
    }
    return await response.text();
  } catch (e) {
    console.error("failed getting feed", { url });
  }
  return null;
};

const writeFeedFile = (
  path: string,
  program: RadioProgram,
  podcastFeed: string,
): boolean => {
  try {
    writeFileSync(`${path}/${program.slug}.rss`, podcastFeed);
    return true;
  } catch (_) {
    return false;
  }
};

export const fetchProgramEpisodes = async (
  programId: number,
  lastUpdated: number,
  now: number,
): Promise<SRFeedEpisode[] | null> => {
  const formattedFromDate = formatDate(lastUpdated);
  const formattedToDate = formatDate(now);
  const url = `https://api.sr.se/api/v2/episodes/index?programid=${programId}&fromdate=${formattedFromDate}&todate=${formattedToDate}&audioquality=hi`;

  return getProgramEpisodesByUrl(url);
};

const getProgramEpisodesByUrl = async (
  url: string,
): Promise<SRFeedEpisode[] | null> => {
  const feed = await getFeed(url);
  if (!feed) {
    return null;
  }

  const parsedFeed = parseFeed(feed);
  if (!parsedFeed) {
    return null;
  }

  const episode = parsedFeed.sr.episodes.episode;
  const episodes = Array.isArray(episode) ? episode : [episode];

  const nextPage = parsedFeed.sr.pagination.nextpage;
  if (nextPage) {
    const nextFeedEpisodes = await getProgramEpisodesByUrl(nextPage);

    if (!nextFeedEpisodes) {
      console.error("no next feed episodes", { nextPage });
      return episodes;
    }
    return [...episodes, ...nextFeedEpisodes];
  }

  return episodes;
};

const getAllProgramEpisodes = (
  program: RadioProgram,
  database: DatabaseSync,
) => {
  const statement = database.prepare(
    "SELECT id, title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC FROM episodes WHERE programId = ?",
  );
  const episodes = statement.all(program.id) as Episode[];
  return episodes;
};

export const handler = async (
  now: Date,
  database: DatabaseSync,
  feedFilePath: string,
) => {
  const programs = getAllPrograms(now, database);
  let success = true;

  for (const program of programs) {
    const newEpisodes = await fetchProgramEpisodes(
      program.id,
      program.lastUpdated,
      now.getTime(),
    );

    if (!newEpisodes) {
      setProgramUpdatedTimestamp(program, now, database);
      continue;
    }

    saveProgramEpisodes(program, newEpisodes, database);

    const episodes = getAllProgramEpisodes(program, database);
    const generatedFeed = generateFeed(program, episodes);
    const writeFeedFileResult = writeFeedFile(
      feedFilePath,
      program,
      generatedFeed,
    );
    if (!writeFeedFileResult) {
      console.error("failed writing file", { title: program.title });
      success = false;
    }
    setProgramUpdatedTimestamp(program, now, database);
  }
  return success ? 0 : 1;
};
