import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, getDocs, serverTimestamp, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyD4LF3rVTE4jKzf5lh6UII8SlsifRd2GEw",
    authDomain: "fintrack.omkanabar.com",
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

const itemInput = document.getElementById("item");
const amountInput = document.getElementById("amount");
const dateInputElement = document.getElementById("date");

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
        redirect("/auth/signup.html", "/auth/signup");
        return;
    }
    if (!auth.currentUser.emailVerified) {
        redirect("/auth/verify.html", "/auth/verify");
        return;
    }
    
    tableHead();
    //fetch data from firebase
    const uid = user.uid;
    let expenses = await fetchData(uid);
    let sortExpenses = await sortData(expenses);
    await fillData(sortExpenses);
    signOutUser();

    const form = document.getElementById("item-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const item = itemInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const dateInput = dateInputElement.value;

        validation(form);
        if (!form.checkValidity()) return;

        // Add expense to Firestore
        const docRef = await addDoc(
            collection(db, "users", auth.currentUser.uid, "expenses"),
            {
                item,
                amount,
                date: dateInput,
                createdAt: serverTimestamp()
            }
        );

        const newExpense = {
            id: docRef.id,
            item,
            amount,
            date: dateInput,
            createdAt: new Date()
        };

        await insertRow(newExpense);

        window.location.hash = docRef.id;

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
    for (let i = 0; i < tableHeads.length; i++) {
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
        const expenseDate = parseYMD(expense.date);
        const monthDiff = getMonthDiff(expenseDate);

        const targetTable = getTargetTable(monthDiff);
        addRowToTable(expense, targetTable);
    }
    return;
}

function addRowToTable(expense, parent) {
    const data = expense;
    const tr = document.createElement("tr");
    tr.setAttribute("data-date", data.date);
    let dateObj;
    if (expense.createdAt.toDate) {
        dateObj = expense.createdAt.toDate();
    } else {
        dateObj = expense.createdAt;
    }
    const timestamp = dateObj.getTime();
    tr.setAttribute("data-time", timestamp.toString());
    tr.setAttribute("id", data.id);
    const date = data.date
        ? new Date(data.date + "T00:00:00").toLocaleDateString("en-US")
        : "";
    tr.innerHTML = `
        <th scope="row">${parent.children.length + 1}</th>
        <td>${data.item}</td>
        <td>${data.amount.toFixed(2)}</td>
        <td>${date}</td>
        <td>
            <button class="btn btn-sm btn-outline-danger delete-btn" title="Delete expense">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
            </button>
        </td>
    `;
    parent.appendChild(tr);
    tr.querySelector(".delete-btn").addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "expenses", data.id));
        tr.remove();
        // Update row numbers
        for (let i = 0; i < parent.children.length; i++) {
            parent.children[i].querySelector("th").textContent = i + 1;
        }
    });
}

function parseYMD(dateStr) {
    return new Date(dateStr + "T00:00:00");
}

function getMonthDiff(expenseDate) {
    const expenseYear = expenseDate.getFullYear();
    const expenseMonth = expenseDate.getMonth();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();
    return (thisYear - expenseYear) * 12 + (thisMonth - expenseMonth);
}

function getTargetTable(monthDiff) {
    if (monthDiff === 0) return tables.thisMonth;
    if (monthDiff === 1) return tables.lastMonth;
    if (monthDiff === 2) return tables.twoMonthsAgo;
    return tables.archive;
}

function validation(form) {
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
    const selectedDate = parseYMD(dateInput);
    const monthDiff = getMonthDiff(selectedDate);
    if (monthDiff < 0) dateInputElement.setCustomValidity("invalid");
    else dateInputElement.setCustomValidity("");

    // Trigger Bootstrap validation
    form.classList.add("was-validated");
}

async function insertRow(newExpense){
    let table = getTargetTable(getMonthDiff(parseYMD(newExpense.date)));
    let rowNumber = await insertSearch(newExpense, table);
    const tr = document.createElement("tr");
    tr.setAttribute("id", newExpense.id);
    const formattedDate = new Date(newExpense.date + "T00:00:00").toLocaleDateString("en-US");
    tr.innerHTML = `
        <th scope="row">${rowNumber + 1}</th>
        <td>${newExpense.item}</td>
        <td>${newExpense.amount.toFixed(2)}</td>
        <td>${formattedDate}</td>
        <td>
            <button class="btn btn-sm btn-outline-danger delete-btn" title="Delete expense">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
            </button>
        </td>
    `;
    if (rowNumber < table.children.length) {
        table.insertBefore(tr, table.children[rowNumber]);
    } else {
        table.appendChild(tr);
    }
    tr.classList.add("table-active");
    tr.querySelector(".delete-btn").addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "expenses", newExpense.id));
        tr.remove();
        // Update row numbers
        for (let i = 0; i < table.children.length; i++) {
            table.children[i].querySelector("th").textContent = i + 1;
        }
    });
    for (let i = rowNumber; i < table.children.length; i++) {
        table.children[i].querySelector("th").textContent = i + 1;
    }
    setTimeout(() => {
        tr.classList.remove("table-active");
    }, 2500);
}

async function insertSearch(newExpense, table) {
    const expenseDateObj = new Date(newExpense.date + "T00:00:00");
    const expenseDate = expenseDateObj.getTime();
    const time = newExpense.createdAt.toDate ? newExpense.createdAt.toDate().getTime() : newExpense.createdAt.getTime();
    let rows = [...Array.from(table.querySelectorAll('tr'))];
    let left = 0;
    let right = rows.length - 1;
    let insertIndex = rows.length; 
    let rowDate;
    let rowTime;
    let mid;
    while (left <= right) {
        mid = Math.floor((left + right)/2);
        rowDate = rows[mid].dataset.date;
        rowTime = Number(rows[mid].dataset.time) || "0";
        const midDateObj = new Date(rowDate + "T00:00:00");
        const midDate = midDateObj.getTime();
        if (expenseDate < midDate) {
            left = mid + 1;
        } else if (expenseDate > midDate) {
            insertIndex = mid;
            right = mid - 1;
        } else {
            if (time < rowTime) {
                left = mid + 1;
            } else {
                insertIndex = mid;
                right = mid - 1;
            }
        }
    }

    return insertIndex;
}

async function signOutUser() {
    const signOutButton = document.getElementById("signout-button");
    signOutButton.addEventListener("click", async (event) => {
        try {
            await signOut(auth);
            redirect("/index.html", "/")
        } catch(error) {
            console.error("Sign out failed: ", error);
        }
    });   
}

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