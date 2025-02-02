import { cert, initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeAdminApp(firebaseAdminConfig);
  }
}