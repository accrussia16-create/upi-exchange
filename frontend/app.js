```javascript
/* =========================================================
   UPI EXCHANGE
   Frontend Application
========================================================= */

"use strict";


/* =========================================================
   DEMO FRONTEND DATA
   This will later be replaced by the Railway API.
========================================================= */

const RATES = {
  INR: {
    PKR: 3.20,
    USD: 0.0114,
    AED: 0.0419,
    INR: 1
  },

  USD: {
    PKR: 280,
    INR: 87.7,
    AED: 3.67,
    USD: 1
  },

  AED: {
    PKR: 76,
    INR: 23.8,
    USD: 0.2725,
    AED: 1
  },

  PKR: {
    INR: 0.3125,
    USD: 0.00357,
    AED: 0.01316,
    PKR: 1
  }
};


const PAYMENT_METHODS = {
  UPI: {
    name: "UPI",
    icon: "U",
    className: "upi"
  },

  EasyPaisa: {
    name: "EasyPaisa",
    icon: "E",
    className: "easypaisa"
  },

  JazzCash: {
    name: "JazzCash",
    icon: "J",
    className: "jazzcash"
  },

  USDT: {
    name: "USDT",
    icon: "₮",
    className: "usdt"
  }
};


/* =========================================================
   STATE
========================================================= */

const state = {
  user: null,

  balance: 0,

  transactions: [],

  currentPage: "home",

  paymentSession: null,

  paymentTimer: null,

  selectedTransactionFilter: "all"
};


/* =========================================================
   HELPERS
========================================================= */

function $(selector) {
  return document.querySelector(selector);
}


function $$(selector) {
  return document.querySelectorAll(selector);
}


function formatMoney(value, decimals = 2) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}


function getRate(from, to) {

  if (from === to) {
    return 1;
  }

  return RATES[from]?.[to] || 1;
}


function getInitial(username = "User") {
  return username.trim().charAt(0).toUpperCase() || "U";
}


function generateReference(prefix = "TXN") {

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let i = 0; i < 7; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${prefix}-${result}`;
}


function formatDate(date = new Date()) {

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {

  const container = $("#toastContainer");

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3000);
}


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLogin() {

  $("#loginView").classList.remove("hidden");

  $("#registerView").classList.add("hidden");
}


function showRegister() {

  $("#loginView").classList.add("hidden");

  $("#registerView").classList.remove("hidden");
}


function openApp() {

  $("#authScreen").classList.add("hidden");

  $("#appShell").classList.remove("hidden");

  loadUserIntoUI();

  renderTransactions();

  updateDashboardStats();

  navigateTo("home");
}


function logout() {

  state.user = null;

  localStorage.removeItem("upiExchangeUser");

  stopPaymentTimer();

  $("#appShell").classList.add("hidden");

  $("#authScreen").classList.remove("hidden");

  showLogin();

  showToast("You have been logged out.");

}


/* =========================================================
   REGISTRATION
========================================================= */

function handleRegister(event) {

  event.preventDefault();

  const username = $("#registerUsername").value.trim();

  const phone = $("#registerPhone").value.trim();

  const email = $("#registerEmail").value.trim();

  const password = $("#registerPassword").value;

  const confirmPassword = $("#registerConfirmPassword").value;

  const terms = $("#agreeTerms").checked;


  if (username.length < 3) {

    showToast(
      "Username must contain at least 3 characters.",
      "error"
    );

    return;
  }


  if (!/^\d{10}$/.test(phone)) {

    showToast(
      "Enter a valid 10-digit Pakistani phone number.",
      "error"
    );

    return;
  }


  if (password.length < 8) {

    showToast(
      "Password must contain at least 8 characters.",
      "error"
    );

    return;
  }


  if (password !== confirmPassword) {

    showToast(
      "Passwords do not match.",
      "error"
    );

    return;
  }


  if (!terms) {

    showToast(
      "Please accept the Terms of Service.",
      "error"
    );

    return;
  }


  /*
    Frontend prototype only.

    Later:
    POST /api/auth/register
  */

  state.user = {
    username,
    phone: `+92${phone}`,
    email
  };

  state.balance = 0;

  state.transactions = [];


  localStorage.setItem(
    "upiExchangeUser",
    JSON.stringify(state.user)
  );


  $("#registerForm").reset();

  showToast("Account created successfully.");

  openApp();
}


