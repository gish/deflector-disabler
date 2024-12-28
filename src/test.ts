import { DatabaseSync } from "node:sqlite";
import { RadioProgram, SRFeedEpisode } from "./types";
import { mkdtempSync, readFileSync } from "node:fs";
import { handler } from "./handler";
import { tmpdir } from "node:os";
import { join } from "node:path";
import timemachine from "timemachine";
import { addPrograms, createTables } from "./utils.database";

describe("write new episodes to database", () => {
  const database = new DatabaseSync(":memory:");
  beforeAll(() => {
    timemachine.config({ dateString: "December 25, 2024 13:12:59" });
  });
  beforeEach(() => {
    const fixturePath = `./tests/fixtures/feed.twoItems.xml`;
    const fixture = readFileSync(fixturePath);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(fixture),
        ok: true,
      }),
    ) as jest.Mock;

    createTables(database, true);
    addPrograms(
      [
        {
          id: 1,
          srId: 22,
          title: "program title",
          description: "program description",
          slug: "program",
          imageUrl: "https://image/",
          lastUpdated: 1,
        },
      ],
      database,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const filePath = mkdtempSync(join(tmpdir(), "deflector-disabler"));
  console.log({ filePath });

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
      "https://api.sr.se/api/v2/episodes/index?programid=22&fromdate=1970-01-01&todate=2022-01-04&audioquality=hi",
    );
  });

  it("should match snapshot of generated file", async () => {
    const now = new Date("2022-01-04");
    await handler(now, database, filePath);
    const generatedFile = readFileSync(`${filePath}/program.rss`, "utf8");
    expect(generatedFile).toMatchSnapshot();
  });

  it("should handle empty list of episodes", async () => {
    const fixturePath = `./tests/fixtures/empty.episodes.xml`;
    const fixture = readFileSync(fixturePath);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(fixture),
        ok: true,
      }),
    ) as jest.Mock;
    const now = new Date("2022-01-04");
    // This should not throw
    await handler(now, database, filePath);
  });
});
