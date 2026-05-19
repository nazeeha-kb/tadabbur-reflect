import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  const credentialConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  };

  // keep initialization idempotent and safe on server
  admin.initializeApp({
    credential: admin.credential.cert(credentialConfig),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export default admin;
