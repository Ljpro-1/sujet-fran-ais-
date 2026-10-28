import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { getFirestore, doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTQYOPUj7VdtmnqPa2UB2DJzA2f4_b7V8",
  authDomain: "fianarana-67123.firebaseapp.com",
  databaseURL: "https://fianarana-67123-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fianarana-67123",
  storageBucket: "fianarana-67123.firebasestorage.app",
  messagingSenderId: "279004932185",
  appId: "1:279004932185:web:14bbae273b1e3eeaeb6948",
  measurementId: "G-9BVJ2SRG60"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.documentElement.style.visibility = "hidden";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("index.html");
    return;
  }

  try {
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const requestSnap = await getDoc(doc(db, "premiumRequests", user.uid));

    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const request = requestSnap.exists() ? requestSnap.data() : {};

    if (profile.accessPro === true || request.status === "approved") {
      document.documentElement.style.visibility = "visible";
    } else {
      window.location.replace("index.html");
    }
  } catch (error) {
    console.error("Erreur de vérification Premium :", error);
    window.location.replace("index.html");
  }
});