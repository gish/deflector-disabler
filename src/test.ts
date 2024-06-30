import { getFeedEpisodes } from "./main";
import fs from "node:fs";

describe("episode list", () => {
  const fixture = fs.readFileSync("./tests/fixtures/feed.twoItems.xml");
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve(fixture),
      ok: true,
    })
  ) as jest.Mock;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates episode list", async () => {
    const episodes = await getFeedEpisodes("fake.url");
    expect(episodes).toMatchSnapshot();
  });
});
