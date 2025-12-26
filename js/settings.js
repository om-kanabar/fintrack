// =====================================================
// SETTINGS.JS
// Purpose: Handle user settings, security, and account
// =====================================================



// =====================================================
// 1. IMPORTS (External dependencies & shared utilities)
// =====================================================

// Firebase core + auth
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, GoogleAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Firestore (future use / parity with other files)
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Global error handler
import { giveError } from "./errorResponses.js";



// =====================================================
// 2. FIREBASE INITIALIZATION
// =====================================================

// Firebase configuration object containing keys and identifiers for the project
const firebaseConfig = {
    apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
    authDomain: "fintrack-ec50a.firebaseapp.com",
    projectId: "fintrack-ec50a",
    storageBucket: "fintrack-ec50a.firebasestorage.app",
    messagingSenderId: "1286389410",
    appId: "1:1286389410:web:cb45ddaf8f75128cef21fb",
    measurementId: "G-BW0G8MP2NN"
};

// Initialize Firebase app and services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



// =====================================================
// 3. AUTH STATE LISTENER (ENTRY POINT)
// =====================================================
// This is the main entry point for the page. It listens for authentication state changes
// and sets up the UI and forms accordingly.

onAuthStateChanged(auth, async (user) => {
    // If no user is logged in, redirect to signup page
    if (!user) {
        redirect("/auth/signup.html", "/auth/signup");
        return;
    }

    // If user's email is not verified, redirect to verification page
    if (!user.emailVerified) {
        redirect("/auth/verify.html", "/auth/verify");
        return;
    }

    // Check if the user has a password set
    const hasPassword = userHasPassword(user);

    // Setup global UI elements and event handlers
    setupSignOut();
    hideShowSection(hasPassword);
    infoPopulate(user);
    setupPasswordToggles();

    // Setup forms
    setupAddPasswordForm(user);
    setupChangePasswordForm(user)
});



// =====================================================
// 4. ACCOUNT / AUTH ACTIONS (Firebase mutations)
// =====================================================

// Adds a password to the user's account after successful reauthentication
// Parameters:
// - user: Firebase user object
// - newPassword: string representing the new password to set
async function addUserPassword(user, newPassword) {
    const verified = await verification(user, "easy");
    if (!verified) {
        showBootstrapAlert("Reauthentication failed. Please try again.");
        return;
    }

    try {
        await updatePassword(user, newPassword);
        showBootstrapAlert("Password added successfully!", "success");

        // Update UI to reflect password addition
        hideElement("addPasswordSection");
        showElement("changePasswordSection");
    } catch (error) {
        giveError(error);
    }
}

// Sets up the event listener for the sign out button to log the user out
async function setupSignOut() {
    const signOutButton = document.getElementById("signout-button");
    if (!signOutButton) return;

    signOutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            redirect("/index.html", "/");
        } catch (error) {
            giveError(error);
        }
    });
}



// =====================================================
// 5. VERIFICATION LOGIC 
// =====================================================

// General verification function that selects verification method based on level
// Parameters:
// - user: Firebase user object
// - level: string indicating verification level ("easy", "medium", "hard", "sudo")
// Returns a Promise that resolves to true if verification succeeds
async function verification(user, level) {
    const levels = ["easy", "medium", "hard", "sudo"];
    if (!levels.includes(level)) return;
    switch (level) {
        case "easy":
            return await easyVerify(user);
        default:
            throw new Error("Unsupported verification level");
    }
}

