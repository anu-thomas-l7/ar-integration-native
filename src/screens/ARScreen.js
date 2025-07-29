import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraDevice,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import {NativeModules} from 'react-native';
const {OnnxModule} = NativeModules;

const ARScreen = () => {
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [coords, setCoords] = useState(null); // store all coords
  const [selectedKeypoint, setSelectedKeypoint] = useState('LeftEar'); // 'LeftEar' | 'RightEar' | 'Neck'
  const [error, setError] = useState('');
  const device = useCameraDevice('front');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized' || status === 'granted');
      console.log('Camera permission status:', status);
    })();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const res = await OnnxModule.loadModel();
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
          const result = await OnnxModule.runModelFromBase64(base64);
          console.log('coords', result);

          if (result) {
            setCoords(result);
          }
        } catch (err) {
          console.error('Error taking photo:', err);
          setError(err.message || 'Unknown error');
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [hasPermission, isCameraReady]);

  const currentCoord = coords?.[selectedKeypoint];
  console.log('currentCoord', currentCoord);

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

      {currentCoord && (
        <Image
          source={
            selectedKeypoint === 'Neck'
              ? require('./../../assets/icons/necklace.png')
              : require('./../../assets/icons/earring.png')
          }
          style={[
            selectedKeypoint === 'Neck' ? styles.necklace : styles.overlay,
            {
              left:
                currentCoord.x -
                (selectedKeypoint === 'LeftEar'
                  ? 0
                  : selectedKeypoint == 'Neck'
                  ? -80
                  : 0),
              top:
                currentCoord.y -
                (selectedKeypoint === 'LeftEar'
                  ? -90
                  : selectedKeypoint == 'Neck'
                  ? -80
                  : 0),
            },
          ]}
        />
      )}

      <View style={styles.controls}>
        {['LeftEar', 'RightEar', 'Neck'].map(key => (
          <TouchableOpacity
            key={key}
            style={[
              styles.button,
              selectedKeypoint === key && styles.buttonActive,
            ]}
            onPress={() => setSelectedKeypoint(key)}>
            <Text style={styles.buttonText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  necklace: {
    position: 'absolute',
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  errorBox: {
    position: 'absolute',
    bottom: 80,
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
  controls: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  buttonActive: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
  },
});
