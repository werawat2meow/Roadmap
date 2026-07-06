export default function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("ไม่สามารถประมวลผลรูปได้"));
        return;
      }

      const cropX = Math.round(pixelCrop.x);
      const cropY = Math.round(pixelCrop.y);
      const cropWidth = Math.round(pixelCrop.width);
      const cropHeight = Math.round(pixelCrop.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        500,
        500
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("ไม่สามารถสร้างไฟล์รูปได้"));
            return;
          }

          const file = new File(
            [blob],
            `employee-photo-${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );

          resolve(file);
        },
        "image/jpeg",
        0.92
      );
    };

    image.onerror = () => {
      reject(new Error("โหลดรูปไม่สำเร็จ"));
    };

    image.src = imageSrc;
  });
}