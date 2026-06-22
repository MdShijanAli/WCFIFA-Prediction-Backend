import { prisma } from "../lib/prisma";
import {
  CreateSponsorVideoDto,
  SponsorVideoStats,
  UpdateSponsorVideoDto,
} from "../types/sponsor-video.dto";

const MAX_OPEN_WATCH_SESSION_HOURS = 8;

const assertNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value.trim();
};

const assertPositiveInteger = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
};

export const validateCreateSponsorVideo = (
  body: Record<string, unknown>,
): CreateSponsorVideoDto => ({
  title: assertNonEmptyString(body.title, "title"),
  description: assertNonEmptyString(body.description, "description"),
  videoUrl: assertNonEmptyString(body.videoUrl, "videoUrl"),
  thumbnailUrl: assertNonEmptyString(body.thumbnailUrl, "thumbnailUrl"),
  durationSeconds: assertPositiveInteger(
    body.durationSeconds,
    "durationSeconds",
  ),
  sponsorName: assertNonEmptyString(body.sponsorName, "sponsorName"),
  isActive:
    typeof body.isActive === "boolean" ? body.isActive : undefined,
});

export const validateUpdateSponsorVideo = (
  body: Record<string, unknown>,
): UpdateSponsorVideoDto => {
  const data: UpdateSponsorVideoDto = {};

  if ("title" in body) data.title = assertNonEmptyString(body.title, "title");
  if ("description" in body) {
    data.description = assertNonEmptyString(body.description, "description");
  }
  if ("videoUrl" in body) {
    data.videoUrl = assertNonEmptyString(body.videoUrl, "videoUrl");
  }
  if ("thumbnailUrl" in body) {
    data.thumbnailUrl = assertNonEmptyString(
      body.thumbnailUrl,
      "thumbnailUrl",
    );
  }
  if ("durationSeconds" in body) {
    data.durationSeconds = assertPositiveInteger(
      body.durationSeconds,
      "durationSeconds",
    );
  }
  if ("sponsorName" in body) {
    data.sponsorName = assertNonEmptyString(body.sponsorName, "sponsorName");
  }
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      throw new Error("isActive must be a boolean");
    }
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required");
  }

  return data;
};

const deactivateOtherVideos = async (activeVideoId: string): Promise<void> => {
  await prisma.sponsorVideo.updateMany({
    where: { id: { not: activeVideoId }, isActive: true },
    data: { isActive: false },
  });
};

export const createSponsorVideo = async (data: CreateSponsorVideoDto) => {
  const video = await prisma.sponsorVideo.create({ data });
  if (video.isActive) await deactivateOtherVideos(video.id);
  return video;
};

export const updateSponsorVideo = async (
  id: string,
  data: UpdateSponsorVideoDto,
) => {
  const video = await prisma.sponsorVideo.update({
    where: { id },
    data,
  });
  if (video.isActive) await deactivateOtherVideos(video.id);
  return video;
};

export const setSponsorVideoActiveState = async (
  id: string,
  isActive: boolean,
) => {
  const video = await prisma.sponsorVideo.update({
    where: { id },
    data: { isActive },
  });
  if (video.isActive) await deactivateOtherVideos(video.id);
  return video;
};

export const deleteSponsorVideo = async (id: string) =>
  prisma.sponsorVideo.delete({ where: { id } });

export const getAllSponsorVideos = async () =>
  prisma.sponsorVideo.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

export const getCurrentSponsorVideo = async () =>
  prisma.sponsorVideo.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

export const startSponsorVideoWatch = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessUnlocked: true },
  });

  if (user?.accessUnlocked) {
    throw new Error("Access is already unlocked");
  }

  const video = await getCurrentSponsorVideo();
  if (!video) {
    throw new Error("No active sponsor video is available");
  }

  const watchSession = await prisma.videoWatchHistory.create({
    data: {
      userId,
      sponsorVideoId: video.id,
      watchStartedAt: new Date(),
    },
  });

  return {
    watchSessionId: watchSession.id,
    requiredDuration: video.durationSeconds,
  };
};

export const completeSponsorVideoWatch = async (
  userId: string,
  watchSessionId: string,
) => {
  const session = await prisma.videoWatchHistory.findUnique({
    where: { id: watchSessionId },
    include: { sponsorVideo: true },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Invalid watch session");
  }
  if (session.completed) {
    throw new Error("Watch session has already been completed");
  }
  if (!session.sponsorVideo || !session.sponsorVideo.isActive) {
    throw new Error("Sponsor video is no longer active");
  }

  const now = new Date();
  const elapsedSeconds =
    (now.getTime() - session.watchStartedAt.getTime()) / 1000;
  const maxAgeMs = MAX_OPEN_WATCH_SESSION_HOURS * 60 * 60 * 1000;

  if (now.getTime() - session.watchStartedAt.getTime() > maxAgeMs) {
    throw new Error("Watch session has expired");
  }
  if (elapsedSeconds < session.sponsorVideo.durationSeconds) {
    throw new Error("Minimum required watch duration has not passed");
  }

  const completedSession = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { accessUnlocked: true },
    });

    if (user?.accessUnlocked) {
      throw new Error("Access is already unlocked");
    }

    const updateResult = await tx.videoWatchHistory.updateMany({
      where: {
        id: watchSessionId,
        userId,
        completed: false,
      },
      data: {
        completed: true,
        watchCompletedAt: now,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Watch session could not be completed");
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        accessUnlocked: true,
        accessUnlockedAt: now,
      },
    });

    return tx.videoWatchHistory.findUniqueOrThrow({
      where: { id: watchSessionId },
    });
  });

  console.info(
    `[sponsor-video] user=${userId} completed session=${watchSessionId}`,
  );

  return completedSession;
};

export const getSponsorVideoStats = async (): Promise<SponsorVideoStats[]> => {
  const [videos, grouped] = await Promise.all([
    prisma.sponsorVideo.findMany({
      select: { id: true, title: true, sponsorName: true },
    }),
    prisma.videoWatchHistory.groupBy({
      by: ["sponsorVideoId"],
      _count: {
        _all: true,
        userId: true,
      },
      where: {},
    }),
  ]);

  const uniqueViewerCounts = await Promise.all(
    grouped.map((group) =>
      prisma.videoWatchHistory
        .findMany({
          where: { sponsorVideoId: group.sponsorVideoId },
          select: { userId: true },
          distinct: ["userId"],
        })
        .then((rows) => ({
          sponsorVideoId: group.sponsorVideoId,
          uniqueViewers: rows.length,
        })),
    ),
  );

  const completions = await prisma.videoWatchHistory.groupBy({
    by: ["sponsorVideoId"],
    where: { completed: true },
    _count: { _all: true },
  });

  const videoById = new Map(videos.map((video) => [video.id, video]));
  const uniqueByVideoId = new Map(
    uniqueViewerCounts.map((row) => [row.sponsorVideoId, row.uniqueViewers]),
  );
  const completionsByVideoId = new Map(
    completions.map((row) => [row.sponsorVideoId, row._count._all]),
  );

  return grouped.map((group) => {
    const video = group.sponsorVideoId
      ? videoById.get(group.sponsorVideoId)
      : null;

    return {
      sponsorVideoId: group.sponsorVideoId,
      title: video?.title ?? null,
      sponsorName: video?.sponsorName ?? null,
      starts: group._count._all,
      completions: completionsByVideoId.get(group.sponsorVideoId) ?? 0,
      uniqueViewers: uniqueByVideoId.get(group.sponsorVideoId) ?? 0,
    };
  });
};
