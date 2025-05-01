/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendUnpaidRentReminders = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    const billsSnapshot = await admin.firestore().collection('bills').where('status', '==', 'unpaid').get();
    const tokens = new Set();

    for (const doc of billsSnapshot.docs) {
      const bill = doc.data();
      // Get tenant's user doc
      const userSnap = await admin.firestore().collection('users').doc(bill.tenantPhone).get();
      if (userSnap.exists && userSnap.data().fcmToken) {
        tokens.add(userSnap.data().fcmToken);
      }
    }

    if (tokens.size === 0) {
      console.log('No unpaid tenants found.');
      return null;
    }

    const message = {
      notification: {
        title: 'Rent Payment Reminder',
        body: 'Aapka rent abhi tak pending hai. Kripya jaldi payment karein!',
      },
      tokens: Array.from(tokens),
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notifications sent:', response.successCount);
    } catch (err) {
      console.error('Error sending notifications:', err);
    }
    return null;
  });
