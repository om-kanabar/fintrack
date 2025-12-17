import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
    authDomain: "fintrack-ec50a.firebaseapp.com",
    projectId: "fintrack-ec50a",
    storageBucket: "fintrack-ec50a.firebasestorage.app",
    messagingSenderId: "1286389410",
    appId: "1:1286389410:web:cb45ddaf8f75128cef21fb",
    measurementId: "G-BW0G8MP2NN"
};

const form = document.getElementById("login-form");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("UserEmail");
    const passwordInput = document.getElementById("Password");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Reset Bootstrap validation states
    [emailInput, passwordInput].forEach(input => {
        input.classList.remove("is-invalid");
        input.classList.remove("is-valid");
    });

    let valid = true;

    // Email check
    if (!email.includes("@") || !email.includes(".")) {
        emailInput.classList.add("is-invalid");
        valid = false;
    } else {
        emailInput.classList.add("is-valid");
    }

    if (!valid) return;

    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log("Logged in user UID:", cred.user.uid);
        window.location.href = "/app.html";
    } catch (err) {
        console.error(err.message);
        emailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
    }
});