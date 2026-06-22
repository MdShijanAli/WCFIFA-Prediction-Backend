import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  completeSponsorVideoWatch,
  createSponsorVideo,
  deleteSponsorVideo,
  getAllSponsorVideos,
  getCurrentSponsorVideo,
  getSponsorVideoStats,
  setSponsorVideoActiveState,
  startSponsorVideoWatch,
  updateSponsorVideo,
  validateCreateSponsorVideo,
  validateUpdateSponsorVideo,
} from "../services/sponsor-video.service";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const handleBadRequest = (res: Response, error: unknown): void => {
  res.status(400).json({ success: false, message: getErrorMessage(error) });
};

export const getCurrentVideo = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const video = await getCurrentSponsorVideo();
    if (!video) {
      res.status(404).json({
        success: false,
        message: "No active sponsor video is available",
      });
      return;
    }

    res.json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch video" });
  }
};

export const startWatchSession = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await startSponsorVideoWatch(req.userId as string);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message === "Access is already unlocked" ? 409 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const completeWatchSession = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { watchSessionId } = req.body as { watchSessionId?: unknown };
    if (typeof watchSessionId !== "string" || watchSessionId.trim() === "") {
      res
        .status(400)
        .json({ success: false, message: "watchSessionId is required" });
      return;
    }

    const history = await completeSponsorVideoWatch(
      req.userId as string,
      watchSessionId.trim(),
    );

    res.json({
      success: true,
      message: "Access unlocked successfully",
      accessUnlocked: true,
      accessUnlockedAt: history.watchCompletedAt,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const status =
      message === "Access is already unlocked" ||
      message === "Watch session has already been completed"
        ? 409
        : 400;
    res.status(status).json({ success: false, message });
  }
};

export const adminCreateSponsorVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = validateCreateSponsorVideo(req.body);
    const video = await createSponsorVideo(data);
    res.status(201).json({
      success: true,
      message: "Sponsor video created successfully",
      video,
    });
  } catch (error) {
    handleBadRequest(res, error);
  }
};

export const adminUpdateSponsorVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = validateUpdateSponsorVideo(req.body);
    const video = await updateSponsorVideo(req.params.id, data);
    res.json({
      success: true,
      message: "Sponsor video updated successfully",
      video,
    });
  } catch (error) {
    handleBadRequest(res, error);
  }
};

export const adminDeleteSponsorVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await deleteSponsorVideo(req.params.id);
    res.json({ success: true, message: "Sponsor video deleted successfully" });
  } catch (error) {
    handleBadRequest(res, error);
  }
};

export const adminSetSponsorVideoStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (typeof req.body?.isActive !== "boolean") {
      res
        .status(400)
        .json({ success: false, message: "isActive must be a boolean" });
      return;
    }

    const video = await setSponsorVideoActiveState(
      req.params.id,
      req.body.isActive,
    );
    res.json({ success: true, video });
  } catch (error) {
    handleBadRequest(res, error);
  }
};

export const adminGetSponsorVideos = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const videos = await getAllSponsorVideos();
    res.json({
      success: true,
      message: "Sponsor videos fetched successfully",
      videos,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sponsor videos" });
  }
};

export const adminGetSponsorVideoStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const stats = await getSponsorVideoStats();
    res.json({
      success: true,
      message: "Sponsor video statistics fetched successfully",
      stats,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch video statistics" });
  }
};
