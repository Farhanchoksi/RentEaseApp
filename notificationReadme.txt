How to use push notifications in RentEase:

1. NotificationService.js is created for FCM logic (request permission, get FCM token, handle foreground notifications).
2. Call requestUserPermission() and getFcmToken() in App.tsx (on app start, after login).
3. Use setupNotificationListeners() to show notifications in foreground.
4. For sending notifications, use Firebase Console (Cloud Messaging tab) or FCM REST API (free for testing).
5. For background/quit notifications, see react-native-firebase messaging docs for index.js setup.

No paid services required. This is 100% free for up to thousands of notifications/month.
