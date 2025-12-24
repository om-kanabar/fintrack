import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, GoogleAuthProvider, reauthenticateWithPopup, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
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
    let userPasswordState = userHasPassword(user);
    signOutUser();
    hideShowSection(userPasswordState);
    infoPopulate(user);
    addPasswordFormSetup(user)
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
            showBootstrapAlert(`An error has occured with signing out. Please contact the dev at https://omkanabar.com/contact, give instructions on how to replicate the error, and paste the following error code: ${error}`);
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

function addPasswordFormSetup(user) {
    const addPasswordForm = document.getElementById("addPasswordForm");
    const passwordInput = document.getElementById("addPassword");
    const confirmInput = document.getElementById("confirmPassword");
    setupPasswordToggle("addPassword", "toggleAddPassword");
    setupPasswordToggle("confirmPassword", "toggleConfirmPassword");
    addPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        resetValidation([passwordInput, confirmInput]);
        const valid = validatePassword(passwordInput, confirmInput);
        if (!valid) return;
        await addUserPassword(user, passwordInput.value);
    });
}

async function addUserPassword(user, value) {
    const newPassword = value;
    await reAuthWithGoogle(user);
    const reAuthSuccess = await verification(user, "easy");
    if (!reAuthSuccess) {
        showBootstrapAlert("Reauthentication failed. Please try signing in again.");
        return;
    }

    try {
        await updatePassword(user, newPassword);
        showBootstrapAlert("Password added successfully!", "success");
        // Optionally hide add password form and show change password
        document.getElementById("addPasswordSection").classList.add("hidden");
        document.getElementById("changePasswordSection").classList.remove("hidden");
    } catch (error) {
        console.error("Failed to add password:", error);
        showBootstrapAlert("Failed to add password: " + error.message);
    }
}

async function reAuthWithGoogle(user) {
    const provider = new GoogleAuthProvider();
    try {
        await reauthenticateWithPopup(user, provider);
        return true;
    } catch (error) {
        console.error("Reauthentication failed:", error);
        showBootstrapAlert(`An error has occured with reauthentication. Please contact the dev at https://omkanabar.com/contact, give instructions on how to replicate the error, and paste the following error code: ${error}`);
        return false;
    }
}

function hideShowSection(userPasswordState) {
    const addPassword = document.getElementById("addPasswordSection");
    const changePasssword = document.getElementById("changePasswordSection");
    if (userPasswordState == true) {
        addPassword.classList.add("hidden");
    } else {
        changePasssword.classList.add("hidden");
    }
}

function userHasPassword(user) {
    return user.providerData.some(provider => provider.providerId === "password");
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
        !/[\u{1F300}-\u{1FAFF}]/u.test(password)

    passwordInput.classList.toggle("is-invalid", !rules);
    confirmInput.classList.toggle("is-invalid", password !== confirm);

    if (rules) {
        passwordInput.classList.add("is-valid");
        confirmInput.classList.add("is-valid");
    }

    return rules;
}

function resetValidation(inputs) {
    inputs.forEach(input => {
        input.classList.remove("is-invalid", "is-valid");
    });
}

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

function showBootstrapAlert(message, type = "danger") {
    const container = document.getElementById("alert-container");
    if (!container) return;
    container.innerHTML = `
        <div class="alert gr-width mt-5 alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    window.location.hash = "alert-container";
}

async function verification(user, level = "easy", provider = null) {
    const passwordHas = userHasPassword(user);
    const levels = ["easy", "medium", "hard", "sudo"];
    if (!levels.includes(level)) return Promise.reject("Invalid verification level");

    switch(level) {
        case "easy":
            return await easyVerify(user);
        case "medium":
            return await mediumVerify(user);
        case "hard":
            return await hardVerify(user);
        case "sudo":
            return await sudoVerify(user);
    }
}

// Initialize the modal
// Function to show modal and verify password
const verifyPasswordModal = new bootstrap.Modal(document.getElementById("verifyPasswordModal"));
// Easy verify function
async function easyVerify(user) {
    return new Promise((resolve, reject) => {
        const form = document.getElementById("verifyPasswordForm");
        const passwordInput = document.getElementById("verifyPasswordInput");
        const googleBtn = document.getElementById("verifyWithGoogleBtn");
        const provider = new GoogleAuthProvider();

        if (!userHasPassword(user)) form.classList.add("hidden");

        // Reset input and validation
        passwordInput.value = "";
        passwordInput.classList.remove("is-invalid");

        // Show the modal
        verifyPasswordModal.show();

        // Password submission handler
        const passwordHandler = async (e) => {
            e.preventDefault();
            const password = passwordInput.value.trim();

            if (!password) {
                passwordInput.classList.add("is-invalid");
                return;
            }

            try {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);

                cleanup();
                resolve(true);
            } catch (err) {
                passwordInput.classList.add("is-invalid");
                console.error("Password verification failed:", err);
            }
        };

        // Google verification handler
        const googleHandler = async () => {
            try {
                await reauthenticateWithPopup(user, provider);
                cleanup();
                resolve(true);
            } catch (err) {
                console.error("Google verification failed:", err);
                showBootstrapAlert("Google verification failed. Try again.", "danger");
                return
            }
        };

        // Cleanup function
        const cleanup = () => {
            form.removeEventListener("submit", passwordHandler);
            googleBtn.removeEventListener("click", googleHandler);
            verifyPasswordModal.hide();
        };

        form.addEventListener("submit", passwordHandler);
        googleBtn.addEventListener("click", googleHandler);
    });
}