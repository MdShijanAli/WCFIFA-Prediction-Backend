-- Add permanent sponsored-video unlock state to users.
ALTER TABLE "users"
ADD COLUMN "accessUnlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "accessUnlockedAt" TIMESTAMP(3);

-- Store sponsored video inventory managed by admins.
CREATE TABLE "sponsor_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_videos_pkey" PRIMARY KEY ("id")
);

-- Store server-side watch sessions and completion audit trail.
CREATE TABLE "video_watch_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sponsorVideoId" TEXT,
    "watchStartedAt" TIMESTAMP(3) NOT NULL,
    "watchCompletedAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_watch_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "video_watch_histories_userId_completed_idx" ON "video_watch_histories"("userId", "completed");
CREATE INDEX "video_watch_histories_sponsorVideoId_idx" ON "video_watch_histories"("sponsorVideoId");

ALTER TABLE "video_watch_histories" ADD CONSTRAINT "video_watch_histories_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_watch_histories" ADD CONSTRAINT "video_watch_histories_sponsorVideoId_fkey"
FOREIGN KEY ("sponsorVideoId") REFERENCES "sponsor_videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
