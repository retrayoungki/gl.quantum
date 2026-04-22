import admin from "firebase-admin";

// Use dynamic require or check if already initialized
// This pattern is safer for Next.js hot reloading
let db: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    const serviceAccount = require("./firebase-key.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

db = admin.firestore();

export { db };