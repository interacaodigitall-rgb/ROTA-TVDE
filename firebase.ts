// This file assumes firebase is initialized via the script in index.html

// Declare the global firebase object to satisfy TypeScript
declare const firebase: any;

// Get the initialized services
const auth = firebase.auth();
const db = firebase.firestore();
const firestore = firebase.firestore;

// Apply settings to work around potential network restrictions in some environments (like online IDEs)
// that might block WebSockets. This forces Firestore to use HTTP long-polling.
try {
    db.settings({
        experimentalForceLongPolling: true,
        useFetchStreams: false, // Also disable streams as they can cause issues in some environments
    });
} catch (e) {
    // This might fail if settings are applied after the first data fetch, but it's safe to ignore.
    console.warn("Could not apply Firestore settings.", e);
}


// Export them for use in other files
export { auth, db, firestore };