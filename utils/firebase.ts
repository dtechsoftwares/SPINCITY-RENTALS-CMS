import { initializeApp } from "firebase/app";
// FIX: Module '"firebase/auth"' has no exported member 'getAuth'. Switched to compat library for authentication.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBjoBK7feqbPzON8BoOZNo4UQ3xbt5ZgkM",
    authDomain: "spincityrentalsnew.firebaseapp.com",
    projectId: "spincityrentalsnew",
    storageBucket: "spincityrentalsnew.appspot.com",
    messagingSenderId: "252954471415",
    appId: "1:252954471415:web:01a747ebf09fb92d645cf2"
};

// Initialize Firebase using the v9 modular syntax
const app = initializeApp(firebaseConfig);

// Initialize compat app to use compat services
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Export the v9 service instances
export const db = getFirestore(app);
export const auth = firebase.auth();
