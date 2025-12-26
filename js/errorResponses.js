// This is the function for errors and responses!

const error_messages = {
    "auth/user-not-found": {
        message : "No account exists with that email. Please sign up first.",
        type : "warning"
    },
    "auth/wrong-password": {
        message : "The password you entered is incorrect. Please try again."
    },
    "auth/email-already-in-use": {
        message : "This email is already registered. Try logging in instead.",
        type : "warning"
    },
    "auth/user-mismatch": {
        message : "The credentials you provided do not match. Please verify and try again."
    },
    "auth/invalid-credential": {
        message : "Your email or password is invalid."
    }
};

export function giveError(error, container = "container") {
    console.error(error);

    const errorEntry = error_messages[error.code];

    const message = errorEntry ? errorEntry.message : `An unexpected error occurred. Please contact the developer at https://omkanabar.com/contact with the subject "FinTrack Error", instructions on how to replicate the error, and the following error code ${error}`;
    const type = errorEntry ? errorEntry.type : "danger";

    showBootstrapAlert(message, type, container);
}

function showBootstrapAlert(message, type = "danger", box = "container") {
    const container = document.getElementById(`alert-${box}`);
    if (!container) return;
    container.innerHTML = `
        <div class="alert gr-width mt-5 alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    window.location.hash = "alert-container";
}