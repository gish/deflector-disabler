import { DatabaseSync } from "node:sqlite";
import { handler } from "./handler";
import { programs } from "./programs";
import { addPrograms, createTables } from "./utils.database";

const database = new DatabaseSync("./database.sql");
createTables(database, false);
addPrograms(programs, database);

handler(new Date(), database, "./generated");
