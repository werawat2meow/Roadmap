export default function getCroppedBranchImage(imageSrc,pixelCrop,aspect = 1) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const BASE_WIDTH = 1200;
      const outputWidth = BASE_WIDTH;
      const outputHeight = Math.round(BASE_WIDTH / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("ไม่สามารถประมวลผลรูปได้"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("สร้างรูปไม่สำเร็จ"));
            return;
          }

          resolve(
            new File([blob], `branch-${Date.now()}.jpg`, {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.95
      );
    };

    image.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
    image.src = imageSrc;
  });
}