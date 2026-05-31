const allProductsEl = document.querySelector("[data-all-products]");
const WHATSAPP_NUMBER = "+917755832501";
const BRAND_CODE = "LUME";
const CART_KEY = "lume_candle_cart";

const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartBackdrop = document.querySelector("[data-cart-close].cart-backdrop");
const cartItemsEl = document.querySelector("[data-cart-items]");
const cartCountEl = document.querySelector("[data-cart-count]");
const cartTotalEl = document.querySelector("[data-cart-total]");
const cartCustomerForm = document.querySelector("[data-cart-customer]");
const cartErrorEl = document.querySelector("[data-cart-error]");

let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
  return value > 0 ? "Rs. " + value.toLocaleString("en-IN") : "Custom Quote";
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value || "");
  return div.innerHTML;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function renderAddButton(item) {
  return `
    <button
      class="quick"
      type="button"
      data-add-cart
      data-code="${escapeAttr(item.code)}"
      data-model="${escapeAttr(item.model)}"
      data-price="${Number(item.price || 0)}"
    >
      Add to Cart
    </button>
  `;
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    const category = item.category || "Other";
    const subCategory = item.subCategory || "General";

    groups[category] = groups[category] || {};
    groups[category][subCategory] = groups[category][subCategory] || [];
    groups[category][subCategory].push(item);

    return groups;
  }, {});
}

function renderProductCard(item) {
  return `
    <article class="card catalog-card">
      <div class="image">
        <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.alt)}" />
      </div>
      <div class="card-body">
        <span class="tag">${escapeHtml(item.code)}</span>
        <h3>${escapeHtml(item.model)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="price-row">
          <span class="price">${escapeHtml(item.priceLabel || formatPrice(Number(item.price || 0)))}</span>
          ${renderAddButton(item)}
        </div>
      </div>
    </article>
  `;
}

function renderCatalog(items) {
  const groups = groupByCategory(items);

  allProductsEl.innerHTML = Object.entries(groups).map(([category, subGroups]) => `
    <section class="category-group">
      <div class="category-head">
        <h2>${escapeHtml(category)}</h2>
        <span>${Object.values(subGroups).flat().length} items</span>
      </div>
      ${Object.entries(subGroups).map(([subCategory, products]) => `
        <div class="subcategory-group">
          <h3>${escapeHtml(subCategory)}</h3>
          <div class="catalog-grid">
            ${products.map(renderProductCard).join("")}
          </div>
        </div>
      `).join("")}
    </section>
  `).join("");
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartBackdrop.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartBackdrop.classList.remove("is-open");
  document.body.style.overflow = "";
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = count;
  cartTotalEl.textContent = formatPrice(cartTotal());

  if (!cart.length) {
    cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    return;
  }

  cartItemsEl.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-top">
        <div>
          <strong>${escapeHtml(item.model)}</strong>
          <small>${BRAND_CODE} / ${escapeHtml(item.code)}</small>
        </div>
        <strong>${formatPrice(item.price * item.qty)}</strong>
      </div>
      <div class="qty-controls">
        <button type="button" data-cart-minus="${escapeAttr(item.code)}" aria-label="Decrease quantity">-</button>
        <strong>${item.qty}</strong>
        <button type="button" data-cart-plus="${escapeAttr(item.code)}" aria-label="Increase quantity">+</button>
        <button type="button" data-cart-remove="${escapeAttr(item.code)}" style="margin-left: auto; width: auto; padding: 0 12px; border-radius: 999px;">Remove</button>
      </div>
    </div>
  `).join("");
}

function addToCart(product) {
  const existing = cart.find((item) => item.code === product.code);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  renderCart();
  openCart();
}

function updateQty(code, change) {
  cart = cart.map((item) => {
    if (item.code !== code) return item;
    return { ...item, qty: Math.max(1, item.qty + change) };
  });
  saveCart();
  renderCart();
}

function removeItem(code) {
  cart = cart.filter((item) => item.code !== code);
  saveCart();
  renderCart();
}

function getCustomerDetails() {
  const formData = new FormData(cartCustomerForm);

  return {
    name: String(formData.get("customerName") || "").trim(),
    city: String(formData.get("deliveryCity") || "").trim(),
    note: String(formData.get("customizationNote") || "").trim()
  };
}

function buildWhatsAppMessage(customer) {
  const lines = [
    "Hi Lume Atelier, I want to order these candles:",
    "",
    ...cart.map((item, index) => (
      `${index + 1}. Brand: ${BRAND_CODE}\n` +
      `Code: ${item.code}\n` +
      `Model: ${item.model}\n` +
      `Qty: ${item.qty}\n` +
      `Price: ${formatPrice(item.price)}`
    )),
    "",
    `Estimated Total: ${formatPrice(cartTotal())}`,
    "",
    `My name: ${customer.name}`,
    `Delivery city: ${customer.city}`,
    `Customization note: ${customer.note || "No customization note"}`
  ];

  return lines.join("\n");
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-cart]");
  if (!button) return;

  addToCart({
    code: button.dataset.code,
    model: button.dataset.model,
    price: Number(button.dataset.price || 0)
  });
});

document.querySelectorAll("[data-cart-open]").forEach((button) => {
  button.addEventListener("click", openCart);
});

document.querySelectorAll("[data-cart-close]").forEach((button) => {
  button.addEventListener("click", closeCart);
});

document.querySelector("[data-cart-clear]").addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

document.querySelector("[data-cart-whatsapp]").addEventListener("click", () => {
  if (!cart.length) {
    openCart();
    return;
  }
  const customer = getCustomerDetails();

  if (!customer.name || !customer.city) {
    cartErrorEl.classList.add("is-visible");
    cartCustomerForm.reportValidity();
    return;
  }

  cartErrorEl.classList.remove("is-visible");
  const message = encodeURIComponent(buildWhatsAppMessage(customer));
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener");
});

cartItemsEl.addEventListener("click", (event) => {
  const plusCode = event.target.dataset.cartPlus;
  const minusCode = event.target.dataset.cartMinus;
  const removeCode = event.target.dataset.cartRemove;

  if (plusCode) updateQty(plusCode, 1);
  if (minusCode) updateQty(minusCode, -1);
  if (removeCode) removeItem(removeCode);
});

async function loadAllProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("Could not load products.json");

    const data = await response.json();
    const items = data.products || [];

    renderCatalog(items);
  } catch (error) {
    allProductsEl.innerHTML = '<div class="cart-empty">Products could not be loaded.</div>';
    console.error(error);
  }
}

loadAllProducts();
renderCart();
