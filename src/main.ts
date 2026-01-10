import { DatabaseSync } from "node:sqlite";
import { programs } from "./programs";
import { addPrograms, createTables } from "./utils.database";
import { handler } from "./handler";

const database = new DatabaseSync("./database.sql");
createTables(database, false);
(async () => await addPrograms(programs, database))();

handler(new Date(), database, "./feeds");
