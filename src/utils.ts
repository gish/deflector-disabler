import { XMLParser } from "fast-xml-parser";
import { Episode, RadioProgram, SRFeed, SRFeedEpisode } from "./types";
import { Podcast } from "podcast-rss";
import { DatabaseSync } from "node:sqlite";

export const generateFeed = (
  program: RadioProgram,
  episodes: Episode[],
): string => {
  const firstEpisode = episodes[0];
  const podcastFeed = new Podcast({
    title: program.title,
    description: program.description,
    feedUrl: "",
    siteUrl: "",
    imageUrl: "https://gish.github.io/deflector-disabler/assets/cover.png",
    copyright: "Sveriges Radio",
    pubDate: firstEpisode ? firstEpisode.downloadAvailableFromUTC : new Date(),
  });
  episodes.forEach((episode) => {
    podcastFeed.addItem({
      title: episode.title,
      description: episode.description,
      url: episode.url,
      guid: episode.downloadUrl,
      date: episode.downloadPublishdateUTC,
      enclosure: {
        url: episode.downloadUrl,
      },
      imageUrl: episode.imageurl,
      itunesImage: episode.imageurl,
    });
  });
  return podcastFeed.buildXml();
};

export const parseFeed = (XMLData: string): SRFeed | null => {
  try {
    const parser = new XMLParser();
    return parser.parse(XMLData);
  } catch (_) {
    console.log("Failed parsing feed");
    return null;
  }
};

export const getAllPrograms = (
  now: Date,
  database: DatabaseSync,
): RadioProgram[] => {
  const epoch = now.getTime();
  const query = database.prepare(
    "SELECT id, title, description, slug, lastUpdated FROM programs WHERE lastUpdated < ?",
  );
  return query.all(epoch) as RadioProgram[];
};
export const setProgramUpdatedTimestamp = (
  program: RadioProgram,
  now: Date,
  database: DatabaseSync,
): boolean => {
  const epoch = now.getTime();
  const statement = database.prepare(
    "UPDATE programs SET lastUpdated = ? WHERE id = ?",
  );
  const changes = statement.run(epoch, program.id);
  return changes.changes === 1;
};
export const saveProgramEpisodes = (
  program: RadioProgram,
  episodes: SRFeedEpisode[],
  database: DatabaseSync,
) => {
  const insertStatement = database.prepare(
    "INSERT INTO episodes(programId, title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const episode of episodes) {
    insertStatement.run(
      program.id,
      episode.title,
      episode.description,
      episode.url,
      episode.imageurl,
      episode.downloadpodfile.url,
      episode.downloadpodfile.publishdateutc,
      episode.downloadpodfile.availablefromutc,
    );
  }
};
