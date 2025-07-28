// import {useEffect, useState, useRef} from 'react';

// import {
//   StyleSheet,
//   View,
//   Image,
//   Dimensions,
//   Platform,
//   Text,
// } from 'react-native';
// import {InferenceSession, Tensor} from 'onnxruntime-react-native';
// import {Camera, useCameraDevices} from 'react-native-vision-camera';
// import RNFS from 'react-native-fs';
// import ImageResizer from 'react-native-image-resizer';
// import {decode} from 'base64-arraybuffer';
// import {Buffer} from 'buffer';
// import PhotoManipulator from 'react-native-photo-manipulator';
// import ImageEditor from '@react-native-community/image-editor';
// import jpeg from 'jpeg-js';
// import {decodeJpeg} from '@jsquash/jpeg';

// export default function ARScreen() {
//   //debug
//   const [originalUri, setOriginalUri] = useState(null);
//   const [croppedUri, setCroppedUri] = useState(null);
//   const [neckPosition, setNeckPosition] = useState(null);
//   //
//   const [hasPermission, setHasPermission] = useState(false);
//   const [model, setModel] = useState(null);
//   const [overlayPos, setOverlayPos] = useState(null);
//   const cameraRef = useRef(null);
//   const devices = useCameraDevices();
//   const device = devices[1]; // Assuming front camera, adjust if needed
//   const ORNAMENT_IMAGE = require('../../assets/icons/earring.png');
//   const screen = Dimensions.get('window');

//   const KEYPOINT_INDEX = 3;

//   const MODEL_WIDTH = 256;
//   const MODEL_HEIGHT = 192;
//   const DIM_BATCH_SIZE = 1;
//   const DIM_PIXEL_SIZE = 3;
//   const IMAGE_SIZE_X = 192; // Height
//   const IMAGE_SIZE_Y = 256; // Width

//   // ImageNet Mean and Std
//   const MEAN = [0.485, 0.456, 0.406];
//   const STD = [0.229, 0.224, 0.225];

//   useEffect(() => {
//     (async () => {
//       const status = await Camera.requestCameraPermission();
//       setHasPermission(status === 'authorized' || status === 'granted');
//       await loadModel();
//     })();
//   }, []);

//   async function loadModel() {
//     try {
//       let modelPath;
//       if (Platform.OS === 'android') {
//         const targetPath = RNFS.DocumentDirectoryPath + '/end2end.onnx';
//         await RNFS.copyFileAssets('end2end.onnx', targetPath);
//         modelPath = 'file://' + targetPath;
//       } else {
//         modelPath = 'file://' + RNFS.MainBundlePath + '/end2end.onnx';
//       }
//       const session = await InferenceSession.create(modelPath);
//       setModel(session);
//     } catch (err) {
//       console.error('Model Load Error:', err);
//     }
//   }

//   async function preprocessImage(uri) {
//     const properUri = uri.startsWith('file://') ? uri : 'file://' + uri;
//     //
//     setOriginalUri(properUri);

//     // Get image dimensions
//     const {width, height} = await new Promise((resolve, reject) => {
//       Image.getSize(
//         properUri,
//         (w, h) => resolve({width: w, height: h}),
//         reject,
//       );
//     });
//     // Calculate crop area for face and neck (upper 1/3 to 2/3 of the image)
//     const cropWidth = width;
//     const cropHeight = height * 0.5; // Adjust this ratio based on your needs
//     const offsetY = height * 0.11; // Start cropping from 25% down the image

//     // const offsetX = Math.max(0, (size.width - MODEL_WIDTH) / 2);
//     // const offsetY = Math.max(0, (size.height - MODEL_HEIGHT) / 2);

//     try {
//       const cropData = {
//         offset: {x: 0, y: offsetY},
//         size: {width: cropWidth, height: cropHeight},
//         displaySize: {width: MODEL_WIDTH, height: MODEL_HEIGHT},
//         resizeMode: 'stretch',
//       };

//       const resizedUri = await ImageEditor.cropImage(properUri, cropData);
//       console.log('Resized Image URI:', resizedUri);