/* =========================================================
   LOGIN
========================================================= */

function handleLogin(event) {

  event.preventDefault();

  const identifier =
    $("#loginIdentifier").value.trim();

  const password =
    $("#loginPassword").value;


  if (!identifier || !password) {

    showToast(
      "Please enter your login details.",
      "error"
    );

    return;
  }


  /*
    Frontend prototype only.

    Later:
    POST /api/auth/login
  */

  const savedUser =
    JSON.parse(
      localStorage.getItem("upiExchangeUser") || "null"
    );


  if (savedUser) {

    state.user = savedUser;

  } else {

    state.user = {
      username:
        identifier.includes("@")
          ? identifier.split("@")[0]
          : identifier,

      phone:
        identifier.startsWith("+92")
          ? identifier
          : "+92",

      email:
        identifier.includes("@")
          ? identifier
          : "account@example.com"
    };

  }


  state.balance = Number(
    localStorage.getItem("upiExchangeBalance") || 0
  );


  state.transactions =
    JSON.parse(
      localStorage.getItem("upiExchangeTransactions") || "[]"
    );


  openApp();

  $("#loginForm").reset();

  showToast("Login successful.");

}


/* =========================================================
   USER UI
========================================================= */

function loadUserIntoUI() {

  if (!state.user) {
    return;
  }


  const username =
    state.user.username || "User";

  const phone =
    state.user.phone || "+92";


  $("#topUsername").textContent = username;

  $("#topPhone").textContent = phone;

  $("#welcomeUsername").textContent = username;


  $("#profileName").textContent = username;

  $("#profileUsername").textContent = username;

  $("#profilePhone").textContent = phone;

  $("#profileEmail").textContent =
    state.user.email || "—";


  const initial =
    getInitial(username);


  $("#topAvatar").textContent = initial;

  $("#profileAvatar").textContent = initial;


  updateBalanceUI();

}


/* =========================================================
   BALANCE
========================================================= */

