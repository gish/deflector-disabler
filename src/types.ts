export type SRFeed = {
  sr: SRFeedMeta & {
    episodes: { episode: SRFeedEpisode[] | SRFeedEpisode };
  };
};

export type SRFeedMeta = { copyright: string; pagination: SRFeedPagination };

type SRFeedPagination = {
  page: number;
  size: number;
  totalhits: number;
  totalpages: number;
  nextpage: string | undefined;
};

export type SRFeedEpisode = {
  title: string;
  description: string;
  url: string;
  imageurl: string;
  downloadpodfile: {
    url: string;
    publishdateutc: string;
    availablefromutc: string;
  };
};

export type Episode = {
  title: string;
  description: string;
  url: string;
  imageurl: string;
  downloadUrl: string;
  downloadPublishdateUTC: string;
  downloadAvailableFromUTC: string;
};

export type RadioProgram = {
  id: number;
  title: string;
  slug: string;
  description: string;
  lastUpdated: number;
};
