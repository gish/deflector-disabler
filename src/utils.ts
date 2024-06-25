import { XMLParser } from "fast-xml-parser";
import { SRFeed, SRFeedEpisode } from "./types";
import { Podcast } from "podcast-rss";

export const generateFeed = (episodes: SRFeedEpisode[]): string => {
  const firstEpisode = episodes[0];
  const feed = new Podcast({
    title: "Late Spring in Program One",
    description:
      "Avsnitt av Sommar i P1 från 2024. Allt innehåll kommer från Sveriges Radio.",
    feedUrl: "",
    siteUrl: "",
    imageUrl: "https://gish.github.io/deflector-disabler/assets/cover.png",
    copyright: "Sveriges Radio",
    pubDate: firstEpisode
      ? firstEpisode.broadcast.playlist.publishdateutc
      : new Date(),
  });
  episodes.forEach((episode) => {
    feed.addItem({
      title: episode.title,
      description: episode.description,
      url: episode.url,
      guid: episode.downloadpodfile.url,
      date: episode.downloadpodfile.publishdateutc,
      enclosure: {
        url: episode.downloadpodfile.url,
      },
      itunesImage: episode.imageurl,
    });
  });
  return feed.buildXml();
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