function updateBalanceUI() {

  const formatted =
    formatMoney(state.balance);


  $("#mainBalance").textContent = formatted;

  $("#walletBalance").textContent = formatted;


  localStorage.setItem(
    "upiExchangeBalance",
    String(state.balance)
  );

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateTo(page) {

  const pageElement =
    $(`#page-${page}`);


  if (!pageElement) {
    return;
  }


  $$(".page").forEach((item) => {
    item.classList.remove("active");
  });


  pageElement.classList.add("active");


  $$(".nav-item").forEach((item) => {

    item.classList.toggle(
      "active",
      item.dataset.page === page
    );

  });


  const titles = {
    home: "Dashboard",
    exchange: "Exchange",
    wallet: "Wallet",
    transactions: "Transactions",
    notifications: "Notifications",
    profile: "Profile & Security",
    support: "Support",
    payment: "Payment"
  };


  $("#pageTitle").textContent =
    titles[page] || "Dashboard";


  state.currentPage = page;


  closeMobileSidebar();


  if (page === "transactions") {
    renderTransactions();
  }

}


/* =========================================================
   EXCHANGE CALCULATION
========================================================= */

function calculateExchange(
  amountElement,
  fromElement,
  toElement,
  receiveElement,
  rateElement = null
) {

  const amount =
    Number(amountElement.value || 0);

  const from =
    fromElement.value;

  const to =
    toElement.value;


  const rate =
    getRate(from, to);


  const receive =
    amount * rate;


  receiveElement.value =
    formatMoney(receive);


  if (rateElement) {

    rateElement.textContent =
      `1 ${from} = ${formatMoney(rate, 4)} ${to}`;

  }


  return {
    amount,
    from,
    to,
    rate,
    receive
  };

}


/* =========================================================
   QUICK EXCHANGE
========================================================= */

function updateQuickExchange() {

  calculateExchange(
    $("#quickAmount"),
    $("#quickFrom"),
    $("#quickTo"),
    $("#quickReceive"),
    $("#quickRate")
  );

}


function handleQuickExchange(event) {

  event.preventDefault();

  const result =
    calculateExchange(
      $("#quickAmount"),
      $("#quickFrom"),
      $("#quickTo"),
      $("#quickReceive"),
      $("#quickRate")
    );


  startPaymentSession({
    amount: result.amount,
    from: result.from,
    to: result.to,
    receive: result.receive,
    rate: result.rate,
    method: "EasyPaisa",
    receiver: ""
  });

}


/* =========================================================
   FULL EXCHANGE
========================================================= */

function updateFullExchange() {

  const result =
    calculateExchange(
      $("#exchangeAmount"),
      $("#exchangeFrom"),
      $("#exchangeTo"),
      $("#exchangeReceive"),
      $("#exchangeRate")
    );


  $("#exchangeSummaryReceive").textContent =
    `${formatMoney(result.receive)} ${result.to}`;

}


function handleStartExchange() {

  const amount =
    Number($("#exchangeAmount").value || 0);

  const from =
    $("#exchangeFrom").value;

  const to =
    $("#exchangeTo").value;

  const method =
    $("#receiveMethod").value;

  const receiver =
    $("#receiverNumber").value.trim();


  if (amount <= 0) {

    showToast(
      "Enter a valid exchange amount.",
      "error"
    );

    return;
  }


  if (!receiver) {

    showToast(
      "Enter the receiver number or wallet address.",
      "error"
    );

    return;
  }


  const rate =
    getRate(from, to);

  const receive =
    amount * rate;


  startPaymentSession({
    amount,
    from,
    to,
    receive,
    rate,
    method,
    receiver
  });

}


/* =========================================================
   SWAP CURRENCIES
========================================================= */

function swapCurrencies() {

  const from =
    $("#exchangeFrom").value;

  const to =
    $("#exchangeTo").value;


  $("#exchangeFrom").value = to;

  $("#exchangeTo").value = from;


  updateFullExchange();

}


/* =========================================================
   PAYMENT SESSION
========================================================= */

function startPaymentSession(data) {

  const reference =
    generateReference("PAY");


  /*
    IMPORTANT:

    This frontend countdown is only visual.

    Later the backend will create the actual
    payment session and provide:

    paymentId
    expiresAt
    server-controlled status

    The customer will never see this internal
    architecture.
  */


  const expiresAt =
    Date.now() + (15 * 60 * 1000);


  state.paymentSession = {
    ...data,
    reference,
    expiresAt,
    status: "pending"
  };


  fillPaymentPage();


  navigateTo("payment");


  startPaymentTimer();

}


/* =========================================================
   PAYMENT PAGE
========================================================= */

function fillPaymentPage() {

  const session =
    state.paymentSession;


  if (!session) {
    return;
  }


  $("#paymentReference").textContent =
    session.reference;


  $("#paymentSendAmount").textContent =
    formatMoney(session.amount);


  $("#paymentSendCurrency").textContent =
    session.from;


  $("#paymentReceiveAmount").textContent =
    formatMoney(session.receive);


  $("#paymentReceiveCurrency").textContent =
    session.to;


  $("#paymentPageRate").textContent =
    `1 ${session.from} = ${formatMoney(session.rate, 4)} ${session.to}`;


  $("#paymentDestination").textContent =
    session.receiver || "Not provided";


  const method =
    PAYMENT_METHODS[session.method] ||
    PAYMENT_METHODS.EasyPaisa;


  const icon =
    $("#paymentMethodIcon");


  icon.textContent =
    method.icon;


  icon.className =
    `method-icon ${method.className}`;


  $("#paymentMethodName").textContent =
    method.name;


  $("#transactionReference").value = "";


  $("#submitPaymentBtn").disabled = false;

  $("#cancelPaymentBtn").disabled = false;


  $("#paymentTimerBox").classList.remove(
    "payment-expired"
  );


  $("#paymentTimerBox").innerHTML = `
    <span>Payment session expires in</span>
    <strong id="paymentTimer">15:00</strong>
  `;

}


/* =========================================================
   PAYMENT TIMER
========================================================= */

function startPaymentTimer() {

  stopPaymentTimer();


  function tick() {

    const session =
      state.paymentSession;


    if (!session) {
      return;
    }


    const remaining =
      Math.max(
        0,
        session.expiresAt - Date.now()
      );


    const totalSeconds =
      Math.floor(remaining / 1000);


    const minutes =
      Math.floor(totalSeconds / 60);


    const seconds =
      totalSeconds % 60;


    const timer =
      $("#paymentTimer");


    if (!timer) {
      return;
    }


    timer.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    if (remaining <= 0) {

      expirePaymentSession();

    }

  }


  tick();


  state.paymentTimer =
    setInterval(tick, 1000);

}


function stopPaymentTimer() {

  if (state.paymentTimer) {

    clearInterval(
      state.paymentTimer
    );

    state.paymentTimer = null;

  }

}


function expirePaymentSession() {

  stopPaymentTimer();


  if (!state.paymentSession) {
    return;
  }


  state.paymentSession.status =
    "expired";


  const timerBox =
    $("#paymentTimerBox");


  if (timerBox) {

    timerBox.classList.add(
      "payment-expired"
    );

    timerBox.innerHTML = `
      <span>Payment session</span>
      <strong>Expired</strong>
    `;

  }


  $("#submitPaymentBtn").disabled =
    true;


  $("#cancelPaymentBtn").disabled =
    false;


  showToast(
    "This payment session has expired.",
    "error"
  );

}


/* =========================================================
   SUBMIT PAYMENT
========================================================= */

function handleSubmitPayment() {

  const session =
    state.paymentSession;


  if (!session) {

    showToast(
      "Payment session not found.",
      "error"
    );

    return;
  }


  if (session.status === "expired") {

    showToast(
      "This payment session has expired.",
      "error"
    );

    return;
  }


  const reference =
    $("#transactionReference").value.trim();


  if (!reference) {

    showToast(
      "Enter your payment reference.",
      "error"
    );

    return;
  }


  /*
    Later:

    POST /api/payment-sessions/:id/submit

    The backend will verify the payment
    before changing any financial state.
  */


  const transaction = {

    id: generateReference("TXN"),

    type: "exchange",

    details:
      `${session.amount} ${session.from} → ${session.receive} ${session.to}`,

    amount:
      `${formatMoney(session.receive)} ${session.to}`,

    status: "pending",

    date:
      formatDate(),

    paymentReference:
      session.reference

  };


  state.transactions.unshift(
    transaction
  );


  saveTransactions();


  stopPaymentTimer();


  state.paymentSession.status =
    "submitted";


  showToast(
    "Payment submitted for processing."
  );


  navigateTo("transactions");


  renderTransactions();

  updateDashboardStats();

}


/* =========================================================
   CANCEL PAYMENT
========================================================= */

function cancelPayment() {

  stopPaymentTimer();

  state.paymentSession = null;

  navigateTo("exchange");

  showToast(
    "Payment session cancelled."
  );

}


/* =========================================================
   TRANSACTIONS
========================================================= */

function saveTransactions() {

  localStorage.setItem(
    "upiExchangeTransactions",
    JSON.stringify(
      state.transactions
    )
  );

}


function renderTransactions() {

  const body =
    $("#transactionsBody");

  const recentBody =
    $("#recentTransactionsBody");


  if (!body) {
    return;
  }


  let transactions =
    [...state.transactions];


  if (
    state.selectedTransactionFilter !== "all"
  ) {

    transactions =
      transactions.filter(
        (transaction) =>
          transaction.type ===
          state.selectedTransactionFilter
      );

  }


  if (!transactions.length) {

    body.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          No transactions found.
        </td>
      </tr>
    `;

  } else {

    body.innerHTML =
      transactions.map(
        transactionRow
      ).join("");

  }


  if (recentBody) {

    const recent =
      state.transactions.slice(0, 5);


    if (!recent.length) {

      recentBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">
            No transactions yet.
          </td>
        </tr>
      `;

    } else {

      recentBody.innerHTML =
        recent.map(
          transactionRecentRow
        ).join("");

    }

  }

}


