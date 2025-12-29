import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, sendEmailVerification, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
let unlock = null;
let token = null;
let skipRedirect;
let cooldown;
let cooldownInterval;

const resendBtn = document.getElementById("resendEmailBtn");

const urlParams = new URLSearchParams(window.location.search);
skipRedirect = verificationCheck();

onAuthStateChanged(auth, (user) => {
    if (skipRedirect) return;

    if (!user) {
        redirect("/signup.html", "/signup");
        return;
    }

    if (user.emailVerified) {
        redirect("/app.html", "/app");
        return;
    }

    startVerificationCheck();
});

// ===============================
// FOR REGULAR VERIFICATION ONLY
// ================================

resendBtn.addEventListener("click", async () => {
    try {
        resendBtn.disabled = true;

        showStatus("Verification email sent. Check your inbox.", "info");
        startCooldown(30);

        const actionCodeSettings = {
            url: `${window.location.origin}/app`, // redirect after verification
            handleCodeInApp: true
        };

        await sendEmailVerification(auth.currentUser, actionCodeSettings);
    } catch (err) {
        console.error(err);
        showStatus(err.message, "danger");
        resendBtn.disabled = false;
    }
});

function startCooldown(initialCooldown = 30) {
    cooldown = initialCooldown;
    updateButtonText();

    cooldownInterval = setInterval(() => {
        cooldown--;
        updateButtonText();

        if (cooldown <= 0) {
            clearInterval(cooldownInterval);
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend verification email";
        }
    }, 1000);
}

function updateButtonText() {
    resendBtn.textContent = `Resend available in ${cooldown}s`;
}

function showStatus(message, type, holder = null) {
    const statusMessage = holder === null 
        ? document.getElementById("statusMessage") 
        : document.getElementById(holder);

    if (!statusMessage) {
        console.warn("No element found for showStatus:", holder || "statusMessage");
        return;
    }

    statusMessage.textContent = message;
    statusMessage.className = `alert alert-${type} mt-4`;
    statusMessage.classList.remove("d-none");
}

function startVerificationCheck() {
    setInterval(async () => {
        const user = auth.currentUser;
        if (!user) return;

        await user.reload();

        if (user.emailVerified) {
            showStatus("Email verified! Redirecting…", "success");
            setTimeout(() => {
                redirect("/app.html", "/app");
            }, 1200);
        }
    }, 3000);
}

function redirect(local, web) {
    const host = window.location.hostname;
    window.location.href = host === "localhost" || host === "127.0.0.1" ? local : web;
}


// =================================================================
// FOR MEDIUM/SUDO VERIFICATION/DELETE ACCOUNT VERIFICATION BELOW
// =================================================================


function verificationCheck(different = false) {
    unlock = sessionStorage.getItem("unlock");
    token = unlock ? sessionStorage.getItem(unlock) : null;

    // Only skip redirect if both the param and token exist and match
    skipRedirect = (urlParams.get("debug") === "skip") || (unlock && token && urlParams.get(unlock) === token);
    // This function should also be used for checking if the unlock and token is true 
    return (different === false) ? skipRedirect : (unlock && token && urlParams.get(unlock) === token);
}

function differentVerify() {
    if (!verificationCheck(true)) return;
    const purpose = urlParams.get("purpose");
    if (!purpose) return;
    switch(purpose) {
        case "del" :
            delVerify()
    }
}

async function delVerify(user) {
    const mainPage = document.getElementById("regularVerify");
    mainPage.classList.add("hidden");

    const delResendBtn = document.getElementById("delResendEmailBtn");
    let delCooldownInterval = null; // store interval to clear later
    sendDelEmail(false);
    delResendBtn.addEventListener("click", async () => {
        sendDelEmail();
    });

    // Create ONE interval outside of the click handler
    delCooldownInterval = setInterval(async () => {
        const user = auth.currentUser;
        if (!user) return;

        await user.reload();

        if (user.emailVerified) {
            showStatus("Email verified! Redirecting…", "success", "delStatusMessage");
            clearInterval(delCooldownInterval); // stop interval
            setTimeout(() => {
                redirect("/app.html", "/app");
            }, 1200);
        }
    }, 3000);
}

function generateSecureToken(bytes = 64) {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

async function sendDelEmail(alert = true) {
    const delResendBtn = document.getElementById("delResendEmailBtn");
    try {
        delResendBtn.disabled = true;
        
        unlock = "del_token"; 
        const secureToken = generateSecureToken();
        
        sessionStorage.setItem("unlock", unlock); 
        sessionStorage.setItem(unlock, secureToken);

        const verifyUrl = `${window.location.origin}/auth/verify?purpose=del-confirm&${unlock}=${secureToken}`;

        await sendEmailVerification(auth.currentUser, { url: verifyUrl });
        
        if (alert) {
            showStatus("Verification email sent. Check your inbox.", "info", "delStatusMessage");
        }
        startCooldown(30); 
    } catch (err) {
        console.error(err);
        showStatus(err.message, "danger", "delStatusMessage");
        delResendBtn.disabled = false;
    }
}