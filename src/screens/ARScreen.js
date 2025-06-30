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
import RNFS, {readFile} from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

export default function ARScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [model, setModel] = useState(null);
  const [overlayPos, setOverlayPos] = useState(null);
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices[1];
  const screen = Dimensions.get('window');

  const ORNAMENT_IMAGE = require('../../assets/icons/necklace.png');
  const KEYPOINT_INDEX = 18;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized' || status === 'granted');
      loadModel();
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
      console.error('Model Load Error', err);
    }
  }

  async function preprocessImage(uri, modelWidth, modelHeight) {
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

  function getMaxIndex(arr) {
    let max = -Infinity,
      index = -1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i];
        index = i;
      }
    }
    return index;
  }

  useEffect(() => {
    if (!cameraRef.current || !model) return;

    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current.takePhoto();
        const {width, height, isMirrored} = photo;

        const modelW = 256;
        const modelH = 192;
        const inputData = await preprocessImage(photo.path, modelW, modelH);

        const feeds = {
          [model.inputNames[0]]: new Tensor('float32', inputData, [
            1,
            3,
            modelW,
            modelH,
          ]),
        };
        const outputs = await model.run(feeds);
        console.log('outputs', outputs);
        const xData = outputs['simcc_x'].cpuData;
        const yData = outputs['simcc_y'].cpuData;

        const numKeypoints = outputs['simcc_x'].dims[1];
        const simccWidth = outputs['simcc_x'].dims[2];
        const simccHeight = outputs['simcc_y'].dims[2];

        if (KEYPOINT_INDEX >= numKeypoints) return;

        const xSlice = xData.slice(
          KEYPOINT_INDEX * simccWidth,
          (KEYPOINT_INDEX + 1) * simccWidth,
        );
        const ySlice = yData.slice(
          KEYPOINT_INDEX * simccHeight,
          (KEYPOINT_INDEX + 1) * simccHeight,
        );
        console.log('xSlice', xSlice);
        console.log('ySlice', ySlice);
        const xIdx = getMaxIndex(xSlice);
        const yIdx = getMaxIndex(ySlice);
        console.log('xIdx', xIdx);
        console.log('yIdx', yIdx);
        const confidenceX = xSlice[xIdx];
        const confidenceY = ySlice[yIdx];
        // console.log('confidenceX', confidenceX);
        // console.log('confidenceY', confidenceY);
        const confidenceThreshold = 0.05;

        if (
          confidenceX <= confidenceThreshold ||
          confidenceY <= confidenceThreshold
        ) {
          console.log('Low confidence, skipping this frame');
          return;
        }

        let x = (xIdx / simccWidth) * screen.width;
        let y = (yIdx / simccHeight) * screen.height;

        if (isMirrored) x = screen.width - x;

        setOverlayPos({x, y});
      } catch (err) {
        console.error('Inference error:', err);
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
      {overlayPos && (
        <Image
          source={ORNAMENT_IMAGE}
          style={[
            styles.ornament,
            {left: overlayPos.x - 50, top: overlayPos.y + 50},
          ]}
        />
      )}
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