function transactionRow(transaction) {

  const status =
    transaction.status || "pending";


  return `
    <tr>

      <td>
        <strong>${escapeHtml(transaction.id)}</strong>
      </td>

      <td>
        ${escapeHtml(
          capitalize(transaction.type)
        )}
      </td>

      <td>
        ${escapeHtml(transaction.details || "—")}
      </td>

      <td>
        ${escapeHtml(transaction.amount || "—")}
      </td>

      <td>
        <span class="status-badge ${status}">
          ${capitalize(status)}
        </span>
      </td>

      <td>
        ${escapeHtml(transaction.date || "—")}
      </td>

    </tr>
  `;

}


function transactionRecentRow(transaction) {

  const status =
    transaction.status || "pending";


  return `
    <tr>

      <td>
        <strong>${escapeHtml(transaction.id)}</strong>
      </td>

      <td>
        ${escapeHtml(
          capitalize(transaction.type)
        )}
      </td>

      <td>
        ${escapeHtml(transaction.amount || "—")}
      </td>

      <td>
        <span class="status-badge ${status}">
          ${capitalize(status)}
        </span>
      </td>

      <td>
        ${escapeHtml(transaction.date || "—")}
      </td>

    </tr>
  `;

}


function updateDashboardStats() {

  const exchanges =
    state.transactions.filter(
      (t) => t.type === "exchange"
    ).length;


  const deposits =
    state.transactions.filter(
      (t) => t.type === "deposit"
    ).length;


  const withdrawals =
    state.transactions.filter(
      (t) => t.type === "withdrawal"
    ).length;


  const pending =
    state.transactions.filter(
      (t) => t.status === "pending"
    ).length;


  $("#exchangeCount").textContent =
    exchanges;

  $("#depositCount").textContent =
    deposits;

  $("#withdrawCount").textContent =
    withdrawals;

  $("#pendingCount").textContent =
    pending;

}


