import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Firebase setup
const firebaseConfig = {
    apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
    authDomain: "fintrack.omkanabar.com",
    projectId: "fintrack-ec50a",
    storageBucket: "fintrack-ec50a.firebasestorage.app",
    messagingSenderId: "1286389410",
    appId: "1:1286389410:web:cb45ddaf8f75128cef21fb",
    measurementId: "G-BW0G8MP2NN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();
const provider = new GoogleAuthProvider();

// Redirect utility
const urlParams = new URLSearchParams(window.location.search);
const skipRedirect = urlParams.get("debug") === "skip";

function redirect(local, web) {
    const host = window.location.hostname;
    window.location.href = (host === "127.0.0.1" || host === "localhost") ? local : web;
}

// Alert helper
function showBootstrapAlert(message, type = "danger") {
    const container = document.getElementById("alert-container");
    if (!container) return;
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

// Form helpers
function resetValidation(inputs) {
    inputs.forEach(input => {
        input.classList.remove("is-invalid", "is-valid");
    });
}

function validateEmail(input) {
    const valid = input.value.includes("@") && input.value.includes(".");
    input.classList.toggle("is-invalid", !valid);
    input.classList.toggle("is-valid", valid);
    return valid;
}

// Auth state handling (redirect only after Firebase confirms user)
onAuthStateChanged(auth, (user) => {
    if (user && !skipRedirect) {
        redirect("/app.html", "/app");
    }
});

// Email/password login
const form = document.getElementById("login-form");
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("UserEmail");
    const passwordInput = document.getElementById("Password");

    resetValidation([emailInput, passwordInput]);

    const emailValid = validateEmail(emailInput);
    const passwordValid = passwordInput.value.length > 0;

    passwordInput.classList.toggle("is-invalid", !passwordValid);
    passwordInput.classList.toggle("is-valid", passwordValid);

    if (!emailValid || !passwordValid) return;

    await rememberUser();

    try {
        await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    } catch (err) {
        showBootstrapAlert("Login failed: Invalid email or password.", "danger");
        console.error("Login error:", err);
        emailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
    }
});

async function rememberUser() {
    const rememberMe = document.getElementById("rememberMe").checked;
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
}

// Google login
const googleBtn = document.getElementById("google-login-btn");
googleBtn.addEventListener("click", async () => {
    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithPopup(auth, provider);
    } catch (err) {
        showBootstrapAlert(`Google login failed: ${err.message}`, "danger");
        console.error("Google login failed:", err);
    }
});