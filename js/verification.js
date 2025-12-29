import { getAuth, GoogleAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { giveError, showBootstrapAlert } from "./errorResponses.js";

// General entry point
export async function verification(user, level) {
    switch(level) {
        case "easy":
            return await easyVerify(user);
        case "medium":
            return await mediumVerify(user);
        case "sudo":
            return await sudoVerify(user);
        default:
            throw new Error("Unsupported verification level");
    }
}

// Easy verification: password or Google
export async function easyVerify(user, trigger = false) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById("verifyPasswordModal");
        const modal = new bootstrap.Modal(modalEl, {
            backdrop: "static",
            keyboard: false
        });

        setupPasswordToggles();
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

// Medium verification: easy + email confirmation
export async function mediumVerify(user, action = "") {
    const easyOk = await easyVerify(user);
    if (!easyOk) return false;
    try {
        await sendEmailVerification(user);
        const hostname = window.location.hostname;
        const url = hostname === "127.0.0.1" || hostname === "localhost" ? "http://127.0.0.1:5500/" : "https://fintrack.omkanabar.com/"
        const unlock = generateSecureToken(5);
        const token1 = generateSecureToken();
        sessionStorage.setItem("unlock", unlock);
        sessionStorage.setItem(unlock, token1);
        window.open(`${url}auth/verify?purpose=${action}&${unlock}=${token1}`, "_blank", rel="noopener noreferrer");
    } catch (error) {
        giveError(error, "mediumVerify");
        return false;
    }

    return true;
}


// Sudo verification: hard-level action
export async function sudoVerify(user, action = "") {
    // Combines easyVerify + mediumVerify + final confirmation
}

// ================
// helpers :)
// ================

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

// For SUDO to make sure that it can't be done accidentally. This is a one time intent token, not a replacement for firebase auth

function generateSecureToken(bytes = 64) {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// Removes validation classes from given input elements
// Parameters:
// - inputs: array of input elements
function resetValidation(inputs) {
    inputs.forEach(i => i.classList.remove("is-invalid", "is-valid"));
}

function toggleEasyVerifyUI(hasPassword) {
    if (hasPassword) {
        showElement("passwordBlock");
        showElement("verifyPasswordSubmitBtn");
    } else {
        hideElement("passwordBlock");
        hideElement("verifyPasswordSubmitBtn");
    }
}

// Sets up toggle buttons to show/hide password inputs for various fields
function setupPasswordToggles() {
    setupPasswordToggle("verifyPasswordInput", "toggleVerifyPassword");
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