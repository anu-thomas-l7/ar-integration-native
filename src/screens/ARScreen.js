import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraDevice,
} from 'react-native-vision-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import RNFS from 'react-native-fs';
import {NativeModules} from 'react-native';
import {Dimensions} from 'react-native';
const {OnnxModule} = NativeModules; // ✅ Use this to access your native Kotlin moduleimport ORNAMENT_IMAGE from './ornament.png'; // Your overlay image

const ARScreen = () => {
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  //const [overlayPos, setOverlayPos] = useState<{ x: number, y: number } | null>(null);
  const [overlayPos, setOverlayPos] = useState(null);
  const [error, setError] = useState('');
  const device = useCameraDevice('front');
  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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

          const uri = photo?.path?.startsWith('file://')
            ? photo.path
            : `file://${photo?.path}`;
          const base64 = await RNFS.readFile(uri, 'base64');
          const coords = await OnnxModule.runModelFromBase64(base64);
          console.log('coords', coords);
          console.log('x value', coords?.LeftEar.x);
          console.log('y value', coords?.LeftEar.y);
          if (coords && coords?.LeftEar) {
            console.log('x value', coords?.LeftEar.x);
            console.log('y value', coords?.LeftEar.y);
            setOverlayPos({x: coords.LeftEar.x, y: coords.LeftEar.y});
          } else {
            // console.warn('Invalid coordinates from model');
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
          source={require('./../../assets/icons/necklace.png')}
          style={[
            styles.overlay,
            {
              left:
                (overlayPos.x / 1920) * Dimensions.get('window').width - 110,
              top: (overlayPos.y / 2560) * Dimensions.get('window').height - 20,
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
    width: 60,
    height: 60,
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
