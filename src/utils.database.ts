import { DatabaseSync } from "node:sqlite";
import { Episode, RadioProgram, SRFeedEpisode } from "./types";

export const getAllProgramEpisodes = (
  program: RadioProgram,
  database: DatabaseSync
) => {
  const statement = database.prepare(
    "SELECT id, title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC FROM episodes WHERE programId = ?"
  );
  const episodes = statement.all(program.id) as Episode[];
  return episodes;
};

export const getAllPrograms = (
  now: Date,
  database: DatabaseSync
): RadioProgram[] => {
  const epoch = now.getTime();
  const query = database.prepare(
    "SELECT id, srId, title, description, slug, imageUrl, lastUpdated FROM programs WHERE lastUpdated < ?"
  );
  return query.all(epoch) as RadioProgram[];
};

export const setProgramUpdatedTimestamp = (
  program: RadioProgram,
  now: Date,
  database: DatabaseSync
): boolean => {
  const epoch = now.getTime();
  const statement = database.prepare(
    "UPDATE programs SET lastUpdated = ? WHERE id = ?"
  );
  const changes = statement.run(epoch, program.id);
  return changes.changes === 1;
};

export const saveProgramEpisodes = (
  program: RadioProgram,
  episodes: SRFeedEpisode[],
  database: DatabaseSync
) => {
  const insertStatement = database.prepare(
    "INSERT INTO episodes(programId, title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC) VALUES(?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const episode of episodes) {
    const downloadpodfile = episode.downloadpodfile;
    if (!downloadpodfile) {
      console.error(
        `\x1b[31m No downloadable file for ${episode.title}! \x1b[0m`
      );
      continue;
    }
    insertStatement.run(
      program.id,
      episode.title,
      episode.description,
      episode.url,
      episode.imageurl,
      downloadpodfile.url,
      downloadpodfile.publishdateutc,
      downloadpodfile.availablefromutc
    );
  }
};

export const createTables = (database: DatabaseSync, force: boolean) => {
  if (force) {
    database.exec("DROP TABLE IF EXISTS programs");
  }
  database.exec(`CREATE TABLE IF NOT EXISTS programs(
    id INTEGER PRIMARY KEY,
    srId INTEGER NOT NULL,
    title STRING NOT NULL,
    description STRING NOT NULL,
    slug STRING NOT NULL,
    imageUrl STRING NOT NULL,
    lastUpdated INTEGER NOT NULL
  )`);

  if (force) {
    database.exec("DROP TABLE IF EXISTS episodes");
  }
  database.exec(`CREATE TABLE IF NOT EXISTS episodes(
    id INTEGER PRIMARY KEY,
    programId INTEGER,
    title STRING,
    description STRING,
    url STRING,
    imageUrl STRING,
    downloadUrl STRING,
    downloadPublishDateUTC STRING,
    downloadAvailableFromUTC STRING
  )`);
};

export const addPrograms = (
  programs: RadioProgram[],
  database: DatabaseSync
) => {
  const insertStatement = database.prepare(
    "INSERT INTO PROGRAMS(srId, title, description, slug, imageUrl, lastUpdated) VALUES(?, ?, ?, ?,? ,?)"
  );
  const existsQuery = database.prepare(
    "SELECT id FROM programs WHERE srId = ?"
  );
  for (const program of programs) {
    const exists = existsQuery.get(program.srId) as RadioProgram | undefined;
    if (exists) {
      continue;
    }
    insertStatement.run(
      program.srId,
      program.title,
      program.description,
      program.slug,
      program.imageUrl,
      program.lastUpdated
    );
  }
};
