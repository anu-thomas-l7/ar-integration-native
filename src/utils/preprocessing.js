import ImageResizer from 'react-native-image-resizer';
import RNFS, {readFile} from 'react-native-fs';

const modelWidth = 256;
const modelHeight = 192;

export async function manipulateImageToTensor(uri) {
  const resized = await ImageResizer.createResizedImage(
    uri,
    modelWidth,
    modelHeight,
    'PNG',
    100,
    0,
  );

  const imagePath = resized.uri.replace('file://', '');
  const imageData = await readFile(imagePath, 'base64');
  const binary = atob(imageData);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; ++i) {
    bytes[i] = binary.charCodeAt(i);
  }

  const floatArray = new Float32Array(3 * modelHeight * modelWidth);
  let idx = 0;

  for (let i = 0; i < modelHeight * modelWidth; i++) {
    const r = bytes[i * 4] || 0;
    const g = bytes[i * 4 + 1] || 0;
    const b = bytes[i * 4 + 2] || 0;

    floatArray[idx++] = r / 255;
    floatArray[idx++] = g / 255;
    floatArray[idx++] = b / 255;
  }

  return floatArray;
}
