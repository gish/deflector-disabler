import { XMLParser } from "fast-xml-parser";
import { Podcast } from "podcast-rss";
import fs from "node:fs";

type SRFeed = {
  sr: {
    copyright: string;
    pagination: SRFeedPagination;
    episodes: { episode: SRFeedEpisode[] };
  };
};

type SRFeedPagination = {
  page: number;
  size: number;
  totalhits: number;
  totalpages: number;
  nextpage: string;
};

type SRFeedEpisode = {
  title: string;
  description: string;
  url: string;
  downloadpodfile: {
    url: string;
    publishdateutc: string;
  };
};

const FEED_INPUT_URL =
  "https://api.sr.se/api/v2/episodes/index?programid=2071&fromdate=2024-06-01&todate=2024-12-31&audioquality=hi";

const getFeed = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return await response.text();
};

const parseFeed = (XMLData: string): SRFeed | null => {
  try {
    const parser = new XMLParser();
    return parser.parse(XMLData);
  } catch (_) {
    return null;
  }
};

const generatePodcastFeed = (srFeed: SRFeed): string => {
  const feed = new Podcast({
    title: "Deflector Disabler",
    description: "2024",
    feedUrl: "",
    siteUrl: "",
  });
  srFeed.sr.episodes.episode.forEach((episode) => {
    feed.addItem({
      title: episode.title,
      description: episode.description,
      url: episode.downloadpodfile.url,
      guid: episode.downloadpodfile.url,
      date: episode.downloadpodfile.publishdateutc,
      enclosure: {
        url: episode.downloadpodfile.url,
      },
    });
  });
  return feed.buildXml();
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

  const podcastFeed = generatePodcastFeed(parsedFeed);
  const writeFileFeedResult = writeFileFeed(podcastFeed);
  if (!writeFileFeedResult) {
    console.error("Failed writing file");
    process.exit(1);
  }
};

main();
