
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBjoBK7feqbPzON8BoOZNo4UQ3xbt5ZgkM",
    authDomain: "spincityrentalsnew.firebaseapp.com",
    projectId: "spincityrentalsnew",
    storageBucket: "spincityrentalsnew.firebasestorage.app",
    messagingSenderId: "252954471415",
    appId: "1:252954471415:web:01a747ebf09fb92d645cf2"
};

// Initialize Firebase using the v9 modular syntax
const app = initializeApp(firebaseConfig);

console.log("Firebase Initialized");

// Export the v9 service instances
export const db = getFirestore(app);
export const auth = getAuth(app);