/* =========================================================
   DEPOSIT / WITHDRAW
========================================================= */

function openDepositModal() {

  openModal(`
    <div class="modal-heading">
      <h2>Deposit Funds</h2>
      <p>
        Select a payment method to start your deposit.
      </p>
    </div>

    <div class="payment-method-list">

      ${Object.keys(PAYMENT_METHODS)
        .map((key) => {

          const method =
            PAYMENT_METHODS[key];

          return `
            <button
              class="payment-method modal-method"
              data-modal-method="${key}"
            >

              <span class="method-icon ${method.className}">
                ${method.icon}
              </span>

              <span class="method-info">
                <strong>${method.name}</strong>
                <small>Available payment method</small>
              </span>

              <span class="method-arrow">›</span>

            </button>
          `;

        })
        .join("")}

    </div>
  `);


  $$(".modal-method").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const method =
            button.dataset.modalMethod;

          openDepositAmountModal(
            method
          );

        }
      );

    }
  );

}


function openDepositAmountModal(method) {

  openModal(`
    <div class="modal-heading">
      <h2>Deposit via ${escapeHtml(method)}</h2>
      <p>Enter the amount you want to deposit.</p>
    </div>

    <div class="form-group">
      <label>Amount</label>

      <input
        id="modalDepositAmount"
        type="number"
        min="1"
        step="0.01"
        placeholder="Enter amount"
      >
    </div>

    <button
      id="confirmDepositBtn"
      class="primary-button full-width"
    >
      Continue
    </button>
  `);


  $("#confirmDepositBtn")
    .addEventListener(
      "click",
      () => {

        const amount =
          Number(
            $("#modalDepositAmount").value
          );


        if (amount <= 0) {

          showToast(
            "Enter a valid amount.",
            "error"
          );

          return;
        }


        const transaction = {

          id: generateReference("DEP"),

          type: "deposit",

          details:
            `Deposit via ${method}`,

          amount:
            `${formatMoney(amount)} PKR`,

          status: "pending",

          date:
            formatDate()

        };


        state.transactions.unshift(
          transaction
        );


        saveTransactions();

        updateDashboardStats();

        renderTransactions();

        closeModal();


        showToast(
          "Deposit request submitted."
        );

      }
    );

}


