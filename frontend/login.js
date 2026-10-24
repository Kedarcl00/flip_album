async function login() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("message");
    const loginBtn = document.getElementById("loginBtn");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput.value;

    if (!password) {
        message.innerHTML = "Please enter your password";
        message.style.color = "#ff6b6b";
        return;
    }

    const baseUrl = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "https://tirthas-bday.onrender.com";

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = "Verifying...";
        message.innerHTML = "";

        const payload = { password };
        if (email) {
            payload.email = email;
        }

        const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem("token", data.token);
            if (data.user) {
                localStorage.setItem("adminUser", JSON.stringify(data.user));
            }

            message.innerHTML = "Login Successful! Redirecting...";
            message.style.color = "#2ecc71";

            setTimeout(() => {
                window.location.href = "admin.html";
            }, 800);
        } else {
            message.innerHTML = data.message || "Invalid credentials";
            message.style.color = "#ff6b6b";
            loginBtn.disabled = false;
            loginBtn.textContent = "Sign In";
        }
    } catch (error) {
        console.error("Login error:", error);
        message.innerHTML = "Server connection error. Please try again.";
        message.style.color = "#ff6b6b";
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In";
    }
}
