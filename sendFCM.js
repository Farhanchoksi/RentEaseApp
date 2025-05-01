const { google } = require('googleapis');
const fetch = require('node-fetch');

// Service account JSON ka path (update as per your file location)
const serviceAccount = require('./android/app/rent-management-data-3d8cbe6e9746.json');

// Project ID (Firebase console se)
const projectId = 'rent-management-data';

// Tenant ka FCM token (Firestore se le lo aur yahan daalo)
const targetFcmToken = 'PASTE_YOUR_TENANT_FCM_TOKEN_HERE';

async function getAccessToken() {
  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/firebase.messaging'],
    null
  );
  await jwtClient.authorize();
  return jwtClient.credentials.access_token;
}

async function sendNotification() {
  const accessToken = await getAccessToken();
  const message = {
    message: {
      token: targetFcmToken,
      notification: {
        title: 'RentEase Test',
        body: 'This is a notification from Node.js script!',
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  const data = await response.json();
  console.log(data);
}

sendNotification().catch(console.error);
