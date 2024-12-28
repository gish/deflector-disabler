import { DatabaseSync } from "node:sqlite";
import { Episode, RadioProgram, SRFeedEpisode } from "./types";

export const getAllProgramEpisodes = (
  program: RadioProgram,
  database: DatabaseSync,
) => {
  const statement = database.prepare(
    "SELECT id, title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC FROM episodes WHERE programId = ?",
  );
  const episodes = statement.all(program.id) as Episode[];
  return episodes;
};

export const getAllPrograms = (
  now: Date,
  database: DatabaseSync,
): RadioProgram[] => {
  const epoch = now.getTime();
  const query = database.prepare(
    "SELECT id, srId, title, description, slug, imageUrl, lastUpdated FROM programs WHERE lastUpdated < ?",
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