function openWithdrawModal() {

  openModal(`
    <div class="modal-heading">
      <h2>Withdraw Funds</h2>
      <p>
        Enter your withdrawal amount and destination.
      </p>
    </div>

    <div class="form-group">
      <label>Amount (PKR)</label>

      <input
        id="modalWithdrawAmount"
        type="number"
        min="1"
        step="0.01"
        placeholder="Enter amount"
      >
    </div>

    <div class="form-group">
      <label>Payment Method</label>

      <select id="modalWithdrawMethod">

        <option value="EasyPaisa">
          EasyPaisa
        </option>

        <option value="JazzCash">
          JazzCash
        </option>

        <option value="UPI">
          UPI
        </option>

        <option value="USDT">
          USDT
        </option>

      </select>
    </div>

    <div class="form-group">
      <label>Destination</label>

      <input
        id="modalWithdrawDestination"
        type="text"
        placeholder="Number or wallet address"
      >
    </div>

    <button
      id="confirmWithdrawBtn"
      class="primary-button full-width"
    >
      Submit Withdrawal
    </button>
  `);


  $("#confirmWithdrawBtn")
    .addEventListener(
      "click",
      () => {

        const amount =
          Number(
            $("#modalWithdrawAmount").value
          );


        const method =
          $("#modalWithdrawMethod").value;


        const destination =
          $("#modalWithdrawDestination")
            .value.trim();


        if (amount <= 0) {

          showToast(
            "Enter a valid withdrawal amount.",
            "error"
          );

          return;
        }


        if (amount > state.balance) {

          showToast(
            "Insufficient balance.",
            "error"
          );

          return;
        }


        if (!destination) {

          showToast(
            "Enter your destination.",
            "error"
          );

          return;
        }


        const transaction = {

          id: generateReference("WDR"),

          type: "withdrawal",

          details:
            `Withdrawal via ${method}`,

          amount:
            `${formatMoney(amount)} PKR`,

          status: "pending",

          date:
            formatDate()

        };


        state.transactions.unshift(
          transaction
        );


        saveTransactions();

        updateDashboardStats();

        renderTransactions();

        closeModal();


        showToast(
          "Withdrawal request submitted."
        );

      }
    );

}


/* =========================================================
   PASSWORD
========================================================= */

