import { DatabaseSync } from "node:sqlite";
import { handler } from "./handler";

const createTables = (database: DatabaseSync) => {
  database.exec(`CREATE TABLE IF NOT EXISTS programs(
    id INTEGER PRIMARY KEY,
    title STRING,
    description STRING,
    slug STRING,
    lastUpdated INTEGER
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
// TODO make this file based
const database = new DatabaseSync("./database.sql");
createTables(database);
handler(new Date(), database, "./generated");
