// FILE: script.js

// ---------- constants ----------
const CATEGORIES = ["Fruits", "Vegetables", "Snacks", "Milk & Dairy", "Drinks"];

// ---------- helpers ----------
function getData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// keys
const USERS_KEY = "sg_users";
const PRODUCTS_KEY = "sg_products";
const ORDERS_KEY = "sg_orders";
const CURRENT_USER_ID_KEY = "sg_current_user_id";

// ---------- user helpers ----------
function getAllUsers() {
  return getData(USERS_KEY, []);
}
function saveAllUsers(users) {
  setData(USERS_KEY, users);
}

function createUser(name, email, password, role) {
  const users = getAllUsers();
  const exists = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );
  if (exists) {
    return { ok: false, message: "Account already exists with this email and role." };
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role,
    prepaidCount: 0,
    rewardPoints: 0,
    creditLimit: role === "customer" ? 0 : undefined,
    usedCredit: role === "customer" ? 0 : undefined,
    storeStatus: role === "shopkeeper" ? "open" : undefined
  };

  users.push(user);
  saveAllUsers(users);
  return { ok: true, user };
}

function findUser(email, password, role) {
  const users = getAllUsers();
  return users.find(
    u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      u.role === role
  );
}

function setCurrentUserId(id) {
  localStorage.setItem(CURRENT_USER_ID_KEY, id);
}
function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_ID_KEY);
}

function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

function updateUser(updated) {
  const users = getAllUsers();
  const i = users.findIndex(u => u.id === updated.id);
  if (i !== -1) {
    users[i] = updated;
    saveAllUsers(users);
  }
}

// ---------- products ----------
function getAllProducts() {
  return getData(PRODUCTS_KEY, []);
}
function saveAllProducts(products) {
  setData(PRODUCTS_KEY, products);
}

function addProduct(name, price, imageUrl, category, addedById, addedByName) {
  const products = getAllProducts();
  const p = {
    id: Date.now().toString(),
    name,
    price: Number(price),
    imageUrl: imageUrl || "",
    category: category || "Uncategorized",
    addedById,
    addedByName
  };
  products.push(p);
  saveAllProducts(products);
  return p;
}

// ---------- orders ----------
function getAllOrders() {
  return getData(ORDERS_KEY, []);
}
function saveAllOrders(orders) {
  setData(ORDERS_KEY, orders);
}
function addOrder(order) {
  const orders = getAllOrders();
  orders.push(order);
  saveAllOrders(orders);
}

// ---------- cart ----------
function cartKey(userId) {
  return "sg_cart_" + userId;
}
function getCart(userId) {
  return getData(cartKey(userId), []);
}
function saveCart(userId, cart) {
  setData(cartKey(userId), cart);
}
function clearCart(userId) {
  saveCart(userId, []);
}

// ---------- rewards ----------
function earnedPointsForAmount(amount) {
  // 1 point for every ₹20 spent
  return Math.floor(amount / 20);
}

// ---------- logout ----------
function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    window.location.href = "index.html";
  });
}

// ---------- page router ----------
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "signup") initSignupPage();
  if (page === "login") initLoginPage();
  if (page === "customer") initCustomerPage();
  if (page === "shopkeeper") initShopkeeperPage();
});

// ================= SIGNUP PAGE =================
function initSignupPage() {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    msg.textContent = "";

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const role = document.getElementById("signupRole").value;

    if (!name || !email || !password || !role) {
      msg.textContent = "Please fill all fields.";
      msg.style.color = "var(--danger)";
      return;
    }
    if (password.length < 6) {
      msg.textContent = "Password must be at least 6 characters.";
      msg.style.color = "var(--danger)";
      return;
    }

    const res = createUser(name, email, password, role);
    if (!res.ok) {
      msg.textContent = res.message;
      msg.style.color = "var(--danger)";
      return;
    }

    msg.textContent = "Account created! Redirecting to login…";
    msg.style.color = "green";
    setTimeout(() => (window.location.href = "index.html"), 1000);
  });
}

