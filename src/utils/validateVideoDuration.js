const validateVideoDuration = (file, maxSeconds = 60) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let completed = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const finish = (callback, value) => {
      if (completed) return;
      completed = true;
      cleanup();
      callback(value);
    };

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const duration = Number(video.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        finish(reject, "Unable to determine video duration.");
      } else if (duration < 1) {
        finish(reject, "Reels must be at least 1 second long.");
      } else if (duration > maxSeconds) {
        finish(reject, `Reels cannot exceed ${maxSeconds} seconds.`);
      } else {
        finish(resolve, duration);
      }
    };

    video.onerror = () => {
      finish(reject, "Invalid or unsupported video file.");
    };

    video.src = objectUrl;
  });
};

export default validateVideoDuration;
