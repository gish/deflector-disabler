import fs from "node:fs";
import { generateFeed, parseFeed } from "./utils";

const FEED_INPUT_URL =
  "https://api.sr.se/api/v2/episodes/index?programid=2071&fromdate=2024-06-01&todate=2024-12-31&audioquality=hi";

const getFeed = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return await response.text();
};

const writeFileFeed = (podcastFeed: string): boolean => {
  try {
    fs.writeFileSync("./generated.rss", podcastFeed);
    return true;
  } catch (_) {
    return false;
  }
};

const main = async () => {
  const feed = await getFeed(FEED_INPUT_URL);
  if (!feed) {
    console.log("Failed getting feed");
    process.exit(1);
  }

  const parsedFeed = parseFeed(feed);
  if (!parsedFeed) {
    console.log("Failed parsing feed");
    process.exit(1);
  }

  const podcastFeed = generateFeed(parsedFeed);
  const writeFileFeedResult = writeFileFeed(podcastFeed);
  if (!writeFileFeedResult) {
    console.error("Failed writing file");
    process.exit(1);
  }
};

main();
