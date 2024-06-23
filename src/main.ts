import fs from "node:fs";
import { generateFeed, parseFeed } from "./utils";
import { SRFeedEpisode } from "./types";

const FEED_INPUT_URL =
  "https://api.sr.se/api/v2/episodes/index?programid=2071&fromdate=2024-06-01&todate=2024-12-31&audioquality=hi";

const getFeed = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    console.error("Failed getting feed", { url });
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

export const getFeedEpisodes = async (
  url: string
): Promise<SRFeedEpisode[]> => {
  const feed = await getFeed(url);
  if (!feed) {
    process.exit(1);
  }

  const parsedFeed = parseFeed(feed);
  if (!parsedFeed) {
    process.exit(1);
  }

  let episodes: SRFeedEpisode[] = parsedFeed.sr.episodes.episode;

  const nextPage = parsedFeed.sr.pagination.nextpage;
  if (nextPage) {
    const nextFeedEpisodes = await getFeedEpisodes(nextPage);
    return [...episodes, ...nextFeedEpisodes];
  }

  return episodes;
};

const main = async () => {
  const episodes = await getFeedEpisodes(FEED_INPUT_URL);

  const podcastFeed = generateFeed(episodes);
  const writeFileFeedResult = writeFileFeed(podcastFeed);
  if (!writeFileFeedResult) {
    console.error("Failed writing file");
    process.exit(1);
  }
};

main();
