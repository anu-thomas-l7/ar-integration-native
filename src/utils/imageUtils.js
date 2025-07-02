import jpeg from 'jpeg-js';

// export function decodeJpeg(buffer) {
//   const raw = jpeg.decode(buffer, {useTArray: true});
//   return {
//     width: raw.width,
//     height: raw.height,
//     data: raw.data,
//   };
// }

export function resizeImage(srcData, srcWidth, srcHeight, dstWidth, dstHeight) {
  const dstData = new Uint8Array(dstWidth * dstHeight * 4);

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor((x / dstWidth) * srcWidth);
      const srcY = Math.floor((y / dstHeight) * srcHeight);

      const srcIndex = (srcY * srcWidth + srcX) * 4;
      const dstIndex = (y * dstWidth + x) * 4;

      dstData[dstIndex] = srcData[srcIndex];
      dstData[dstIndex + 1] = srcData[srcIndex + 1];
      dstData[dstIndex + 2] = srcData[srcIndex + 2];
      dstData[dstIndex + 3] = srcData[srcIndex + 3];
    }
  }

  return dstData;
}

export function normalizeAndConvert(rgbaData, width, height) {
  const floatArray = new Float32Array(3 * height * width);

  const IMAGE_MEAN = [0.485, 0.456, 0.406];
  const IMAGE_STD = [0.229, 0.224, 0.225];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      const r = rgbaData[index] / 255;
      const g = rgbaData[index + 1] / 255;
      const b = rgbaData[index + 2] / 255;

      const pixelIndex = y * width + x;

      floatArray[pixelIndex] = (r - IMAGE_MEAN[0]) / IMAGE_STD[0];
      floatArray[height * width + pixelIndex] =
        (g - IMAGE_MEAN[1]) / IMAGE_STD[1];
      floatArray[2 * height * width + pixelIndex] =
        (b - IMAGE_MEAN[2]) / IMAGE_STD[2];
    }
  }

  return floatArray;
}
