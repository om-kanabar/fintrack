import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function redirect(locallink, weblink) {
    const hostname = window.location.hostname;
    if (hostname === "127.0.0.1" || hostname === "localhost") {
        window.location.href = locallink;
    } else {
        window.location.href = weblink;
    }
}

const urlParams = new URLSearchParams(window.location.search);
const skipRedirect = urlParams.get("debug") === "skip";

onAuthStateChanged(auth, (user) => {
    if (user && !skipRedirect) {
        redirect("/app.html", "/app");
    }
});

