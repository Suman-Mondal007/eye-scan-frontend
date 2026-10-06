import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCgOKP-abGsboZjlvGFoJeNV-hJ0rldWw8",
  authDomain: "eyescanapp-b90df.firebaseapp.com",
  projectId: "eyescanapp-b90df",
  storageBucket: "eyescanapp-b90df.appspot.com",
  messagingSenderId: "728433674254",
  appId: "1:728433674254:web:800d4e85ecd3c1e9fe945f"
};

// Initialize Firebase (Singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
