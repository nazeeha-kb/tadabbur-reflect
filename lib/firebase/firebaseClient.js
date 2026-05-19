import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp = null;
if (typeof window !== "undefined") {
  if (!getApps().length) {
    firebaseApp = initializeApp(clientConfig);
  } else {
    firebaseApp = getApps()[0];
  }
}

export const clientDb = typeof window !== "undefined" && firebaseApp ? getFirestore(firebaseApp) : null;
export default firebaseApp;
