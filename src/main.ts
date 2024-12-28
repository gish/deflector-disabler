import { DatabaseSync } from "node:sqlite";
import { handler } from "./handler";
import { programs } from "./programs";
import { RadioProgram } from "./types";

const createTables = (database: DatabaseSync) => {
  console.log("Creating database tables");
  database.exec(`CREATE TABLE IF NOT EXISTS programs(
    id INTEGER PRIMARY KEY,
    srId INTEGER NOT NULL,
    title STRING NOT NULL,
    description STRING NOT NULL,
    slug STRING NOT NULL,
    imageUrl STRING NOT NULL,
    lastUpdated INTEGER NOT NULL
  )`);

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
const addPrograms = (programs: RadioProgram[], database: DatabaseSync) => {
  const insertStatement = database.prepare(
    "INSERT INTO PROGRAMS(srId, title, description, slug, imageUrl, lastUpdated) VALUES(?, ?, ?, ?,? ,?)",
  );
  const existsQuery = database.prepare(
    "SELECT id FROM programs WHERE srId = ?",
  );
  for (const program of programs) {
    const exists = existsQuery.get(program.srId) as RadioProgram | undefined;
    if (exists) {
      continue;
    }
    console.log("Adding program", program.title);
    insertStatement.run(
      program.srId,
      program.title,
      program.description,
      program.slug,
      program.imageUrl,
      program.lastUpdated,
    );
  }
};

const database = new DatabaseSync("./database.sql");
createTables(database);
addPrograms(programs, database);
handler(new Date(), database, "./generated");
