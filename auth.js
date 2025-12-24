// Firebase setup

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {getAuth, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, signInWithPopup, GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
    authDomain: "fintrack-ec50a.firebaseapp.com",
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


// Redirect utilities

const urlParams = new URLSearchParams(window.location.search);
const skipRedirect = urlParams.get("debug") === "skip";

function redirect(local, web) {
    const host = window.location.hostname;
    window.location.href =
        host === "127.0.0.1" || host === "localhost"
            ? local
            : web;
}


// Auth state handling

onAuthStateChanged(auth, (user) => {
    if (user && !skipRedirect) {
        redirect("/app.html", "/app");
    }
});


// Form validation helpers

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

function validatePassword(passwordInput, confirmInput) {
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    const rules =
        password.length >= 8 &&
        password.length <= 20 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password) &&
        !/\s/.test(password) &&
        !/[\u{1F300}-\u{1FAFF}]/u.test(password) &&
        password === confirm;

    passwordInput.classList.toggle("is-invalid", !rules);
    confirmInput.classList.toggle("is-invalid", password !== confirm);

    if (rules) {
        passwordInput.classList.add("is-valid");
        confirmInput.classList.add("is-valid");
    }

    return rules;
}

// Form UX helpers 

function setupPasswordToggle(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (!input || !button) return;

    button.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.innerHTML = isPassword ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/></svg>`;
    });
}

setupPasswordToggle("Password", "togglePassword");
setupPasswordToggle("ConfirmPassword", "toggleConfirmPassword");


// Form signup

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

const form = document.getElementById("signup-form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("UserEmail");
    const passwordInput = document.getElementById("Password");
    const confirmInput = document.getElementById("ConfirmPassword");

    resetValidation([emailInput, passwordInput, confirmInput]);

    const emailValid = validateEmail(emailInput);
    const passwordValid = validatePassword(passwordInput, confirmInput);

    if (!emailValid || !passwordValid) return;

    try {
        const { user } = await createUserWithEmailAndPassword(
            auth,
            emailInput.value.trim(),
            passwordInput.value
        );

        await sendEmailVerification(user);
        redirect("/verify.html", "/verify");
    } catch (error) {
        showBootstrapAlert(error.message, "danger");
        console.error("Signup failed:", error);
    }
});

// Google signup

const googleBtn = document.getElementById("google-signup-btn");

googleBtn.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
    } catch (error) {
        showBootstrapAlert(`Report the following error at: <a href="omkanabar.com/contact">omkanabar.com/contact</a> with a title of: FinTrack Error. ERROR: ${error.message}`, "danger");
        console.error("Google signup failed:", error);
    } 
    redirect("/app.html", "/app")
});
