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

// Initial Setup
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const today = new Date()

const tables = {
    thisMonth: document.getElementById("table1body"),
    lastMonth: document.getElementById("table2body"),
    twoMonthsAgo: document.getElementById("table3body"),
    archive: document.getElementById("table4body")
};

document.getElementById("date").setAttribute("value", dateChange());

// Wait for auth state to load
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        redirect("/login.html", "/login")
        return;
    }
    

    tableHead();
    //fetch data from firebase
    const uid = user.uid;
    let expenses = await fetchData(uid);
    let sortExpenses = await sortData(expenses);
    await fillData(sortExpenses);

    const form = document.getElementById("item-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const amountInput = document.getElementById("amount");
        const itemInput = document.getElementById("item");
        const dateInputElement = document.getElementById("date");

        const item = itemInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const dateInput = dateInputElement.value;

        // Validate amount
        if (isNaN(amount) || amount <= 0) amountInput.setCustomValidity("invalid");
        else amountInput.setCustomValidity("");

        // Validate item
        if (!item) itemInput.setCustomValidity("invalid");
        else itemInput.setCustomValidity("");

        // Validate date (monthDiff >= 0)
        const [selectedYear, selectedMonth] = dateInput.split("-").map(Number);
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0–11
        const monthDiff = (currentYear - selectedYear) * 12 + (currentMonth - (selectedMonth - 1));
        if (monthDiff < 0) dateInputElement.setCustomValidity("invalid");
        else dateInputElement.setCustomValidity("");

        // Trigger Bootstrap validation
        form.classList.add("was-validated");
        if (!form.checkValidity()) return;

        // Add expense to Firestore
        await addDoc(collection(db, "users", auth.currentUser.uid, "expenses"), {
            item,
            amount,
            date: dateInput,
            createdAt: serverTimestamp()
        });

        const newExpense = {
            item,
            amount,
            date: dateInput,
            createdAt: new Date()
        };

        // Clear form
        form.reset();
        form.classList.remove("was-validated");
        amountInput.setCustomValidity("");
        itemInput.setCustomValidity("");
        dateInputElement.setCustomValidity("");
        dateInputElement.value = dateChange();
    });
});

function redirect(locallink, weblink) {
    const hostname = window.location.hostname;
    if (hostname === "127.0.0.1" || hostname === "localhost") {
        window.location.href = locallink;
    } else {
        window.location.href = weblink;
    }
}

function dateChange() {
    return today.toISOString().split('T')[0];
}

function tableHead() {
    const thisMonthTableHead = document.getElementById("table1head");
    const lastMonthTableHead = document.getElementById("table2head");
    const twoMonthsAgoTableHead = document.getElementById("table3head");
    const archiveTableHead = document.getElementById("table4head");
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let dateMonth = today.getMonth();
    let letterMonth = months[dateMonth];
    let year = today.getFullYear();
    thisMonthTableHead.innerHTML = `${letterMonth}, ${year}`;
    archiveTableHead.innerHTML = "Archive";
    const tableHeads = [lastMonthTableHead, twoMonthsAgoTableHead];
    for (let i in tableHeads) {
        let currentTableHead = tableHeads[i];
        dateMonth -= 1;
        if (dateMonth < 0) {
            dateMonth += 12;
            year -= 1;
        } 
        letterMonth = months[dateMonth];
        currentTableHead.innerHTML = `${letterMonth}, ${year}`;
    }
}

async function fetchData(uid) {
    const expensesRef = collection(db, "users", uid, "expenses");
    const querySnapshot = await getDocs(expensesRef);

    const expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return expenses;
}

async function sortData(expenses) {
    const sorted = [...expenses].sort((a, b) => {
        const [aYear, aMonth, aDay] = a.date.split("-").map(Number);
        const [bYear, bMonth, bDay] = b.date.split("-").map(Number);

        const aPriority = aYear * 12 + aMonth;
        const bPriority = bYear * 12 + bMonth;

        if (aPriority !== bPriority) return bPriority - aPriority;
        if (aDay !== bDay) return bDay - aDay;
        return b.createdAt.toDate() - a.createdAt.toDate();
    });

    return sorted;
}

async function fillData(sortExpenses) {
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();

    Object.values(tables).forEach(table => table.innerHTML = "");

    for (const expense of sortExpenses) {
        const expenseDate = new Date(expense.date + "T00:00:00");
        const expenseYear = expenseDate.getFullYear();
        const expenseMonth = expenseDate.getMonth();

        // Calculate difference in months between expense date and current date
        const monthDiff = (thisYear - expenseYear) * 12 + (thisMonth - expenseMonth);

        const targetTable = getTargetTable(monthDiff);
        addRowToTable(expense, targetTable);
    }
    return;
}

function addRowToTable(expense, parent) {
    const data = expense;
    const tr = document.createElement("tr");
    const date = data.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("en-US")
    : "";
    tr.innerHTML = `
        <th scope="row">${parent.children.length + 1}</th>
        <td>${data.item}</td>
        <td>${data.amount.toFixed(2)}</td>
        <td>${date}</td>
    `;
    parent.appendChild(tr);
}

function getMonthDiff(expenseDate) {
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();
    const monthDiff = (thisYear - expenseYear) * 12 + (thisMonth - expenseMonth);
    const expenseYear = expenseDate.getFullYear();
    const expenseMonth = expenseDate.getMonth();
    return monthDiff;
}

function getTargetTable(monthDiff) {
    if (monthDiff === 0) return tables.thisMonth;
    if (monthDiff === 1) return tables.lastMonth;
    if (monthDiff === 2) return tables.twoMonthsAgo;
    return tables.archive;
}