```javascript
/* =========================================================
   UPI-EXCHANGE
   Frontend interactions
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------------------------------------
     ELEMENTS
  ------------------------------------------------------- */

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  const authModal = document.getElementById("authModal");
  const closeModal = document.getElementById("closeModal");

  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  const mobileLoginBtn = document.getElementById("mobileLoginBtn");
  const mobileRegisterBtn = document.getElementById("mobileRegisterBtn");

  const heroAccountBtn = document.getElementById("heroAccountBtn");
  const walletLoginBtn = document.getElementById("walletLoginBtn");

  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authEyebrow = document.getElementById("authEyebrow");
  const authDescription = document.getElementById("authDescription");
  const authSubmit = document.getElementById("authSubmit");

  const nameField = document.getElementById("nameField");
  const usernameInput = document.getElementById("username");

  const switchAuth = document.getElementById("switchAuth");
  const switchText = document.getElementById("switchText");

  const forgotBtn = document.getElementById("forgotBtn");

  const phoneInput = document.getElementById("phone");

  const sendAmount = document.getElementById("sendAmount");
  const sendCurrency = document.getElementById("sendCurrency");
  const receiveCurrency = document.getElementById("receiveCurrency");
  const receiveAmount = document.getElementById("receiveAmount");
  const rateText = document.getElementById("rateText");

  const continueExchange = document.getElementById("continueExchange");

  const depositBtn = document.getElementById("depositBtn");
  const withdrawBtn = document.getElementById("withdrawBtn");
  const historyBtn = document.getElementById("historyBtn");


  /* -------------------------------------------------------
     MOBILE MENU
  ------------------------------------------------------- */

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("active");
    });
  }

  document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
    });
  });


  /* -------------------------------------------------------
     AUTH MODAL
  ------------------------------------------------------- */

  let authMode = "login";

  function openAuth(mode = "login") {

    authMode = mode;

    authModal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (mode === "register") {

      authEyebrow.textContent = "GET STARTED";

      authTitle.textContent = "Create your account";

      authDescription.textContent =
        "Create an account to manage your exchanges and transactions.";

      nameField.style.display = "block";

      usernameInput.required = true;

      authSubmit.textContent = "Create Account";

      switchText.textContent = "Already have an account?";

      switchAuth.textContent = "Login";

    } else {

      authEyebrow.textContent = "WELCOME BACK";

      authTitle.textContent = "Login to your account";

      authDescription.textContent =
        "Enter your details to continue.";

      nameField.style.display = "none";

      usernameInput.required = false;

      authSubmit.textContent = "Login";

      switchText.textContent = "Don't have an account?";

      switchAuth.textContent = "Create account";
    }

    setTimeout(() => {
      if (mode === "register") {
        usernameInput.focus();
      } else {
        phoneInput.focus();
      }
    }, 100);
  }


  function closeAuth() {
    authModal.classList.remove("active");
    document.body.style.overflow = "";
  }


  if (loginBtn) {
    loginBtn.addEventListener("click", () => openAuth("login"));
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", () => openAuth("register"));
  }

  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      openAuth("login");
    });
  }

  if (mobileRegisterBtn) {
    mobileRegisterBtn.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      openAuth("register");
    });
  }

  if (heroAccountBtn) {
    heroAccountBtn.addEventListener("click", () => openAuth("register"));
  }

  if (walletLoginBtn) {
    walletLoginBtn.addEventListener("click", () => openAuth("login"));
  }

  if (closeModal) {
    closeModal.addEventListener("click", closeAuth);
  }

  authModal.addEventListener("click", event => {
    if (event.target === authModal) {
      closeAuth();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAuth();
    }
  });


  /* -------------------------------------------------------
     SWITCH LOGIN / REGISTER
  ------------------------------------------------------- */

  switchAuth.addEventListener("click", () => {

    if (authMode === "login") {
      openAuth("register");
    } else {
      openAuth("login");
    }

  });


  /* -------------------------------------------------------
     PHONE INPUT
  ------------------------------------------------------- */

  if (phoneInput) {

    phoneInput.addEventListener("input", () => {

      phoneInput.value = phoneInput.value
        .replace(/\D/g, "")
        .slice(0, 10);

    });

  }


  /* -------------------------------------------------------
     AUTH FORM
  ------------------------------------------------------- */

  authForm.addEventListener("submit", event => {

    event.preventDefault();

    const phone = phoneInput.value.trim();
    const password = document.getElementById("password").value.trim();

    if (phone.length !== 10) {
      showMessage("Please enter a valid 10-digit Pakistani mobile number.");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must contain at least 6 characters.");
      return;
    }

    if (authMode === "register") {

      const username = usernameInput.value.trim();

      if (!username) {
        showMessage("Please enter a username.");
        return;
      }

      showMessage(
        "Account registration will be connected to the secure server."
      );

    } else {

      showMessage(
        "Login will be connected to the secure server."
      );

    }

  });


  /* -------------------------------------------------------
     FORGOT PASSWORD
  ------------------------------------------------------- */

  forgotBtn.addEventListener("click", () => {

    showMessage(
      "Password recovery will be handled securely through the account system."
    );

  });


  /* -------------------------------------------------------
     EXCHANGE RATES
  ------------------------------------------------------- */

  const rates = {

    INR_PKR: 3.20,
    USD_PKR: 280,
    AED_PKR: 76,
    PKR_PKR: 1,

    PKR_INR: 1 / 3.20,
    PKR_USD: 1 / 280,
    PKR_AED: 1 / 76

  };


  function getRate(from, to) {

    if (from === to) {
      return 1;
    }

    const directKey = `${from}_${to}`;

    if (rates[directKey]) {
      return rates[directKey];
    }

    if (to === "PKR" && rates[`${from}_PKR`]) {
      return rates[`${from}_PKR`];
    }

    if (from === "PKR" && rates[`PKR_${to}`]) {
      return rates[`PKR_${to`}`];
    }

    return 1;
  }


  function calculateExchange() {

    const amount = Number(sendAmount.value) || 0;

    const from = sendCurrency.value;
    const to = receiveCurrency.value;

    let rate = 1;

    if (from === "INR" && to === "PKR") {
      rate = 3.20;
    } else if (from === "USD" && to === "PKR") {
      rate = 280;
    } else if (from === "AED" && to === "PKR") {
      rate = 76;
    } else if (from === "PKR" && to === "INR") {
      rate = 1 / 3.20;
    } else if (from === "PKR" && to === "USD") {
      rate = 1 / 280;
    } else if (from === "PKR" && to === "AED") {
      rate = 1 / 76;
    } else {
      rate = 1;
    }

    const result = amount * rate;

    receiveAmount.value = result.toFixed(2);

    rateText.textContent =
      `1 ${from} = ${formatRate(rate)} ${to}`;
  }


  function formatRate(value) {

    if (value >= 1) {
      return value.toFixed(2);
    }

    return value.toFixed(5);
  }


  sendAmount.addEventListener("input", calculateExchange);
  sendCurrency.addEventListener("change", calculateExchange);
  receiveCurrency.addEventListener("change", calculateExchange);


  /* -------------------------------------------------------
     CONTINUE EXCHANGE
  ------------------------------------------------------- */

  continueExchange.addEventListener("click", () => {

    const amount = Number(sendAmount.value);

    const method =
      document.getElementById("paymentMethod").value;

    const receiver =
      document.getElementById("receiver").value.trim();

    if (!amount || amount <= 0) {
      showMessage("Please enter a valid amount.");
      return;
    }

    if (!receiver) {
      showMessage("Please enter the receiver number or wallet.");
      return;
    }

    openAuth("login");

  });


  /* -------------------------------------------------------
     WALLET BUTTONS
  ------------------------------------------------------- */

  depositBtn.addEventListener("click", () => {
    openAuth("login");
  });

  withdrawBtn.addEventListener("click", () => {
    openAuth("login");
  });

  historyBtn.addEventListener("click", () => {
    openAuth("login");
  });


  /* -------------------------------------------------------
     HERO EXCHANGE BUTTON
  ------------------------------------------------------- */

  document.getElementById("heroExchangeBtn").addEventListener("click", () => {

    document.getElementById("exchange").scrollIntoView({
      behavior: "smooth"
    });

  });


  /* -------------------------------------------------------
     SIMPLE MESSAGE
  ------------------------------------------------------- */

  function showMessage(message) {

    const existing = document.querySelector(".site-message");

    if (existing) {
      existing.remove();
    }

    const messageBox = document.createElement("div");

    messageBox.className = "site-message";

    messageBox.textContent = message;

    Object.assign(messageBox.style, {
      position: "fixed",
      top: "90px",
      right: "20px",
      zIndex: "9999",
      maxWidth: "330px",
      padding: "14px 17px",
      background: "#0d1915",
      color: "#f4faf7",
      border: "1px solid #263a32",
      borderRadius: "12px",
      boxShadow: "0 15px 45px rgba(0,0,0,.35)",
      fontSize: "12px"
    });

    document.body.appendChild(messageBox);

    setTimeout(() => {

      messageBox.style.opacity = "0";
      messageBox.style.transition = "opacity .25s";

      setTimeout(() => {
        messageBox.remove();
      }, 300);

    }, 3500);

  }


  /* -------------------------------------------------------
     INITIAL CALCULATION
  ------------------------------------------------------- */

  calculateExchange();

});
```