function handleChangePassword(event) {

  event.preventDefault();


  const current =
    $("#currentPassword").value;

  const next =
    $("#newPassword").value;

  const confirm =
    $("#confirmNewPassword").value;


  if (!current || !next || !confirm) {

    showToast(
      "Please complete all password fields.",
      "error"
    );

    return;
  }


  if (next.length < 8) {

    showToast(
      "New password must contain at least 8 characters.",
      "error"
    );

    return;
  }


  if (next !== confirm) {

    showToast(
      "New passwords do not match.",
      "error"
    );

    return;
  }


  /*
    Later:
    PUT /api/me/password
  */


  $("#changePasswordForm").reset();


  showToast(
    "Password updated successfully."
  );

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

function forgotPassword() {

  openModal(`
    <div class="modal-heading">
      <h2>Forgot Password</h2>

      <p>
        Enter your registered email address.
        Instructions will be provided for resetting
        your password.
      </p>
    </div>

    <div class="form-group">

      <label>Email Address</label>

      <input
        id="forgotEmail"
        type="email"
        placeholder="you@example.com"
      >

    </div>

    <button
      id="forgotSubmitBtn"
      class="primary-button full-width"
    >
      Continue
    </button>
  `);


  $("#forgotSubmitBtn")
    .addEventListener(
      "click",
      () => {

        const email =
          $("#forgotEmail").value.trim();


        if (!email) {

          showToast(
            "Enter your email address.",
            "error"
          );

          return;
        }


        closeModal();


        showToast(
          "If the account exists, password reset instructions will be sent."
        );

      }
    );

}


/* =========================================================
   SUPPORT
========================================================= */

function openSupportModal() {

  openModal(`
    <div class="modal-heading">
      <h2>Contact Support</h2>
      <p>
        Describe your issue and include a transaction
        reference if applicable.
      </p>
    </div>

    <div class="form-group">
      <label>Subject</label>

      <input
        id="supportSubject"
        type="text"
        placeholder="What do you need help with?"
      >
    </div>

    <div class="form-group">
      <label>Message</label>

      <textarea
        id="supportMessage"
        placeholder="Describe your issue..."
      ></textarea>
    </div>

    <button
      id="sendSupportBtn"
      class="primary-button full-width"
    >
      Send Message
    </button>
  `);


  $("#sendSupportBtn")
    .addEventListener(
      "click",
      () => {

        const subject =
          $("#supportSubject")
            .value.trim();

        const message =
          $("#supportMessage")
            .value.trim();


        if (!subject || !message) {

          showToast(
            "Complete the support form.",
            "error"
          );

          return;
        }


        closeModal();


        showToast(
          "Support request submitted."
        );

      }
    );

}


/* =========================================================
   MODAL
========================================================= */

function openModal(content) {

  $("#modalContent").innerHTML =
    content;

  $("#modalOverlay")
    .classList.remove("hidden");

}


function closeModal() {

  $("#modalOverlay")
    .classList.add("hidden");

  $("#modalContent").innerHTML = "";

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function openMobileSidebar() {

  $("#sidebar")
    .classList.add("open");

  $("#sidebarOverlay")
    .classList.add("active");

}


function closeMobileSidebar() {

  $("#sidebar")
    .classList.remove("open");

  $("#sidebarOverlay")
    .classList.remove("active");

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function togglePassword(button) {

  const target =
    document.getElementById(
      button.dataset.target
    );


  if (!target) {
    return;
  }


  if (target.type === "password") {

    target.type = "text";

    button.textContent = "Hide";

  } else {

    target.type = "password";

    button.textContent = "Show";

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function capitalize(value) {

  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {


  /* AUTH */

  $("#showRegisterBtn")
    .addEventListener(
      "click",
      showRegister
    );


  $("#showLoginBtn")
    .addEventListener(
      "click",
      showLogin
    );


  $("#loginForm")
    .addEventListener(
      "submit",
      handleLogin
    );


  $("#registerForm")
    .addEventListener(
      "submit",
      handleRegister
    );


  $("#forgotPasswordBtn")
    .addEventListener(
      "click",
      forgotPassword
    );


  /* PASSWORD SHOW/HIDE */

  $$(".password-toggle")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => togglePassword(button)
        );

      }
    );


  /* NAVIGATION */

  $$(".nav-item")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => navigateTo(
            button.dataset.page
          )
        );

      }
    );


  $$("[data-page]")
    .forEach(
      (button) => {

        if (
          button.classList.contains(
            "nav-item"
          )
        ) {
          return;
        }

        button.addEventListener(
          "click",
          () => navigateTo(
            button.dataset.page
          )
        );

      }
    );


  /* LOGOUT */

  $("#logoutBtn")
    .addEventListener(
      "click",
      logout
    );


  /* MOBILE MENU */

  $("#mobileMenuBtn")
    .addEventListener(
      "click",
      openMobileSidebar
    );


  $("#sidebarOverlay")
    .addEventListener(
      "click",
      closeMobileSidebar
    );


  /* QUICK EXCHANGE */

  $("#quickAmount")
    .addEventListener(
      "input",
      updateQuickExchange
    );


  $("#quickFrom")
    .addEventListener(
      "change",
      updateQuickExchange
    );


  $("#quickTo")
    .addEventListener(
      "change",
      updateQuickExchange
    );


  $("#quickExchangeForm")
    .addEventListener(
      "submit",
      handleQuickExchange
    );


  /* FULL EXCHANGE */

  $("#exchangeAmount")
    .addEventListener(
      "input",
      updateFullExchange
    );


  $("#exchangeFrom")
    .addEventListener(
      "change",
      updateFullExchange
    );


  $("#exchangeTo")
    .addEventListener(
      "change",
      updateFullExchange
    );


  $("#swapCurrencies")
    .addEventListener(
      "click",
      swapCurrencies
    );


  $("#startExchangeBtn")
    .addEventListener(
      "click",
      handleStartExchange
    );


  /* PAYMENT */

  $("#submitPaymentBtn")
    .addEventListener(
      "click",
      handleSubmitPayment
    );


  $("#cancelPaymentBtn")
    .addEventListener(
      "click",
      cancelPayment
    );


  $("#backToExchange")
    .addEventListener(
      "click",
      () => navigateTo("exchange")
    );


  /* WALLET */

  $$("[data-action='deposit']")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          openDepositModal
        );

      }
    );


  $$("[data-action='withdraw']")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          openWithdrawModal
        );

      }
    );


  /* TRANSACTION FILTERS */

  $$(".filter-button")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            $$(".filter-button")
              .forEach(
                (item) =>
                  item.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            state.selectedTransactionFilter =
              button.dataset.filter;


            renderTransactions();

          }
        );

      }
    );


  /* PASSWORD */

  $("#changePasswordForm")
    .addEventListener(
      "submit",
      handleChangePassword
    );


  /* SUPPORT */

  $("#contactSupportBtn")
    .addEventListener(
      "click",
      openSupportModal
    );


  /* PAYMENT METHODS */

  $$(".payment-method")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const method =
              button.dataset.method;


            navigateTo("exchange");


            $("#receiveMethod").value =
              method;

          }
        );

      }
    );


  /* MODAL */

  $("#closeModalBtn")
    .addEventListener(
      "click",
      closeModal
    );


  $("#modalOverlay")
    .addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          $("#modalOverlay")
        ) {

          closeModal();

        }

      }
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

function init() {

  setupEvents();


  /*
    Initial exchange calculations
  */

  updateQuickExchange();

  updateFullExchange();


  /*
    Load saved demo account.

    Later this will be replaced
    with secure backend authentication.
  */

  const savedUser =
    JSON.parse(
      localStorage.getItem(
        "upiExchangeUser"
      ) || "null"
    );


  if (savedUser) {

    state.user = savedUser;

    state.balance =
      Number(
        localStorage.getItem(
          "upiExchangeBalance"
        ) || 0
      );


    state.transactions =
      JSON.parse(
        localStorage.getItem(
          "upiExchangeTransactions"
        ) || "[]"
      );


    openApp();

  } else {

    $("#authScreen")
      .classList.remove("hidden");

    $("#appShell")
      .classList.add("hidden");

  }

}


document.addEventListener(
  "DOMContentLoaded",
  init
);
```
