import { NativeModules } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const { OnnxModule } = NativeModules;

export const runModel = async () => {
  const result = await launchImageLibrary({ mediaType: 'photo' });

  if (result.assets && result.assets.length > 0) {
    const uri = result.assets[0].uri;

    const base64 = await RNFS.readFile(uri, 'base64');

    OnnxModule.runModelFromBase64(base64)
      .then((coords) => {
        console.log('🟢 Model Output:', coords);
      })
      .catch((err) => {
        console.error('🔴 Error Running Model:', err);
      });
  }
};
