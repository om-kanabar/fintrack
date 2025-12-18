import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, getDocs, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const tbody = document.querySelector("#table-box tbody");
// Wait for auth state to load
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not logged in, redirect
        window.location.href = "/login.html";
        return;
    }

    document.getElementById("date").setAttribute("value", dateChange());

    const uid = user.uid;

    const expensesRef = collection(db, "users", uid, "expenses");
    const querySnapshot = await getDocs(expensesRef);
    tbody.innerHTML = "";
    // Render each expense into the table
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tr = document.createElement("tr");
        const date = data.date
            ? new Date(data.date + "T00:00:00").toLocaleDateString("en-US")
            : "";
        tr.innerHTML = `
            <th scope="row">${tbody.children.length + 1}</th>
            <td>${data.item}</td>
            <td>${data.amount.toFixed(2)}</td>
            <td>${date}</td>
        `;
        tbody.appendChild(tr);
    });
    // Example: const querySnapshot = await getDocs(collection(db, "users", uid, "expenses"));
    // Table rendering and adding new expenses will be added next

    const form = document.getElementById("item-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const item = document.getElementById("item").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const dateInput = document.getElementById("date").value;
        
        // Add to Firestore
        await addDoc(collection(db, "users", uid, "expenses"), {
            item,
            amount,
            date: dateInput,              // user-selected date (YYYY-MM-DD)
            createdAt: serverTimestamp()  // exact time entry was created
        });

        const tr = document.createElement("tr");
        const formattedDate = new Date(dateInput + "T00:00:00")
            .toLocaleDateString("en-US");

        tr.innerHTML = `
            <th scope="row">${tbody.children.length + 1}</th>
            <td>${item}</td>
            <td>${amount.toFixed(2)}</td>
            <td>${formattedDate}</td>
        `;

        tbody.appendChild(tr);

        // Clear the form
        form.reset();
        document.getElementById("date").setAttribute("value", dateChange());
    });
});


function dateChange() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}