//       const finalUri =
//         typeof resizedUri === 'string' ? resizedUri : resizedUri.uri;
//       setCroppedUri(finalUri);
//       const filePath = resizedUri.uri.replace('file://', '');
//       const base64String = await RNFS.readFile(filePath, 'base64');
//       // convertToFloat32(base64String, MODEL_WIDTH, MODEL_HEIGHT);
//       return await convertToFloat32(base64String, MODEL_WIDTH, MODEL_HEIGHT);
//     } catch (err) {
//       console.error('ImageEditor resize error:', err);
//     }
//   }

//   function convertToFloat32(base64Data, width, height) {
//     const buffer = Buffer.from(base64Data, 'base64');
//     const raw = jpeg.decode(buffer, {useTArray: true});
//     //Width and height is correct  - Checked
//     const {data} = raw;
//     return bitmapToFloat32Array(data);

//     // const buffer = Buffer.from(base64Data, 'base64');
//     // const raw = jpeg.decode(buffer, {useTArray: true});
//     // console.log('raw', raw);
//     // const {data} = raw;
//     // // console.log('data', data);
//     // // console.log('data', data.length);
//     // const float32Array = new Float32Array(data.length);
//     // for (let i = 0; i < data.length; i++) {
//     //   float32Array[i] = data[i] / 255.0;
//     // }
//     // return float32Array;
//     //New..........
//     // const binaryBuffer = decode(base64Data);
//     // const bytes = new Uint8Array(binaryBuffer);
//     // const floatArray = new Float32Array(3 * height * width);
//     // const mean = [0.485, 0.456, 0.406];
//     // const std = [0.229, 0.224, 0.225];
//     // let pixelIndex = 0;
//     // for (let i = 0; i < bytes.length; i += 4) {
//     //   const r = bytes[i] / 255;
//     //   const g = bytes[i + 1] / 255;
//     //   const b = bytes[i + 2] / 255;
//     //   const x = pixelIndex % width;
//     //   const y = Math.floor(pixelIndex / width);
//     //   const idxR = y * width + x;
//     //   const idxG = height * width + idxR;
//     //   const idxB = 2 * height * width + idxR;
//     //   floatArray[idxR] = (r - mean[0]) / std[0];
//     //   floatArray[idxG] = (g - mean[1]) / std[1];
//     //   floatArray[idxB] = (b - mean[2]) / std[2];
//     //   pixelIndex++;
//     // }
//     // return floatArray;
//   }

//   function bitmapToFloat32Array(pixels) {
//     const floatArray = new Float32Array(
//       DIM_BATCH_SIZE * DIM_PIXEL_SIZE * IMAGE_SIZE_X * IMAGE_SIZE_Y,
//     );
//     const stride = IMAGE_SIZE_X * IMAGE_SIZE_Y; // 192 * 256
//     for (let i = 0; i < IMAGE_SIZE_X; i++) {
//       // i: 0..191 (height)
//       for (let j = 0; j < IMAGE_SIZE_Y; j++) {
//         // j: 0..255 (width)

//         const idx = (i * IMAGE_SIZE_Y + j) * 4;
//         const r = pixels[idx];
//         const g = pixels[idx + 1];
//         const b = pixels[idx + 2];

//         const chwIdx = i * IMAGE_SIZE_Y + j;

//         floatArray[chwIdx] = (r / 255 - MEAN[0]) / STD[0]; // Red channel
//         floatArray[chwIdx + stride] = (g / 255 - MEAN[1]) / STD[1]; // Green channel
//         floatArray[chwIdx + stride * 2] = (b / 255 - MEAN[2]) / STD[2]; // Blue channel
//       }
//     }
//     return floatArray;
//   }

//   // function processModelOutput(outputTensor) {
//   //   // Assuming output is [1, num_keypoints, 2] where last dimension is (x,y)
//   //   const outputData = outputTensor.data;
//   //   const dims = outputTensor.dims;

//   //   // Get neck keypoint coordinates (normalized to 0-1)
//   //   const neckX = outputData[NECK_KEYPOINT_INDEX * 2];
//   //   const neckY = outputData[NECK_KEYPOINT_INDEX * 2 + 1];

//   //   // Get shoulder keypoints for necklace width
//   //   const leftShoulderX = outputData[LEFT_SHOULDER_INDEX * 2];
//   //   const rightShoulderX = outputData[RIGHT_SHOULDER_INDEX * 2];

