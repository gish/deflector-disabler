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

    const generated = generateFeed(parsed);
    expect(generated).toMatchSnapshot();
  });
});
