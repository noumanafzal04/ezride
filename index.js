/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Required by FCM: keep a background handler registered for messages received
// while the app is backgrounded / quit. Notification-type payloads are rendered
// by the OS automatically; this is a no-op handler for them.
try {
    setBackgroundMessageHandler(getMessaging(getApp()), async () => {});
} catch (e) {
    // Firebase native module not linked yet (before a rebuild) — ignore.
}

AppRegistry.registerComponent(appName, () => App);
