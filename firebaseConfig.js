// Firebase initialization for RentEase

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// NOTE: Native config (google-services.json/GoogleService-Info.plist) must be placed in android/app or ios/ folder respectively.
// No need to manually initialize app if native config is present.

export { auth, firestore, messaging };
