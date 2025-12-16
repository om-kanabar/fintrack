const form = document.getElementById("signup-form");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("UserEmail");
    const passwordInput = document.getElementById("Password");
    const confirmInput = document.getElementById("ConfirmPassword");

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    // Reset Bootstrap validation states
    [emailInput, passwordInput, confirmInput].forEach(input => {
        input.classList.remove("is-invalid");
        input.classList.remove("is-valid");
    });

    let valid = true;

    // Email check
    if (!email.includes("@") || !email.includes(".")) {
        emailInput.classList.add("is-invalid");
        valid = false;
    } else {
        emailInput.classList.add("is-valid");
    }

    // Password match
    if (password !== confirmPassword) {
        passwordInput.classList.add("is-invalid");
        confirmInput.classList.add("is-invalid");
        valid = false;
    }

    // Password rules
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const hasSpace = /\s/.test(password);
    const hasEmoji = /[\u{1F300}-\u{1FAFF}]/u.test(password);

    if (
        password.length < 8 ||
        password.length > 20 ||
        !hasLetter ||
        !hasNumber ||
        !hasSpecial ||
        hasSpace ||
        hasEmoji
    ) {
        passwordInput.classList.add("is-invalid");
        valid = false;
    } else if (password === confirmPassword) {
        passwordInput.classList.add("is-valid");
        confirmInput.classList.add("is-valid");
    }

    if (!valid) return;

    // Firebase auth will go here next
});