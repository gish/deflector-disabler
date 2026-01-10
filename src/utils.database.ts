import { DatabaseSync } from "node:sqlite";
import { DecoratedProgram, Episode, Program, SRFeedEpisode } from "./types";
import { fetchProgram } from "./handler";

export const getAllProgramEpisodes = (
  program: DecoratedProgram,
  database: DatabaseSync,
) => {
  const statement = database.prepare(
    "SELECT title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC FROM episodes WHERE programId = ?",
  );
  const episodes = statement.all(program.srId) as Episode[];
  return episodes;
};

export const getAllPrograms = (
  now: Date,
  database: DatabaseSync,
): DecoratedProgram[] => {
  const epoch = now.getTime();
  const query = database.prepare(
    "SELECT srId, title, description, slug, imageUrl, lastUpdated FROM programs WHERE lastUpdated < ?",
  );
  return query.all(epoch) as DecoratedProgram[];
};

export const setProgramUpdatedTimestamp = (
  program: DecoratedProgram,
  now: Date,
  database: DatabaseSync,
): boolean => {
  const epoch = now.getTime();
  const statement = database.prepare(
    "UPDATE programs SET lastUpdated = ? WHERE srId = ?",
  );
  const changes = statement.run(epoch, program.srId);
  return changes.changes === 1;
};

export const saveProgramEpisodes = (
  program: DecoratedProgram,
  episodes: SRFeedEpisode[],
  database: DatabaseSync,
) => {
  const insertStatement = database.prepare(
    "INSERT INTO episodes(programId, title, description, url, imageUrl, downloadUrl, downloadPublishDateUTC, downloadAvailableFromUTC) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const episode of episodes) {
    const downloadpodfile = episode.downloadpodfile;
    if (!downloadpodfile) {
      console.error(
        `\x1b[31m No downloadable file for ${episode.title}! \x1b[0m`,
      );
      continue;
    }
    insertStatement.run(
      program.srId,
      episode.title,
      episode.description,
      episode.url,
      episode.imageurl,
      downloadpodfile.url,
      downloadpodfile.publishdateutc,
      downloadpodfile.availablefromutc,
    );
    console.info(`Saved ${episode.title} to database`);
  }
};

export const createTables = (database: DatabaseSync, force: boolean) => {
  if (force) {
    database.exec("DROP TABLE IF EXISTS programs");
  }
  database.exec(`CREATE TABLE IF NOT EXISTS programs(
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

export const writeProgramToDatabase = (
  decoratedProgram: DecoratedProgram,
  database: DatabaseSync,
) => {
  const insertStatement = database.prepare(
    "INSERT INTO PROGRAMS(srId, title, description, slug, imageUrl, lastUpdated) VALUES(?, ?, ?, ?, ?,?)",
  );

  insertStatement.run(
    decoratedProgram.srId,
    decoratedProgram.title,
    decoratedProgram.description,
    decoratedProgram.slug,
    decoratedProgram.imageUrl,
    decoratedProgram.lastUpdated,
  );
};

export const addPrograms = async (
  programs: Program[],
  database: DatabaseSync,
) => {
  const existsQuery = database.prepare(
    "SELECT srId FROM programs WHERE srId = ?",
  );
  for (const program of programs) {
    const exists = existsQuery.get(program.srId) as
      | DecoratedProgram
      | undefined;
    if (exists) {
      continue;
    }

    const srProgram = await fetchProgram(program.srId);
    if (!srProgram) {
      console.error("Failed fetching program", { program });
      continue;
    }

    const decoratedProgram: DecoratedProgram = {
      description: srProgram.description,
      imageUrl: srProgram.programimage,
      slug: srProgram.programslug,
      srId: program.srId,
      title: program.title,
      lastUpdated: program.lastUpdated,
    };

    writeProgramToDatabase(decoratedProgram, database);
  }
};
