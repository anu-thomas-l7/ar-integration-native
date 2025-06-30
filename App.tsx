// import './gesture-handler';
import React, {useEffect} from 'react';

import SplashScreen from 'react-native-splash-screen';

import {Navigator} from './src/navigation/navigator';
import {LogBox} from 'react-native';
LogBox.ignoreAllLogs(true);
export const App = () => {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return <Navigator />;
};
