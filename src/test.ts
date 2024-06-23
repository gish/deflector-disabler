import { getFeedEpisodes } from "./main";
import { generateFeed, parseFeed } from "./utils";
import fs from "node:fs";

describe("parse and generate", () => {
  it("parses and generates feed with two items correctly", () => {
    jest.useFakeTimers().setSystemTime(new Date("2024-06-01"));
    const fixture = fs.readFileSync("./tests/fixtures/feed.twoItems.xml");
    const parsed = parseFeed(fixture.toString());

    expect(parsed).not.toBeNull();
    if (!parsed) {
      return;
    }

    const generated = generateFeed(parsed.sr.episodes.episode);
    expect(generated).toMatchSnapshot();
  });
});

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
