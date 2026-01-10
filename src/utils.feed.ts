import { Podcast } from "podcast-rss";
import { DecoratedProgram, Episode } from "./types";
import { XMLParser } from "fast-xml-parser";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

export const generatePodcastFeed = (
  program: DecoratedProgram,
  episodes: Episode[],
): string => {
  const firstEpisode = episodes[0];
  const podcastFeed = new Podcast({
    title: program.title,
    description: program.description,
    feedUrl: "",
    siteUrl: "",
    imageUrl: program.imageUrl,
    copyright: "Sveriges Radio",
    pubDate: firstEpisode ? firstEpisode.downloadAvailableFromUTC : new Date(),
  });
  episodes.forEach((episode) => {
    podcastFeed.addItem({
      title: episode.title,
      description: episode.description,
      url: episode.url,
      guid: episode.downloadUrl,
      date: episode.downloadPublishDateUTC,
      enclosure: {
        url: episode.downloadUrl,
      },
      imageUrl: episode.imageurl,
      itunesImage: episode.imageurl,
    });
  });
  return podcastFeed.buildXml();
};

export const parseSRAPIResponse = <T>(XMLData: string): T | null => {
  try {
    const parser = new XMLParser();
    return parser.parse(XMLData);
  } catch (_) {
    console.log("Failed parsing feed");
    return null;
  }
};

export const getSRAPI = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("failed getting feed", { url });
      return null;
    }
    const text = await response.text();
    return parseSRAPIResponse(text);
  } catch (e) {
    console.error("failed getting feed", { url });
  }
  return null;
};

export const writeFeedFile = (
  path: string,
  filename: string,
  podcastFeed: string,
): boolean => {
  if (!existsSync(path)) {
    mkdirSync(path);
  }
  try {
    writeFileSync(`${path}/${filename}.rss`, podcastFeed);
    return true;
  } catch (_) {
    return false;
  }
};
