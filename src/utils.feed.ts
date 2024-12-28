import { Podcast } from "podcast-rss";
import { Episode, RadioProgram, SRFeed } from "./types";
import { XMLParser } from "fast-xml-parser";

export const generateFeed = (
  program: RadioProgram,
  episodes: Episode[],
): string => {
  const firstEpisode = episodes[0];
  const podcastFeed = new Podcast({
    title: program.title,
    description: program.description,
    feedUrl: "",
    siteUrl: "",
    imageUrl: "https://gish.github.io/deflector-disabler/assets/cover.png",
    copyright: "Sveriges Radio",
    pubDate: firstEpisode ? firstEpisode.downloadAvailableFromUTC : new Date(),
  });
  episodes.forEach((episode) => {
    podcastFeed.addItem({
      title: episode.title,
      description: episode.description,
      url: episode.url,
      guid: episode.downloadUrl,
      date: episode.downloadPublishdateUTC,
      enclosure: {
        url: episode.downloadUrl,
      },
      imageUrl: episode.imageurl,
      itunesImage: episode.imageurl,
    });
  });
  return podcastFeed.buildXml();
};

export const parseFeed = (XMLData: string): SRFeed | null => {
  try {
    const parser = new XMLParser();
    return parser.parse(XMLData);
  } catch (_) {
    console.log("Failed parsing feed");
    return null;
  }
};
