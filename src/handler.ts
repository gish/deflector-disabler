import { SRFeedEpisode } from "./types";
import { DatabaseSync } from "node:sqlite";
import {
  getAllProgramEpisodes,
  getAllPrograms,
  saveProgramEpisodes,
  setProgramUpdatedTimestamp,
} from "./utils.database";
import { generatePodcastFeed, getFeed, writeFeedFile } from "./utils.feed";
import { formatDate } from "./utils";

export const fetchProgramEpisodes = async (
  programId: number,
  lastRun: number,
  now: number
): Promise<SRFeedEpisode[] | null> => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
  /**
   * Get episodes published the day after last run until tomorrow.
   */
  const formattedFromDate = formatDate(lastRun + ONE_DAY_MS);
  const formattedToDate = formatDate(now + ONE_DAY_MS);
  const url = `https://api.sr.se/api/v2/episodes/index?programid=${programId}&fromdate=${formattedFromDate}&todate=${formattedToDate}&audioquality=hi`;

  return getProgramEpisodesByUrl(url);
};

const getProgramEpisodesByUrl = async (
  url: string
): Promise<SRFeedEpisode[] | null> => {
  const feed = await getFeed(url);

  if (!feed) {
    return null;
  }

  const episode = feed.sr.episodes.episode;
  if (!episode) {
    return null;
  }
  const episodes = Array.isArray(episode) ? episode : [episode];

  const nextPage = feed.sr.pagination.nextpage;
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

export const handler = async (
  now: Date,
  database: DatabaseSync,
  feedFilePath: string
) => {
  let success = true;

  const programs = getAllPrograms(now, database);
  for (const program of programs) {
    const newEpisodes = await fetchProgramEpisodes(
      program.srId,
      program.lastUpdated,
      now.getTime()
    );

    if (!newEpisodes) {
      continue;
    }

    saveProgramEpisodes(program, newEpisodes, database);

    const episodes = getAllProgramEpisodes(program, database);
    const generatedFeed = generatePodcastFeed(program, episodes);
    const writeFeedFileResult = writeFeedFile(
      feedFilePath,
      program.slug,
      generatedFeed
    );
    if (!writeFeedFileResult) {
      console.error("failed writing file", { title: program.title });
      success = false;
    }
    setProgramUpdatedTimestamp(program, now, database);
  }
  return success ? 0 : 1;
};