// -------- EASY VERIFY --------
// Re-authenticate user either via password or Google popup
// Displays a modal dialog for user input and handles verification
// Returns a Promise that resolves to true on successful reauthentication
async function easyVerify(user) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById("verifyPasswordModal");
        const modal = new bootstrap.Modal(modalEl, {
            backdrop: "static",
            keyboard: false
        });

        const hasPassword = userHasPassword(user);

        // Correctly toggle UI
        toggleEasyVerifyUI(hasPassword);

        modal.show();

        modalEl.addEventListener(
            "shown.bs.modal",
            () => {
                const input = document.getElementById("verifyPasswordInput");
                if (input) input.focus();
            },
            { once: true }
        );

        const form = document.getElementById("verifyPasswordForm");
        const googleBtn = document.getElementById("verifyWithGoogleBtn");

        // -------- PASSWORD REAUTH --------
        async function handlePasswordSubmit(e) {
            e.preventDefault();

            const input = document.getElementById("verifyPasswordInput");
            const password = input.value.trim();

            input.classList.remove("is-invalid");

            if (!password) {
                input.classList.add("is-invalid");
                return;
            }

            try {
                const credential = EmailAuthProvider.credential(
                    user.email,
                    password
                );

                await reauthenticateWithCredential(user, credential);
                cleanup(true);
            } catch (error) {
                input.classList.add("is-invalid");
                giveError(error, "modal");
            }
        }

        // -------- GOOGLE REAUTH --------

        async function handleGoogleReauth(user) {
            try {
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(user, provider);
                cleanup(true);
            } catch (error) {
                giveError(error, "modal");
            }
        }

        function cleanup(success) {
            document.getElementById("verifyPasswordInput").value = "";
            modal.hide();
            form?.removeEventListener("submit", handlePasswordSubmit);
            googleBtn?.removeEventListener("click", handleGoogleReauth);
            resolve(success);
        }

        // Always attach Google reauth
        const googleClickHandler = () => handleGoogleReauth(user);
        googleBtn?.addEventListener("click", googleClickHandler);

        // Only attach password form listener if user has a password
        if (hasPassword) {
            form?.addEventListener("submit", handlePasswordSubmit);
        }
    });
}

// Shows or hides password input and submit button based on whether user has a password
// Parameters:
// - hasPassword: boolean indicating if user has a password set
function toggleEasyVerifyUI(hasPassword) {
    if (hasPassword) {
        showElement("passwordBlock");
        showElement("verifyPasswordSubmitBtn");
    } else {
        hideElement("passwordBlock");
        hideElement("verifyPasswordSubmitBtn");
    }
}



// =====================================================
// 6. FORM SETUP & HANDLERS
// =====================================================

// Sets up the form to add a password to the user account
// Validates input and calls addUserPassword on submit
// Parameters:
// - user: Firebase user object
function setupAddPasswordForm(user) {
    const form = document.getElementById("addPasswordForm");
    if (!form) return;

    const passwordInput = document.getElementById("addPassword");
    const confirmInput = document.getElementById("confirmPassword");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Reset previous validation states
        resetValidation([passwordInput, confirmInput]);

        // Validate password fields; if invalid, do not proceed
        if (!validatePassword(passwordInput, confirmInput)) return;

        // Attempt to add the password after verification
        await addUserPassword(user, passwordInput.value);
    });
}

// CHANGE PASSWORD SETUP

function setupChangePasswordForm(user) {
    const form = document.getElementById("changePasswordForm");
    if (!form) return;

    const newPasswordInput = document.getElementById("changePassword");
    const confirmInput = document.getElementById("confirmChangePassword");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Reset previous validation states
        resetValidation([newPasswordInput, confirmInput]);

        // Validate new password fields
        if (!validatePassword(newPasswordInput, confirmInput)) return;

        // After easyVerify succeeds
        const verified = await verification(user, "easy");
        if (!verified) return;

        // Prevent same password reuse
        if (newPasswordInput.value === document.getElementById("verifyPasswordInput")?.value) {
            showBootstrapAlert( "Your new password must be different from your current password.", "warning");
            return;
        }

        await updatePassword(user, newPasswordInput.value);
        showBootstrapAlert("Password changed successfully!", "success");

        await updatePassword(user, newPasswordInput.value);
        showBootstrapAlert("Password changed successfully!", "success");

        // Update the password in Firebase
        await updatePassword(user, newPasswordInput.value);
        showBootstrapAlert("Password changed successfully!", "success");

        // Optionally reset input fields
        newPasswordInput.value = "";
        confirmInput.value = "";
        resetValidation([newPasswordInput, confirmInput]);
    });
}

// =====================================================
// 7. DISPLAY / UI FUNCTIONS
// =====================================================