//   //   // Calculate necklace width based on shoulder distance
//   //   const necklaceWidth = Math.abs(rightShoulderX - leftShoulderX) * MODEL_WIDTH;

//   //   return {
//   //     x: neckX * MODEL_WIDTH,  // Convert to pixel coordinates
//   //     y: neckY * MODEL_HEIGHT,
//   //     width: necklaceWidth * 1.2, // Slightly wider than shoulder distance
//   //     angle: 0 // Can calculate rotation if needed
//   //   };
//   // }

//   function getMaxIndex(arr) {
//     let max = -Infinity,
//       index = -1;
//     for (let i = 0; i < arr.length; i++) {
//       if (arr[i] > max) {
//         max = arr[i];
//         index = i;
//       }
//     }
//     return index;
//   }

//   function reshape1DTo2D(flatArray, rows, cols) {
//     const result = [];
//     for (let i = 0; i < rows; i++) {
//       const row = flatArray.slice(i * cols, (i + 1) * cols);
//       result.push(row);
//     }
//     return result;
//   }

//   useEffect(() => {
//     if (!cameraRef.current || !model) return;

//     const interval = setInterval(async () => {
//       try {
//         const photo = await cameraRef.current.takePhoto();
//         const inputData = await preprocessImage(photo.path);
//         if (!inputData) return;

//         //Trying with some dumy data

//         // let total = 192 * 256 * 3;
//         // const floatArrayDummy = new Float32Array(192 * 256 * 3);
//         // for (let i = 0; i < total; i++) {
//         //   floatArrayDummy[i] = Math.random();
//         // }

//         const feeds = {
//           [model.inputNames[0]]: new Tensor(
//             'float32',
//             inputData,
//             [1, 3, 256, 192],
//           ),
//         };

//         const outputs = await model.run(feeds);

//         const xFlatArray = Object.values(outputs['simcc_x'].cpuData);
//         const xDims = outputs['simcc_x'].dims; // [1, 26, 384]
//         const xReshaped = reshape1DTo2D(xFlatArray, xDims[1], xDims[2]);
//         console.log('Reshaped simcc_x:', xReshaped); // [26][384]

//         // Reshape simcc_y
//         const yFlatArray = Object.values(outputs['simcc_y'].cpuData);
//         const yDims = outputs['simcc_y'].dims; // [1, 26, 384]
//         const yReshaped = reshape1DTo2D(yFlatArray, yDims[1], yDims[2]);
//         console.log('Reshaped simcc_y:', yReshaped); // [26][384]

//         // Example: Access keypoint 18 (Neck) and get max index
//         const keypointIndex = 18;
//         if (keypointIndex >= xDims[1]) {
//           console.log('Keypoint index out of range');
//           return;
//         }

//         const xSlice = xReshaped[keypointIndex];
//         const ySlice = yReshaped[keypointIndex];

//         const xIdx = getMaxIndex(xSlice);
//         const yIdx = getMaxIndex(ySlice);

//         const confidenceX = xSlice[xIdx];
//         const confidenceY = ySlice[yIdx];
//         const confidence = 0.5 * (confidenceX + confidenceY);

//         console.log(
//           `Keypoint [${keypointIndex}] -> xIdx: ${xIdx}, yIdx: ${yIdx}, confidence: ${confidence}`,
//         );

//         // if (confidence < 0.7) {
//         //   console.log('Low confidence, skipping overlay');
//         //   setOverlayPos(null);
//         //   return;
//         // }

//         // Convert to screen coordinates
//         const xCoord = (xIdx / xDims[2]) * screen.width;
//         const yCoord = (yIdx / yDims[2]) * screen.height;

//         console.log(`Screen Coordinates: X=${xCoord}, Y=${yCoord}`);

//         setOverlayPos({x: xCoord, y: yCoord});
//         // const flatArray = Object.values(outputs.simcc_x.cpuData); // Array of length 9984

//         // // Step 2: Reshape to [1, 26, 384]
//         // const reshaped = [];
//         // const batch = [];

//         // for (let i = 0; i < 26; i++) {
//         //   const row = flatArray.slice(i * 384, (i + 1) * 384);
//         //   batch.push(row);
//         // }

//         // reshaped.push(batch); // Final shape: [1, 26, 384]

