import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function getFcmToken() {
  let fcmToken = await messaging().getToken();
  return fcmToken;
}

export function setupNotificationListeners() {
  // Foreground
  messaging().onMessage(async remoteMessage => {
    Alert.alert(
      remoteMessage.notification?.title || 'Notification',
      remoteMessage.notification?.body || ''
    );
  });
  // Background/quit handled in index.js (see docs)
}
