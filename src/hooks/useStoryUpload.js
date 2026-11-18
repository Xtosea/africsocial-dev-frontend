import { useState } from "react";
import { compressStoryMedia } from "../utils/compressStoryMedia";
import useR2StoryMusic from "./r2StoryMusic";
import { API_BASE } from "../api/api";

export function useStoryUpload() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const { uploadMusic } = useR2StoryMusic();

  const uploadStory = async (input) => {
    const options =
      typeof File !== "undefined" && input instanceof File
        ? { file: input }
        : (input || {});

    let {
      file,
      cloudinaryUrl,
      thumbnailUrl,
      thumbnailFile,
      textStyle,
      text,
      music,
      stickers,
      backgroundColor,
    } = options;

    try {
      setLoading(true);
      setProgress(0);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in before uploading a Story.");
      }

      let musicData = null;

      // Preserve the existing Story Music upload handling.
      if (typeof File !== "undefined" && music instanceof File) {
        musicData = await uploadMusic(music);
      } else if (music) {
        musicData = music;
      }

      const media = [];

      // Existing Cloudinary image path.
      if (cloudinaryUrl) {
        media.push({
          url: cloudinaryUrl,
          type: "image",
        });
      }

      // Ordinary Story media: image, video or audio.
      else if (file) {
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/") &&
          !file.type.startsWith("audio/")
        ) {
          throw new Error("Unsupported Story media type.");
        }

        file = await compressStoryMedia(file);

        if (!file || !file.type) {
          throw new Error("Story media processing failed.");
        }

        const uploadResponse = await fetch(
          `${API_BASE}/api/r2/story-upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": file.type,
            },
            body: file,
          }
        );

        const uploadData = await uploadResponse.json();

        if (
          !uploadResponse.ok ||
          !uploadData.success ||
          !uploadData.fileUrl ||
          !uploadData.key
        ) {
          throw new Error(
            uploadData.error || "Story media upload failed."
          );
        }

        const mediaItem = {
          url: uploadData.fileUrl,
          key: uploadData.key,
          type: file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("audio/")
              ? "audio"
              : "video",
        };

        if (
          mediaItem.type === "video" &&
          thumbnailFile instanceof Blob &&
          thumbnailFile.size > 0
        ) {
          try {
            const thumbnailResponse = await fetch(
              `${API_BASE}/api/r2/story-upload`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": thumbnailFile.type || "image/jpeg",
                },
                body: thumbnailFile,
              }
            );

            const thumbnailData = await thumbnailResponse.json();

            if (
              !thumbnailResponse.ok ||
              !thumbnailData.success ||
              !thumbnailData.fileUrl ||
              !thumbnailData.key
            ) {
              throw new Error(
                thumbnailData.error || "Story thumbnail upload failed."
              );
            }

            mediaItem.thumbnail = thumbnailData.fileUrl;
            mediaItem.thumbnailKey = thumbnailData.key;
          } catch (thumbnailError) {
            console.warn(
              "Story uploaded without an R2 thumbnail:",
              thumbnailError
            );
          }
        } else if (thumbnailUrl && mediaItem.type === "video") {
          mediaItem.thumbnail = thumbnailUrl;
        }

        media.push(mediaItem);
      }

      // Save Story to the backend.
      const response = await fetch(`${API_BASE}/api/storyR2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          textStyle,
          music: musicData,
          stickers,
          backgroundColor,
          media,
        }),
      });

      const story = await response.json();

      if (!response.ok) {
        throw new Error(
          story.error || "Failed to save Story."
        );
      }

      setProgress(100);

      return story;
    } catch (err) {
      console.error("Story Upload Error:", err);
      setError(err.message || "Story upload failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadStory,
    loading,
    progress,
    error,
  };
}
