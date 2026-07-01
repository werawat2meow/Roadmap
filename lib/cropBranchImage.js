export default function getCroppedBranchImage(imageSrc,pixelCrop,width = 1200,height = 675) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

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
        width,
        height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("สร้างรูปไม่สำเร็จ"));
            return;
          }

          resolve(
            new File(
              [blob],
              `branch-${Date.now()}.jpg`,
              {
                type: "image/jpeg",
              }
            )
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