// ================= LOGIN PAGE =================
function initLoginPage() {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");
  if (!form) return;

  const cur = getCurrentUser();
  if (cur) {
    if (cur.role === "customer") window.location.href = "customer.html";
    else if (cur.role === "shopkeeper") window.location.href = "shopkeeper.html";
    return;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    msg.textContent = "";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const role = document.getElementById("loginRole").value;

    if (!email || !password || !role) {
      msg.textContent = "Please fill all fields.";
      msg.style.color = "var(--danger)";
      return;
    }

    const user = findUser(email, password, role);
    if (!user) {
      msg.textContent = "Invalid email, password, or role.";
      msg.style.color = "var(--danger)";
      return;
    }

    setCurrentUserId(user.id);
    if (role === "customer") window.location.href = "customer.html";
    else window.location.href = "shopkeeper.html";
  });
}

// ================= CUSTOMER PAGE =================
function initCustomerPage() {
  let user = getCurrentUser();
  if (!user || user.role !== "customer") {
    window.location.href = "index.html";
    return;
  }
  setupLogout();

  const nameSpan = document.getElementById("custName");
  const rewardSpan = document.getElementById("rewardPoints");
  const prepaidSpan = document.getElementById("prepaidCount");
  const creditLimitSpan = document.getElementById("creditLimit");
  const usedCreditSpan = document.getElementById("usedCredit");
  const productGrid = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryTabsEl = document.getElementById("categoryTabs");

  const cartItemsEl = document.getElementById("cartItems");
  const cartCountLabel = document.getElementById("cartCountLabel");
  const cartSubtotalSpan = document.getElementById("cartSubtotal");
  const cartTotalSpan = document.getElementById("cartTotal");
  const rewardDiscountPreview = document.getElementById("rewardDiscountPreview");
  const useRewardsCheckbox = document.getElementById("useRewards");
  const paymentMethodSelect = document.getElementById("paymentMethod");
  const prepaidBtn = document.getElementById("prepaidBtn");
  const khataBtn = document.getElementById("khataBtn");
  const khataNote = document.getElementById("khataNote");
  const orderHistoryDiv = document.getElementById("orderHistory");

  nameSpan.textContent = user.name;
  rewardSpan.textContent = user.rewardPoints || 0;
  prepaidSpan.textContent = user.prepaidCount || 0;

  // khata unlock after 5 prepaid - set a display credit limit but do NOT block by it
  if ((user.prepaidCount || 0) >= 5 && !user.creditLimit) {
    user.creditLimit = 1000;
    user.usedCredit = user.usedCredit || 0;
    updateUser(user);
  }

  creditLimitSpan.textContent = user.creditLimit || 0;
  usedCreditSpan.textContent = user.usedCredit || 0;

  let searchTerm = "";
  let selectedCategory = "All";

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.toLowerCase();
      renderProducts();
    });
  }

  function getStoreStatusFor(shopkeeperId) {
    const users = getAllUsers();
    const shop = users.find(u => u.id === shopkeeperId);
    return shop && shop.storeStatus ? shop.storeStatus : "open";
  }

  function getStatusBadgeClass(status) {
    if (status === "busy") return "status-busy";
    if (status === "closed") return "status-closed";
    return "status-open";
  }

  function renderCategoryTabs() {
    if (!categoryTabsEl) return;
    categoryTabsEl.innerHTML = "";

    const allTab = document.createElement("button");
    allTab.className =
      "category-tab" + (selectedCategory === "All" ? " active" : "");
    allTab.textContent = "All";
    allTab.addEventListener("click", () => {
      selectedCategory = "All";
      renderCategoryTabs();
      renderProducts();
    });
    categoryTabsEl.appendChild(allTab);

    CATEGORIES.forEach(cat => {
      const btn = document.createElement("button");
      btn.className =
        "category-tab" + (selectedCategory === cat ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        selectedCategory = cat;
        renderCategoryTabs();
        renderProducts();
      });
      categoryTabsEl.appendChild(btn);
    });
  }

  function renderProducts() {
    const products = getAllProducts();
    productGrid.innerHTML = "";

    let filtered = products;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        p => (p.category || "Uncategorized") === selectedCategory
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm)
      );
    }

    if (!filtered.length) {
      productGrid.innerHTML = "<p class='small muted'>No products found.</p>";
      return;
    }

    filtered.forEach(p => {
      const status = getStoreStatusFor(p.addedById);
      const card = document.createElement("div");
      card.className = "product-card";

      const imgUrl =
        p.imageUrl && p.imageUrl.trim() !== ""
          ? p.imageUrl
          : "https://images.pexels.com/photos/4199091/pexels-photo-4199091.jpeg?auto=compress&cs=tinysrgb&w=600";

      const categoryLabel = p.category || "Uncategorized";

      card.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${imgUrl}" alt="${p.name}">
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-meta">
          <span class="product-category-badge">${categoryLabel}</span>
          <span class="store-status-badge ${getStatusBadgeClass(
            status
          )}">${status}</span>
        </div>
        <div class="product-footer">
          <span class="price">₹ ${p.price}</span>
          <button class="btn secondary btn-add" data-id="${p.id}">Add</button>
        </div>
      `;
      productGrid.appendChild(card);
    });

    productGrid.querySelectorAll(".btn-add").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        addToCart(user.id, id);
        renderCart();
      });
    });
  }

  function addToCart(userId, productId) {
    const products = getAllProducts();
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const cart = getCart(userId);
    const existing = cart.find(c => c.productId === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        productId: productId,
        name: p.name,
        price: p.price,
        qty: 1
      });
    }
    saveCart(userId, cart);
  }

  function updateCartQty(userId, productId, delta) {
    let cart = getCart(userId);
    cart = cart
      .map(item =>
        item.productId === productId
          ? { ...item, qty: item.qty + delta }
          : item
      )
      .filter(item => item.qty > 0);
    saveCart(userId, cart);
  }

  function renderCart() {
    const cart = getCart(user.id);
    cartItemsEl.innerHTML = "";

    if (!cart.length) {
      cartItemsEl.innerHTML =
        "<p class='tiny muted'>Cart is empty. Add something tasty ✨</p>";
      cartSubtotalSpan.textContent = "0";
      cartTotalSpan.textContent = "0";
      rewardDiscountPreview.textContent = "0";
      cartCountLabel.textContent = "0 items";
      prepaidBtn.disabled = true;
      khataBtn.disabled = true;
      khataNote.textContent = "Add items to place prepaid or khata orders.";
      return;
    }

    let subtotal = 0;
    let totalItems = 0;

    cart.forEach(item => {
      subtotal += item.price * item.qty;
      totalItems += item.qty;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-main">
          <div>${item.name}</div>
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" data-action="dec" data-id="${item.productId}">-</button>
            <span>${item.qty}</span>
            <button class="cart-qty-btn" data-action="inc" data-id="${item.productId}">+</button>
          </div>
        </div>
        <div>₹ ${item.price * item.qty}</div>
      `;
      cartItemsEl.appendChild(row);
    });

    cartSubtotalSpan.textContent = subtotal.toString();
    cartCountLabel.textContent = `${totalItems} item${totalItems > 1 ? "s" : ""}`;

    let discount = 0;
    if (useRewardsCheckbox.checked) {
      const points = user.rewardPoints || 0;
      discount = Math.min(subtotal, points);
    }
    rewardDiscountPreview.textContent = discount.toString();
    cartTotalSpan.textContent = (subtotal - discount).toString();

    prepaidBtn.disabled = false;

    // Khata available after 5 prepaid orders, no credit limit block
    if ((user.prepaidCount || 0) >= 5) {
      khataBtn.disabled = false;
      khataNote.textContent =
        "Khata available. It will use your running khata balance.";
    } else {
      khataBtn.disabled = true;
      khataNote.textContent = `Khata unlocks after 5 prepaid orders. You have ${
        user.prepaidCount || 0
      }.`;
    }

    cartItemsEl.querySelectorAll(".cart-qty-btn").forEach(btn => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      btn.addEventListener("click", () => {
        updateCartQty(user.id, id, action === "inc" ? 1 : -1);
        renderCart();
      });
    });
  }

  useRewardsCheckbox.addEventListener("change", renderCart);

  function placeOrder(type) {
    const cart = getCart(user.id);
    if (!cart.length) return;

    let subtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
    let discount = 0;

    if (type === "prepaid" && useRewardsCheckbox.checked) {
      const points = user.rewardPoints || 0;
      discount = Math.min(subtotal, points);
      user.rewardPoints = points - discount;
    }

    let toPay = subtotal - discount;

    if (type === "khata") {
      // Only condition: at least 5 prepaid orders, no amount/limit block
      if ((user.prepaidCount || 0) < 5) {
        alert("Khata is not yet unlocked.");
        return;
      }
      user.usedCredit = (user.usedCredit || 0) + subtotal;
    } else {
      const earn = earnedPointsForAmount(toPay);
      user.prepaidCount = (user.prepaidCount || 0) + 1;
      user.rewardPoints = (user.rewardPoints || 0) + earn;

      // if crossing 5 prepaid here, set credit limit for display
      if ((user.prepaidCount || 0) >= 5 && !user.creditLimit) {
        user.creditLimit = 1000;
        user.usedCredit = user.usedCredit || 0;
      }
    }

    updateUser(user);
    user = getCurrentUser() || user;

    const order = {
      id: Date.now().toString(),
      userId: user.id,
      items: cart,
      subtotal,
      discount,
      toPay,
      type,
      paymentMethod: type === "prepaid" ? paymentMethodSelect.value : "khata",
      date: new Date().toLocaleString()
    };
    addOrder(order);

    clearCart(user.id);
    renderCart();
    renderOrders();

    rewardSpan.textContent = user.rewardPoints || 0;
    prepaidSpan.textContent = user.prepaidCount || 0;
    creditLimitSpan.textContent = user.creditLimit || 0;
    usedCreditSpan.textContent = user.usedCredit || 0;

    alert(
      `${type.toUpperCase()} order placed! Amount to pay: ₹ ${toPay}${
        discount ? ` (₹${discount} from reward points)` : ""
      }`
    );
  }

  prepaidBtn.addEventListener("click", () => placeOrder("prepaid"));
  khataBtn.addEventListener("click", () => placeOrder("khata"));

  function renderOrders() {
    const allOrders = getAllOrders();
    const my = allOrders.filter(o => o.userId === user.id);
    orderHistoryDiv.innerHTML = "";

    if (!my.length) {
      orderHistoryDiv.innerHTML =
        "<p class='tiny muted'>No orders yet. Your history will appear here.</p>";
      return;
    }

    my
      .slice()
      .reverse()
      .forEach(o => {
        const div = document.createElement("div");
        div.className = "order-card";
        const badgeClass =
          o.type === "prepaid" ? "badge-prepaid" : "badge-khata";
        const typeLabel = o.type === "prepaid" ? "Prepaid" : "Khata";
        div.innerHTML = `
          <div class="order-header-line">
            <span>#${o.id.slice(-5)}</span>
            <span class="badge-type ${badgeClass}">${typeLabel}</span>
          </div>
          <div class="tiny muted">${o.date}</div>
          <div class="tiny">
            Subtotal: ₹ ${o.subtotal} • Discount: ₹ ${o.discount} • Paid: ₹ ${
          o.toPay
        }
          </div>
          <div class="tiny muted">Payment: ${o.paymentMethod}</div>
        `;
        orderHistoryDiv.appendChild(div);
      });
  }

  renderCategoryTabs();
  renderProducts();
  renderCart();
  renderOrders();
}

