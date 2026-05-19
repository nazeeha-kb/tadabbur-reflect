import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import firebaseApp from "./firebaseClient";

let auth;
if (typeof window !== "undefined") {
  auth = getAuth(firebaseApp);
}

export async function getFirebaseIdToken() {
  if (typeof window === "undefined") return null;
  try {
    const { getIdToken } = await import("firebase/auth");
    const current = auth.currentUser;
    if (!current) return null;
    // Use the SDK method to return a fresh token
    return await current.getIdToken(true);
  } catch (e) {
    return null;
  }
}

export async function signInWithGoogle() {
  if (typeof window === "undefined") throw new Error("Client-only");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
