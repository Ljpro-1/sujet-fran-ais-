import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* CONFIGURATION FIREBASE */

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PRICE = 2000;
const PAYMENT_NUMBER = "0330608880";

const $ = (id) => document.getElementById(id);

$("year").textContent = new Date().getFullYear();

let currentUser = null;
let currentProfile = {};
let currentRequest = null;
let stopProfileListener = null;
let stopRequestListener = null;

/* MESSAGES */

function message(element, text, type = "") {
  element.textContent = text;
  element.className = "message";
  if (type) element.classList.add(type);
}

function friendlyError(error) {
  const errors = {
    "auth/email-already-in-use": "Cette adresse e-mail possède déjà un compte. Connecte-toi.",
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
    "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessaie plus tard.",
    "auth/network-request-failed": "Vérifie ta connexion Internet."
  };

  return errors[error.code] || "Une erreur est survenue. Réessaie.";
}

/* INSCRIPTION / CONNEXION */

$("showRegister").addEventListener("click", () => {
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("showRegister").classList.add("active");
  $("showLogin").classList.remove("active");
  message($("accountMessage"), "");
});

$("showLogin").addEventListener("click", () => {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("showLogin").classList.add("active");
  $("showRegister").classList.remove("active");
  message($("accountMessage"), "");
});

$("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;
  const button = $("registerForm").querySelector('button[type="submit"]');

  if (name.length < 2) {
    message($("accountMessage"), "Entre ton nom complet.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Création en cours...";

  try {
    const credential = await createUserWithEmailAndPassword(
      auth, email, password
    );

    await updateProfile(credential.user, { displayName: name });

    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      email,
      accessPro: false,
      createdAt: serverTimestamp()
    });

    message(
      $("accountMessage"),
      "Compte créé avec succès.",
      "success"
    );
    $("registerForm").reset();
  } catch (error) {
    message($("accountMessage"), friendlyError(error), "error");
  } finally {
    button.disabled = false;
    button.textContent = "Créer mon compte";
  }
});

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const button = $("loginForm").querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = "Connexion...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    $("loginForm").reset();
    message($("accountMessage"), "Connexion réussie.", "success");
  } catch (error) {
    message($("accountMessage"), friendlyError(error), "error");
  } finally {
    button.disabled = false;
    button.textContent = "Se connecter";
  }
});

/* AFFICHAGE DU STATUT */

function updatePremiumStatus() {
  const statusElement = $("premiumStatus");
  const details = $("requestDetails");

  if (currentProfile.accessPro === true ||
      currentRequest?.status === "approved") {
    statusElement.textContent = "Premium activé";
    details.textContent = "Tu peux accéder aux cinq sujets Premium.";
    $("paymentInstructions").classList.add("hidden");
    return;
  }

  if (currentRequest?.status === "pending") {
    statusElement.textContent = "En attente de confirmation";
    details.textContent =
      "Ta demande a été envoyée. Attends la vérification du paiement.";
  } else if (currentRequest?.status === "rejected") {
    statusElement.textContent = "Paiement refusé";
    details.textContent =
      "La demande a été refusée. Vérifie le paiement puis soumets une nouvelle demande.";
  } else {
    statusElement.textContent = "Non activé";
    details.textContent =
      "Effectue le paiement puis confirme-le sur cette page.";
  }

  updateSubjectLinks();
}

function hasPremium() {
  return currentProfile.accessPro === true ||
         currentRequest?.status === "approved";
}

function updateSubjectLinks() {
  document.querySelectorAll(".premium-link").forEach((link) => {
    if (hasPremium()) {
      link.textContent = "Accéder au sujet";
    } else {
      link.textContent = "🔒 Débloquer avec Premium";
    }
  });
}

document.querySelectorAll(".premium-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!hasPremium()) {
      event.preventDefault();

      if (!currentUser) {
        $("accountPanel").scrollIntoView({ behavior: "smooth" });
        message(
          $("accountMessage"),
          "Crée un compte ou connecte-toi d'abord.",
          "error"
        );
      } else {
        $("premiumPanel").scrollIntoView({ behavior: "smooth" });
        $("paymentInstructions").classList.remove("hidden");
      }
    }
  });
});

/* BOUTON PAYER POUR PRO */