// Populates user info fields in the UI such as email and last login time
// Parameters:
// - user: Firebase user object
function infoPopulate(user) {
    document.getElementById("userEmailDisplay").textContent = user.email;

    const lastSignIn = new Date(user.metadata.lastSignInTime);
    const time = lastSignIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = lastSignIn.toLocaleDateString();

    document.getElementById("loginTimeDisplay").textContent =
        `Your last login was at: ${time}, ${date}`;
}

// Shows or hides sections depending on whether the user has a password
// Parameters:
// - hasPassword: boolean indicating if user has a password set
function hideShowSection(hasPassword) {
    if (hasPassword) {
        hideElement("addPasswordSection");
    } else {
        hideElement("changePasswordSection");
    }
}

// Displays a Bootstrap alert message inside the alert container
// Parameters:
// - message: string to display in alert
// - type: Bootstrap alert type (e.g. "danger", "success"), default is "danger"
function showBootstrapAlert(message, type = "danger", box = "container") {
    const container = document.getElementById(`alert-${box}`);
    if (!container) return;

    container.innerHTML = `
        <div class="alert gr-width mt-5 alert-${type} alert-dismissible fade show">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    // Scroll to alert container for visibility
    window.location.hash = "alert-container";
}



// =====================================================
// 8. VALIDATION
// =====================================================

// Validates password inputs according to rules:
// - Length between 8 and 20 characters
// - Contains lowercase, uppercase, digit, and special character
// - No whitespace
// Also checks if password and confirm password match
// Parameters:
// - passwordInput: input element for password
// - confirmInput: input element for confirm password
// Returns: true if valid, false otherwise
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
        !/\s/.test(password);

    // Toggle invalid class if rules not met
    passwordInput.classList.toggle("is-invalid", !rules);
    // Toggle invalid class if confirm password does not match
    confirmInput.classList.toggle("is-invalid", password !== confirm);

    // Add valid class only if everything is valid
    if (rules && password === confirm) {
        passwordInput.classList.add("is-valid");
        confirmInput.classList.add("is-valid");
    } 

    if (rules) {
        passwordInput.classList.add("is-valid");
    }

    return rules && password === confirm;
}


// Removes validation classes from given input elements
// Parameters:
// - inputs: array of input elements
function resetValidation(inputs) {
    inputs.forEach(i => i.classList.remove("is-invalid", "is-valid"));
}



// =====================================================
// 9. SMALL HELPERS
// =====================================================

// Sets up toggle buttons to show/hide password inputs for various fields
function setupPasswordToggles() {
    setupPasswordToggle("addPassword", "toggleAddPassword");
    setupPasswordToggle("confirmPassword", "toggleConfirmPassword");
    setupPasswordToggle("changePassword", "toggleChangePassword");
    setupPasswordToggle("confirmChangePassword", "toggleConfirmChangePassword");
    setupPasswordToggle("verifyPasswordInput", "toggleVerifyPassword");
}

// Helper to toggle password input visibility on button click
// Parameters:
// - inputId: id of the password input element
// - buttonId: id of the toggle button element
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

// Checks if the user has a password provider (email/password) linked
// Parameters:
// - user: Firebase user object
// Returns: boolean indicating if password provider exists
function userHasPassword(user) {
    return user.providerData.some(p => p.providerId === "password");
}

// Adds "hidden" class to the target element to hide it
// Parameters:
// - target: element id or element itself
function hideElement(target) {
    resolveElement(target)?.classList.add("hidden");
}

// Removes "hidden" class from the target element to show it
// Parameters:
// - target: element id or element itself
function showElement(target) {
    resolveElement(target)?.classList.remove("hidden");
}

// Helper to resolve a string id or element to an HTMLElement
// Parameters:
// - target: string id or HTMLElement
// Returns: HTMLElement or null
function resolveElement(target) {
    return typeof target === "string" ? document.getElementById(target) : target;
}

// Redirects user to local or web URL depending on hostname
// Parameters:
// - local: URL string for local development
// - web: URL string for production/web environment
function redirect(local, web) {
    const host = window.location.hostname;
    window.location.href =
        host === "127.0.0.1" || host === "localhost" ? local : web;
}