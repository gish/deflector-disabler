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
  downloadpodfile:
    | {
        url: string;
        publishdateutc: string;
        availablefromutc: string;
      }
    | undefined;
};

export type SRProgram = {
  description: string;
  broadcastinfo: string;
  programslug: string;
  programimage: string;
};

export type SRProgramResponse = {
  sr: { program: SRProgram };
};

export type Episode = {
  title: string;
  description: string;
  url: string;
  imageurl: string;
  downloadUrl: string;
  downloadPublishDateUTC: string;
  downloadAvailableFromUTC: string;
};

/**
 * Representation of program needed to fetch information from SR
 */
export type Program = {
  srId: number;
  title: string;
  lastUpdated: number;
};

/**
 * Program decorated with SR Info
 */
export type DecoratedProgram = Program & {
  description: string;
  slug: string;
  imageUrl: string;
};
