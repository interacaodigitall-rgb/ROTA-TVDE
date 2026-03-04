import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCv7pV872bRnSdo7t24nGyVVg2yhJ_L_A",
  authDomain: "meus-calculosv1.firebaseapp.com",
  projectId: "meus-calculosv1",
  storageBucket: "meus-calculosv1.firebasestorage.app",
  messagingSenderId: "694044520930",
  appId: "1:694044520930:web:d870f447d0e4303b2149bb",
  measurementId: "G-MVBJF9C0N3"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get the initialized services
const auth = firebase.auth();
const db = firebase.firestore();
const firestore = firebase.firestore;

// Apply settings to work around potential network restrictions in some environments (like online IDEs)
// that might block WebSockets. This forces Firestore to use HTTP long-polling.
try {
    db.settings({
        experimentalForceLongPolling: true,
    });
} catch (e) {
    // This might fail if settings are applied after the first data fetch, but it's safe to ignore.
    console.warn("Could not apply Firestore settings.", e);
}


// Export them for use in other files
export { auth, db, firestore };