//         // console.log(reshaped);
//         // //Process the output
//         // // const neckPosition = processModelOutput(outputs[model.outputNames[0]]);
//         // // setNeckPosition(neckPosition);
//         // const xData = outputs['simcc_x'].cpuData;
//         // const yData = outputs['simcc_y'].cpuData;

//         // const numKeypoints = outputs['simcc_x'].dims[1];
//         // const simccWidth = outputs['simcc_x'].dims[2];
//         // const simccHeight = outputs['simcc_y'].dims[2];

//         // if (KEYPOINT_INDEX >= numKeypoints) return;

//         // const xSlice = xData.slice(
//         //   KEYPOINT_INDEX * simccWidth,
//         //   (KEYPOINT_INDEX + 1) * simccWidth,
//         // );
//         // const ySlice = yData.slice(
//         //   KEYPOINT_INDEX * simccHeight,
//         //   (KEYPOINT_INDEX + 1) * simccHeight,
//         // );
//         // const xIdx = getMaxIndex(xSlice);
//         // const yIdx = getMaxIndex(ySlice);
//         // const confidenceX = xSlice[xIdx];
//         // const confidenceY = ySlice[yIdx];
//         // const confidenceThreshold = 0.05;

//         // if (
//         //   confidenceX <= confidenceThreshold ||
//         //   confidenceY <= confidenceThreshold
//         // ) {
//         //   console.log('Low confidence, skipping this frame');
//         //   return;
//         // }

//         // let x = (xIdx / simccWidth) * screen.width;
//         // let y = (yIdx / simccHeight) * screen.height;
//         // setOverlayPos({x, y});
//       } catch (err) {
//         console.error('Inference error:', err);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [model]);

//   if (!device) {
//     return (
//       <View style={styles.container}>
//         <Text>Loading camera...</Text>
//       </View>
//     );
//   }

//   if (!hasPermission) {
//     return (
//       <View style={styles.container}>
//         <Text>No camera permission</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Camera
//         ref={cameraRef}
//         style={{flex: 1, height: '100%'}}
//         device={device}
//         isActive
//         photo
//       />
//       {/* <View> */}
//       {/* {originalUri && (
//     <View style={{ marginBottom: 10 }}>
//       <Text>Original Image</Text>
//       <Image
//         source={{ uri: originalUri }}
//         style={{ width: 200, height: 200, borderWidth: 1, borderColor: 'blue' }}
//         resizeMode="contain"
//       />
//     </View>
//   )}

//   {croppedUri && (
//     <View>
//       <Text>Cropped Image</Text>
//       <Image
//         source={{ uri: croppedUri }}
//         style={{ width: MODEL_WIDTH, height: MODEL_HEIGHT, borderWidth: 1, borderColor: 'green' }}
//         resizeMode="contain"
//       />
//     </View>
//   )}
// </View> */}

//       {overlayPos && (
//         <Image
//           source={ORNAMENT_IMAGE}
//           style={[styles.ornament, {left: overlayPos.x, top: overlayPos.y}]}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   ornament: {
//     position: 'absolute',
//     width: 100,
//     height: 150,
//     resizeMode: 'contain',
//   },
// });

import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
} from 'react-native';
import {Camera, useCameraDevices,useCameraDevice} from 'react-native-vision-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import RNFS from 'react-native-fs';
import {NativeModules} from 'react-native';
const {OnnxModule} = NativeModules; // ✅ Use this to access your native Kotlin moduleimport ORNAMENT_IMAGE from './ornament.png'; // Your overlay image

