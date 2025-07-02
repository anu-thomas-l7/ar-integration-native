import {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import {decode} from 'base64-arraybuffer';
import PhotoManipulator from 'react-native-photo-manipulator';
import ImageEditor from '@react-native-community/image-editor';
import jpeg from 'jpeg-js';
import {decodeJpeg} from '@jsquash/jpeg';

export default function ARScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [model, setModel] = useState(null);
  const [overlayPos, setOverlayPos] = useState(null);
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices[1]; // Assuming front camera, adjust if needed
  const ORNAMENT_IMAGE = require('../../assets/icons/necklace.png');
  const KEYPOINT_INDEX = 18;

  const MODEL_WIDTH = 256;
  const MODEL_HEIGHT = 192;
  const DIM_BATCH_SIZE = 1;
  const DIM_PIXEL_SIZE = 3;
  const IMAGE_SIZE_X = 192; // Height
  const IMAGE_SIZE_Y = 256; // Width

  // ImageNet Mean and Std
  const MEAN = [0.485, 0.456, 0.406];
  const STD = [0.229, 0.224, 0.225];

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized' || status === 'granted');
      await loadModel();
    })();
  }, []);

  async function loadModel() {
    try {
      let modelPath;
      if (Platform.OS === 'android') {
        const targetPath = RNFS.DocumentDirectoryPath + '/end2end.onnx';
        await RNFS.copyFileAssets('end2end.onnx', targetPath);
        modelPath = 'file://' + targetPath;
      } else {
        modelPath = 'file://' + RNFS.MainBundlePath + '/end2end.onnx';
      }
      const session = await InferenceSession.create(modelPath);
      setModel(session);
    } catch (err) {
      console.error('Model Load Error:', err);
    }
  }

  async function preprocessImage(uri) {
    const properUri = uri.startsWith('file://') ? uri : 'file://' + uri;
    console.log('properUri', properUri);
    try {
      const cropData = {
        offset: {x: 0, y: 0},
        size: {width: MODEL_WIDTH, height: MODEL_HEIGHT},
        displaySize: {width: MODEL_WIDTH, height: MODEL_HEIGHT},
        resizeMode: 'stretch',
      };

      const resizedUri = await ImageEditor.cropImage(properUri, cropData);
      console.log('Resized Image URI:', resizedUri);
      const filePath = resizedUri.uri.replace('file://', '');
      const base64String = await RNFS.readFile(filePath, 'base64');
      // convertToFloat32(base64String, MODEL_WIDTH, MODEL_HEIGHT);
      return await convertToFloat32(base64String, MODEL_WIDTH, MODEL_HEIGHT);
    } catch (err) {
      console.error('ImageEditor resize error:', err);
    }
  }

  function convertToFloat32(base64Data, width, height) {
    const buffer = Buffer.from(base64Data, 'base64');
    const raw = jpeg.decode(buffer, {useTArray: true});
    console.log('raw', raw);
    //Width and height is correct  - Checked
    const {data} = raw;
    return bitmapToFloat32Array(data);

    // const buffer = Buffer.from(base64Data, 'base64');
    // const raw = jpeg.decode(buffer, {useTArray: true});
    // console.log('raw', raw);
    // const {data} = raw;
    // // console.log('data', data);
    // // console.log('data', data.length);
    // const float32Array = new Float32Array(data.length);
    // for (let i = 0; i < data.length; i++) {
    //   float32Array[i] = data[i] / 255.0;
    // }
    // return float32Array;
    //New..........
    // const binaryBuffer = decode(base64Data);
    // const bytes = new Uint8Array(binaryBuffer);
    // const floatArray = new Float32Array(3 * height * width);
    // const mean = [0.485, 0.456, 0.406];
    // const std = [0.229, 0.224, 0.225];
    // let pixelIndex = 0;
    // for (let i = 0; i < bytes.length; i += 4) {
    //   const r = bytes[i] / 255;
    //   const g = bytes[i + 1] / 255;
    //   const b = bytes[i + 2] / 255;
    //   const x = pixelIndex % width;
    //   const y = Math.floor(pixelIndex / width);
    //   const idxR = y * width + x;
    //   const idxG = height * width + idxR;
    //   const idxB = 2 * height * width + idxR;
    //   floatArray[idxR] = (r - mean[0]) / std[0];
    //   floatArray[idxG] = (g - mean[1]) / std[1];
    //   floatArray[idxB] = (b - mean[2]) / std[2];
    //   pixelIndex++;
    // }
    // return floatArray;
  }

  function bitmapToFloat32Array(pixels) {
    const stride = IMAGE_SIZE_X * IMAGE_SIZE_Y;
    const floatArray = new Float32Array(
      DIM_BATCH_SIZE * DIM_PIXEL_SIZE * IMAGE_SIZE_X * IMAGE_SIZE_Y,
    );

    for (let i = 0; i < IMAGE_SIZE_X; i++) {
      for (let j = 0; j < IMAGE_SIZE_Y; j++) {
        const idx = (i * IMAGE_SIZE_Y + j) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        const chwIdx = i * IMAGE_SIZE_Y + j;

        floatArray[chwIdx] = (r / 255 - MEAN[0]) / STD[0]; // Red channel
        floatArray[chwIdx + stride] = (g / 255 - MEAN[1]) / STD[1]; // Green channel
        floatArray[chwIdx + stride * 2] = (b / 255 - MEAN[2]) / STD[2]; // Blue channel
      }
    }
    console.log('floatArray', floatArray);
    return floatArray;
  }

  useEffect(() => {
    if (!cameraRef.current || !model) return;

    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current.takePhoto();
        console.log('photo', photo);
        const inputData = await preprocessImage(photo.path);
        console.log('inputData', inputData);
        if (!inputData) return;

        //Trying with some dumy data

        // let total = 192 * 256 * 3;
        // const floatArrayDummy = new Float32Array(192 * 256 * 3);
        // for (let i = 0; i < total; i++) {
        //   floatArrayDummy[i] = Math.random();
        // }

        const feeds = {
          [model.inputNames[0]]: new Tensor('float32', floatArrayDummy, [
            1,
            3,
            MODEL_HEIGHT,
            MODEL_WIDTH,
            // MODEL_HEIGHT,
          ]),
        };

        const outputs = await model.run(feeds);
        console.log('Model Outputs:', outputs);

        //Process the output
      } catch (err) {
        console.error('Inference Error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [model]);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>No camera permission</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={{flex: 1, height: '100%'}}
        device={device}
        isActive
        photo
      />
      {/* {overlayPos && (
        <Image
          source={ORNAMENT_IMAGE}
          style={[
            styles.ornament,
            { left: overlayPos.x - 50, top: overlayPos.y + 50 },
          ]}
        />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  ornament: {
    position: 'absolute',
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
});
