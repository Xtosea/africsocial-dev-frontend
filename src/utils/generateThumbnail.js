const generateThumbnail = (file) =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let finished = false;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    const finish = (blob = null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cleanup();
      resolve(blob);
    };

    const timeout = setTimeout(() => finish(null), 8000);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      try {
        const duration = Number.isFinite(video.duration)
          ? video.duration
          : 0;
        const target = duration > 1 ? 1 : 0;

        if (target === 0) {
          video.currentTime = 0;
        } else {
          video.currentTime = target;
        }
      } catch {
        finish(null);
      }
    };

    video.onloadeddata = () => {
      if (video.readyState >= 2 && video.currentTime === 0) {
        captureFrame();
      }
    };

    const captureFrame = () => {
      if (finished || !video.videoWidth || !video.videoHeight) {
        finish(null);
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        const maxDimension = 360;
        const scale = Math.min(
          1,
          maxDimension / video.videoWidth,
          maxDimension / video.videoHeight
        );

        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          finish(null);
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.65);
      } catch {
        finish(null);
      }
    };

    video.onseeked = captureFrame;
    video.onerror = () => finish(null);
    video.src = objectUrl;
    video.load();
  });

export default generateThumbnail;
