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

const resendBtn = document.getElementById("resendEmailBtn");
const statusMessage = document.getElementById("statusMessage");

const urlParams = new URLSearchParams(window.location.search);
const skipRedirect = urlParams.get("debug") === "skip";

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

resendBtn.addEventListener("click", async () => {
  try {
    resendBtn.disabled = true;
    cooldown = 30;

    showStatus("Verification email sent. Check your inbox.", "info");
    startCooldown();

    await sendEmailVerification(auth.currentUser);
  } catch (err) {
    console.error(err);
    showStatus(err.message, "danger");
    resendBtn.disabled = false;
  }
});

function startCooldown() {
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

function showStatus(message, type) {
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
  window.location.href = 
    host === "localhost" || host === "127.0.0.1" ? local : web;
}