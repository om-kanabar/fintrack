import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";



// Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
    authDomain: "fintrack-ec50a.firebaseapp.com",
    projectId: "fintrack-ec50a",
    storageBucket: "fintrack-ec50a.firebasestorage.app",
    messagingSenderId: "1286389410",
    appId: "1:1286389410:web:cb45ddaf8f75128cef21fb",
    measurementId: "G-BW0G8MP2NN"
};

// Initial Setup
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        redirect("/signup.html", "/signup");
        return;
    }
    if (!auth.currentUser.emailVerified) {
        redirect("/verify.html", "/verify");
        return;
    }

    infoPopulate(user);
    signOutUser();
});

function redirect(locallink, weblink) {
    const hostname = window.location.hostname;
    if (hostname === "127.0.0.1" || hostname === "localhost") {
        window.location.href = locallink;
    } else {
        window.location.href = weblink;
    }
}

async function signOutUser() {
    const signOutButton = document.getElementById("signout-button");
    signOutButton.addEventListener("click", async (event) => {
        try {
            await signOut(auth);
            redirect("/index.html", "/")
        } catch(error) {
            console.error("Sign out failed: ", error);
        }
    });   
}

async function infoPopulate(user) {
    const emailDisplay = document.getElementById("userEmailDisplay");
    const lastLoginDisplay = document.getElementById("loginTimeDisplay");

    emailDisplay.textContent = user.email;

    // Convert last sign-in time string to Date
    const lastSignIn = new Date(user.metadata.lastSignInTime);

    // Format as HH:MM, MM/DD/YYYY, TIMEZONE
    const hours = lastSignIn.getHours().toString().padStart(2, "0");
    const minutes = lastSignIn.getMinutes().toString().padStart(2, "0");
    const dateString = lastSignIn.toLocaleDateString();

    lastLoginDisplay.textContent = `You last logged in at: ${hours}:${minutes}, ${dateString}`;
}

async function addUserPassword(user) {
    
}