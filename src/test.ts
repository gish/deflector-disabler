import { DatabaseSync } from "node:sqlite";
import { RadioProgram, SRFeedEpisode } from "./types";
import { mkdtempSync, readFileSync } from "node:fs";
import { handler } from "./handler";
import { tmpdir } from "node:os";
import { join } from "node:path";
import timemachine from "timemachine";

describe("write new episodes to database", () => {
  const database = new DatabaseSync(":memory:");
  beforeAll(() => {
    timemachine.config({ dateString: "December 25, 2024 13:12:59" });
  });
  beforeEach(() => {
    const filePath = `./tests/fixtures/feed.twoItems.xml`;
    const fixture = readFileSync(filePath);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(fixture),
        ok: true,
      }),
    ) as jest.Mock;

    database.exec(`DROP TABLE IF EXISTS programs`);
    database.exec(`CREATE TABLE IF NOT EXISTS programs(
      id INTEGER PRIMARY KEY,
      srId INTEGER NOT NULL,
      title STRING NOT NULL,
      description STRING NOT NULL,
      slug STRING NOT NULL,
      imageUrl STRING NOT NULL,
      lastUpdated INTEGER NOT NULL
    )`);

    database.exec(`DROP TABLE IF EXISTS episodes`);
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

    database.exec(
      "INSERT INTO programs(srId, title, description, slug, imageUrl, lastUpdated) VALUES(1, 'program title', 'program slug', 'program', 'https://url', 1)",
    );
  });

  afterAll(() => jest.restoreAllMocks());

  const filePath = mkdtempSync(join(tmpdir(), "deflector-disabler"));

  it.todo("should get paginated episodes");

  it("should write episodes to database", async () => {
    const now = new Date("2022-01-03");
    await handler(now, database, filePath);

    const episodesInDbStatement = database.prepare(
      "SELECT title, description FROM episodes",
    );
    const episodesInDb = episodesInDbStatement.all() as SRFeedEpisode[];
    expect(episodesInDb.length).toBe(2);
    expect(episodesInDb.at(0)?.title).toEqual("Hampus Nessvold");
    expect(episodesInDb.at(1)?.title).toEqual("Årets Sommarvärdar presenteras");
  });

  it("should update programs last update timestamp with latest episodes timestamp", async () => {
    const now = new Date("2022-01-04");
    await handler(now, database, filePath);
    const query = database.prepare(
      "SELECT lastUpdated FROM programs WHERE id = 1",
    );
    const result = query.get() as RadioProgram;
    expect(result).not.toBeFalsy();
    expect(result.lastUpdated).toEqual(now.getTime());
  });

  it("should only request episodes after last updated date", async () => {
    const now = new Date("2022-01-04");
    await handler(now, database, filePath);
    const fetch = global.fetch as jest.Mock;
    expect(fetch).toHaveBeenCalledWith(
      "https://api.sr.se/api/v2/episodes/index?programid=1&fromdate=1970-01-01&todate=2022-01-04&audioquality=hi",
    );
  });

  it("should match snapshot of generated file", async () => {
    const now = new Date("2022-01-04");
    await handler(now, database, filePath);
    const generatedFile = readFileSync(`${filePath}/program.rss`, "utf8");
    expect(generatedFile).toMatchSnapshot();
  });
});
