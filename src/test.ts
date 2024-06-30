import { getFeedEpisodes } from "./main";
import fs from "node:fs";

type TestCase = { name: string; file: string };

const testCases: TestCase[] = [
  { name: "Two items", file: "feed.twoItems.xml" },
  { name: "One item", file: "feed.oneItem.xml" },
];

afterEach(() => {
  jest.restoreAllMocks();
});
test.each(testCases)("$name", async ({ file }) => {
  const filePath = `./tests/fixtures/${file}`;
  const fixture = fs.readFileSync(filePath);
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve(fixture),
      ok: true,
    })
  ) as jest.Mock;

  const episodes = await getFeedEpisodes("fake.url");
  expect(episodes).toMatchSnapshot();
});
