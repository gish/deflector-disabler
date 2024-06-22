export type SRFeed = {
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
  imageurl: string;
  downloadpodfile: {
    url: string;
    publishdateutc: string;
  };
};