// ================= SHOPKEEPER PAGE =================
function initShopkeeperPage() {
  let user = getCurrentUser();
  if (!user || user.role !== "shopkeeper") {
    window.location.href = "index.html";
    return;
  }
  setupLogout();

  const nameSpan = document.getElementById("shopName");
  const storeStatusLabel = document.getElementById("storeStatusLabel");
  const storeStatusSelect = document.getElementById("storeStatusSelect");
  const productNameInput = document.getElementById("productName");
  const productPriceInput = document.getElementById("productPrice");
  const productImageInput = document.getElementById("productImage");
  const productCategorySelect = document.getElementById("productCategory");
  const addBtn = document.getElementById("addProductBtn");
  const productMsg = document.getElementById("productMsg");
  const productListDiv = document.getElementById("shopProductList");
  const receivedOrdersDiv = document.getElementById("receivedOrders");

  nameSpan.textContent = user.name;

  function updateStatusLabel() {
    const status = user.storeStatus || "open";
    storeStatusLabel.textContent =
      status.charAt(0).toUpperCase() + status.slice(1);
    storeStatusLabel.className =
      "status-dot " +
      (status === "busy"
        ? "status-busy"
        : status === "closed"
        ? "status-closed"
        : "status-open");
  }

  storeStatusSelect.value = user.storeStatus || "open";
  updateStatusLabel();

  storeStatusSelect.addEventListener("change", () => {
    user.storeStatus = storeStatusSelect.value;
    updateUser(user);
    user = getCurrentUser() || user;
    updateStatusLabel();
  });

  function renderShopProducts() {
    const all = getAllProducts();
    const mine = all.filter(p => p.addedById === user.id);
    productListDiv.innerHTML = "";

    if (!mine.length) {
      productListDiv.innerHTML =
        "<p class='tiny muted'>No products added yet.</p>";
      return;
    }

    mine.forEach(p => {
      const div = document.createElement("div");
      div.className = "shop-item";

      const imgUrl =
        p.imageUrl && p.imageUrl.trim() !== ""
          ? p.imageUrl
          : "https://images.pexels.com/photos/4199091/pexels-photo-4199091.jpeg?auto=compress&cs=tinysrgb&w=600";

      div.innerHTML = `
        <img src="${imgUrl}" alt="${p.name}">
        <div class="shop-item-main">
          <h4>${p.name}</h4>
          <p>₹ ${p.price} • ${p.category || "Uncategorized"}</p>
        </div>
      `;
      productListDiv.appendChild(div);
    });
  }

  function renderReceivedOrders() {
    const allOrders = getAllOrders();
    const allProducts = getAllProducts();
    const mineProducts = allProducts.filter(p => p.addedById === user.id);
    const mineProductIds = mineProducts.map(p => p.id);

    const received = allOrders.filter(order =>
      order.items.some(it => mineProductIds.includes(it.productId))
    );

    receivedOrdersDiv.innerHTML = "";

    if (!received.length) {
      receivedOrdersDiv.innerHTML =
        "<p class='tiny muted'>No orders received yet.</p>";
      return;
    }

    received
      .slice()
      .reverse()
      .forEach(o => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.innerHTML = `
          <div><strong>#${o.id.slice(-5)}</strong> • ${o.type.toUpperCase()}</div>
          <div class="tiny muted">${o.date}</div>
          <div class="tiny">Items: ${o.items.length} • Amount: ₹${o.toPay}</div>
        `;
        receivedOrdersDiv.appendChild(card);
      });
  }

  addBtn.addEventListener("click", () => {
    productMsg.textContent = "";
    const name = productNameInput.value.trim();
    const priceVal = Number(productPriceInput.value);
    const imageUrl = productImageInput.value.trim();
    const category = productCategorySelect.value;

    if (!name || !priceVal || priceVal <= 0 || !category) {
      productMsg.style.color = "var(--danger)";
      productMsg.textContent = "Enter name, price, and choose a category.";
      return;
    }

    addProduct(name, priceVal, imageUrl, category, user.id, user.name);
    productMsg.style.color = "green";
    productMsg.textContent = "Product added!";
    productNameInput.value = "";
    productPriceInput.value = "";
    productImageInput.value = "";
    productCategorySelect.value = "";

    renderShopProducts();
  });

  renderShopProducts();
  renderReceivedOrders();
}