$("payProBtn").addEventListener("click", () => {
  if (!currentUser) {
    $("accountPanel").scrollIntoView({ behavior: "smooth" });
    message(
      $("accountMessage"),
      "Connecte-toi ou crée un compte pour demander Premium.",
      "error"
    );
    return;
  }

  if (hasPremium()) {
    message(
      $("paymentMessage"),
      "Ton accès Premium est déjà activé.",
      "success"
    );
    return;
  }

  $("paymentName").textContent =
    currentUser.displayName || currentProfile.name || "Nom indisponible";

  $("paymentEmail").textContent = currentUser.email || "";

  $("paymentInstructions").classList.remove("hidden");

  message(
    $("paymentMessage"),
    `Montant : ${PRICE} Ar. Numéro de paiement : ${PAYMENT_NUMBER}.`,
    ""
  );

  $("paymentInstructions").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

/* CONFIRMER LE PAIEMENT */

$("confirmPaymentBtn").addEventListener("click", async () => {
  if (!currentUser) {
    message(
      $("paymentMessage"),
      "Connecte-toi pour envoyer ta demande.",
      "error"
    );
    return;
  }

  if (hasPremium()) {
    message(
      $("paymentMessage"),
      "Ton accès Premium est déjà actif.",
      "success"
    );
    return;
  }

  const button = $("confirmPaymentBtn");
  button.disabled = true;
  button.textContent = "Envoi de la demande...";

  try {
    const requestRef = doc(db, "premiumRequests", currentUser.uid);
    const existing = await getDoc(requestRef);

    if (existing.exists() && existing.data().status === "pending") {
      message(
        $("paymentMessage"),
        "Ta demande est déjà en attente de confirmation.",
        ""
      );
      return;
    }

    if (existing.exists() && existing.data().status === "approved") {
      currentRequest = existing.data();
      updatePremiumStatus();
      message(
        $("paymentMessage"),
        "Ton paiement a déjà été validé.",
        "success"
      );
      return;
    }

    const name = currentUser.displayName || currentProfile.name || "";
    const email = currentUser.email || "";

    await setDoc(requestRef, {
      uid: currentUser.uid,
      name,
      email,
      amount: PRICE,
      paymentNumber: PAYMENT_NUMBER,
      paymentReference: `${name} - ${email}`,
      status: "pending",
      submittedAt: serverTimestamp()
    });

    message(
      $("paymentMessage"),
      "Demande envoyée ! Ton statut est « En attente de confirmation ». Nous vérifierons le paiement avant d'activer Premium.",
      "success"
    );
  } catch (error) {
    console.error(error);
    message(
      $("paymentMessage"),
      "Impossible d'envoyer la demande. Vérifie les règles Firestore.",
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent = "Confirmer le paiement";
  }
});

/* SESSION ET ÉCOUTE FIRESTORE */

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  currentProfile = {};
  currentRequest = null;

  if (stopProfileListener) stopProfileListener();
  if (stopRequestListener) stopRequestListener();

  $("paymentInstructions").classList.add("hidden");

  if (!user) {
    $("accountPanel").classList.remove("hidden");
    $("memberPanel").classList.add("hidden");
    $("logoutBtn").classList.add("hidden");

    updateSubjectLinks();
    return;
  }

  $("accountPanel").classList.add("hidden");
  $("memberPanel").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("memberName").textContent = user.displayName || user.email;

  const profileRef = doc(db, "users", user.uid);
  const requestRef = doc(db, "premiumRequests", user.uid);

  stopProfileListener = onSnapshot(profileRef, (snapshot) => {
    currentProfile = snapshot.exists() ? snapshot.data() : {};
    updatePremiumStatus();
    updateSubjectLinks();
  }, (error) => {
    console.error("Erreur profil :", error);
  });

  stopRequestListener = onSnapshot(requestRef, (snapshot) => {
    currentRequest = snapshot.exists() ? snapshot.data() : null;
    updatePremiumStatus();
    updateSubjectLinks();

    if (currentRequest?.status === "approved") {
      message(
        $("paymentMessage"),
        "Paiement validé ! Ton accès Premium est disponible.",
        "success"
      );
    } else if (currentRequest?.status === "rejected") {
      message(
        $("paymentMessage"),
        "Paiement refusé. Vérifie les informations et contacte l'administrateur si nécessaire.",
        "error"
      );
    }
  }, (error) => {
    console.error("Erreur demande Premium :", error);
  });
});

/* DÉCONNEXION */

$("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    message($("accountMessage"), "Erreur lors de la déconnexion.", "error");
  }
});