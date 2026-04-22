import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBhhpRc77hH9e2dc96bS0Vz4XOzTZ7seL4",
  authDomain: "q-gl-database.firebaseapp.com",
  projectId: "q-gl-database",
  storageBucket: "q-gl-database.firebasestorage.app",
  messagingSenderId: "998276087502",
  appId: "1:998276087502:web:e2734aacd5bdd355365a9f",
  measurementId: "G-S9KEPVCK9L"
};

// Initialize Firebase for Client side
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


export { db, auth };