const ARScreen = () => {
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  //const [overlayPos, setOverlayPos] = useState<{ x: number, y: number } | null>(null);
  const [overlayPos, setOverlayPos] = useState(null);
  const [error, setError] = useState('');
  const device = useCameraDevice('front')
  console.log('Device:', device);
  

  //console.log('device',device);
  //console.log('devices',devices);

  // useEffect(() => {
  //   console.log("entered into useffect of permission request");

  //   const getPermissions = async () => {
  //     try {
  //       const cameraPermission =
  //         Platform.OS === 'android'
  //           ? await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
  //           : await request(PERMISSIONS.IOS.CAMERA);

  //       if (
  //         cameraPermission === 'granted' ||
  //         cameraPermission === RESULTS.GRANTED
  //       ) {
  //         setHasPermission(true);
  //       } else {
  //         setHasPermission(false);
  //       }
  //     } catch (err) {
  //       console.error('Permission error:', err);
  //     }
  //   };

  //   getPermissions();
  //   console.log("existing from useffect of permission request");

  // }, []);

  useEffect(() => {
    const initOnnxModel = async () => {
      try {
        const result = await OnnxModule.initializeModel();
        console.log("✅ ONNX model initialized:", result);
      } catch (err) {
        console.error("❌ ONNX model init failed:", err);
        setError("ONNX model initialization failed");
      }
    };
  
    initOnnxModel();
  }, []);
  

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized' || status === 'granted');
      console.log('Camera permission status:', status);
    })();
  }, []);



  useEffect(() => {
    console.log('Permission state updated:', hasPermission);
  }, [hasPermission]);
  // useEffect(() => {
  //   console.log('📷 All Devices:', devices);
  //   console.log('📷 Selected Device:', device);
  // }, [devices]);

  // useEffect(() => {
  //   let interval;

  //   console.log('hasPermission check', hasPermission);
  //   console.log('device check', device);

  //   console.log('cameraRef check', cameraRef.current);

  //   if (hasPermission && cameraRef.current) {
  //     interval = setInterval(async () => {
  //       try {
  //         const photo = await cameraRef.current?.takePhoto({
  //           qualityPrioritization: 'quality',
  //           flash: 'off',
  //         });

  //         if (photo?.path) {
  //           const properUri = photo.path.startsWith('file://')
  //             ? photo.path
  //             : 'file://' + photo.path;
  //           const base64 = await RNFS.readFile(properUri, 'base64');

  //           const coords = await OnnxModule.runModelFromBase64(base64);
  //           console.log('🟢 Coordinates from model:', coords);

  //           if (coords?.x && coords?.y) {
  //             setOverlayPos({x: coords.x, y: coords.y});
  //           } else {
  //             console.warn('Invalid coordinates from model');
  //           }
  //         }
  //       } catch (err) {
  //         console.error('Error capturing or processing photo:', err);
  //         setError(err.message || 'Unknown error');
  //       }
  //     }, 3000); // every 3 seconds
  //   }

  //   return () => clearInterval(interval);
  // }, [hasPermission]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const res = await OnnxModule.loadModel(); // Call native model loader
        console.log('ONNX Model Loaded:', res);
      } catch (err) {
        console.error('Failed to load model:', err);
      }
    };
  
    initialize();
  }, []);
  

  useEffect(() => {
    let interval;
  
    if (hasPermission && isCameraReady && cameraRef.current) {
      interval = setInterval(async () => {
        try {
          const photo = await cameraRef.current.takePhoto({
            qualityPrioritization: 'quality',
            flash: 'off',
          });
  
          const uri = photo?.path?.startsWith('file://') ? photo.path : `file://${photo?.path}`;
          const base64 = await RNFS.readFile(uri, 'base64');
          const coords = await OnnxModule.runModelFromBase64(base64);
  
          if (coords?.x && coords?.y) {
            setOverlayPos({ x: coords.x, y: coords.y });
          } else {
            console.warn('Invalid coordinates from model');
          }
        } catch (err) {
          console.error('Error taking photo:', err);
          setError(err.message || 'Unknown error');
        }
      }, 3000);
    }
  
    return () => clearInterval(interval);
  }, [hasPermission, isCameraReady]);
  

  //console.log("haspermission-"+hasPermission);
  //  console.log("device"+device);
  if (!device || !hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          Camera not available or permission denied.
        </Text>
      </View>
    );
  }
  console.log("hasPermission:", hasPermission);
console.log("device:", device);
//console.log("cameraRef.current BEFORE render:", cameraRef.current);


  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        onInitialized={() => {
          console.log('✅ Camera is ready');
          setIsCameraReady(true);
        }}
      />

      {overlayPos && (
        <Image
          source={ORNAMENT_IMAGE}
          style={[
            styles.overlay,
            {
              left: overlayPos.x - 25,
              top: overlayPos.y - 25,
            },
          ]}
        />
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

export default ARScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  errorBox: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#ffcccc',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#990000',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  text: {
    color: '#fff',
  },
});
