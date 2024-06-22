import { XMLParser } from "fast-xml-parser";
import { SRFeed } from "./types";
import { Podcast } from "podcast-rss";

export const generateFeed = (srFeed: SRFeed): string => {
  const firstEpisode = srFeed.sr.episodes.episode[0];
  const feed = new Podcast({
    title: "Deflector Disabler",
    description: "2024",
    feedUrl: "",
    siteUrl: "",
    pubDate: firstEpisode
      ? firstEpisode.downloadpodfile.publishdateutc
      : undefined,
  });
  srFeed.sr.episodes.episode.forEach((episode) => {
    feed.addItem({
      title: episode.title,
      description: episode.description,
      url: episode.downloadpodfile.url,
      guid: episode.downloadpodfile.url,
      date: episode.downloadpodfile.publishdateutc,
      imageUrl: episode.imageurl,
      enclosure: {
        url: episode.downloadpodfile.url,
      },
    });
  });
  return feed.buildXml();
};

export const parseFeed = (XMLData: string): SRFeed | null => {
  try {
    const parser = new XMLParser();
    return parser.parse(XMLData);
  } catch (_) {
    return null;
  }
};
