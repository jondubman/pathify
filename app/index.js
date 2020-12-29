/** @format */

import { AppRegistry } from 'react-native';
import 'react-native-get-random-values'; // polyfill for crypto.getRandomValues
import App from './App';
import { name as appName } from './app.json'; // appName will be "Pathify", which also appears in AppDelegate.m

AppRegistry.registerComponent(appName, () => App);
