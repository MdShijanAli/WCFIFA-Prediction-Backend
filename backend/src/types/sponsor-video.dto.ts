export interface CreateSponsorVideoDto {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  sponsorName: string;
  isActive?: boolean;
}

export type UpdateSponsorVideoDto = Partial<CreateSponsorVideoDto>;

export interface CompleteSponsorVideoDto {
  watchSessionId: string;
}

export interface SponsorVideoStats {
  sponsorVideoId: string | null;
  title: string | null;
  sponsorName: string | null;
  starts: number;
  completions: number;
  uniqueViewers: number;
}
