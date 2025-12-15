// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase project config
  apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
  authDomain: "fintrack-ec50a.firebaseapp.com",
  projectId: "fintrack-ec50a",
  storageBucket: "fintrack-ec50a.firebasestorage.app",
  messagingSenderId: "1286389410",
  appId: "1:1286389410:web:cb45ddaf8f75128cef21fb",
  measurementId: "G-BW0G8MP2NN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function readExpenses() {
    const querySnapshot = await getDocs(collection(db, "expenses"));
    const tbody = document.querySelector("#table-box tbody");
    tbody.innerHTML = "";
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tr = document.createElement("tr");
        const indexTd = document.createElement("td");
        indexTd.scope = "row";
        indexTd.innerHTML = tbody.children.length + 1;

        const amountTd = document.createElement("td");
        amountTd.innerHTML = data.amount|| "N/A"; 

        const itemTd = document.createElement("td");
        itemTd.innerHTML = data.item || "N/A";

        tr.appendChild(indexTd);
        tr.appendChild(amountTd);
        tr.appendChild(itemTd);

        tbody.appendChild(tr);
    });
}

readExpenses();
