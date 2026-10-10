const products = [
  {
    id: 1,
    name: "Vanilletraum",
    description: "Ein sanfter Duft nach süßer Vanille.",
    price: 12.90,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "Waldzauber",
    description: "Ein frischer Duft für gemütliche Abende.",
    price: 14.90,
    image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    name: "Rosengarten",
    description: "Ein blumiger Duft für dein Zuhause.",
    price: 16.50,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    name: "Kaffeepause",
    description: "Ein warmer Duft für entspannte Stunden.",
    price: 13.50,
    image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5,
    name: "Goldener Abend",
    description: "Eine besondere Kerze zum Verschenken.",
    price: 18.90,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6,
    name: "Wohlfühlzeit",
    description: "Für eine warme und gemütliche Atmosphäre.",
    price: 11.90,
    image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=800&q=80"
  }
];

const cart = new Map();

const $ = id => document.getElementById(id);

const money = amount =>
  amount.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR"
  });

function renderProducts() {
  $("products").innerHTML = products.map(p => `
    <article class="product-card">
      <img class="product-image"
           src="${p.image}"
           alt="${p.name}"
           loading="lazy">

      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-description">${p.description}</p>

        <div class="product-bottom">
          <span class="price">${money(p.price)}</span>
          <button class="add-button" data-add="${p.id}">
            In den Warenkorb
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const item = cart.get(id);

  if (item) {
    item.quantity++;
  } else {
    cart.set(id, { product, quantity: 1 });
  }

  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.get(id);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart.delete(id);
  }

  renderCart();
}

function renderCart() {
  let count = 0;
  let total = 0;

  for (const item of cart.values()) {
    count += item.quantity;
    total += item.product.price * item.quantity;
  }

  $("cartCount").textContent = count;
  $("cartTotal").textContent = money(total);

  if (cart.size === 0) {
    $("cartItems").textContent = "Dein Warenkorb ist leer.";
    return;
  }

  $("cartItems").innerHTML = [...cart.entries()]
    .map(([id, item]) => `
      <div class="cart-item">
        <div>
          <strong>${item.product.name}</strong><br>
          ${money(item.product.price)} pro Stück
        </div>

        <div class="cart-item-controls">
          <button class="quantity-button"
                  data-minus="${id}">−</button>

          <span>${item.quantity}</span>

          <button class="quantity-button"
                  data-plus="${id}">+</button>

          <button class="remove-button"
                  data-remove="${id}">Entfernen</button>
        </div>
      </div>
    `).join("");
}

$("products").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

$("cartItems").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.plus) {
    changeQuantity(Number(button.dataset.plus), 1);
  } else if (button.dataset.minus) {
    changeQuantity(Number(button.dataset.minus), -1);
  } else if (button.dataset.remove) {
    cart.delete(Number(button.dataset.remove));
    renderCart();
  }
});

$("openCart").addEventListener("click", () => {
  $("cartModal").classList.add("open");
  $("cartModal").setAttribute("aria-hidden", "false");
});

function closeCart() {
  $("cartModal").classList.remove("open");
  $("cartModal").setAttribute("aria-hidden", "true");
}

$("closeCart").addEventListener("click", closeCart);

$("cartModal").addEventListener("click", event => {
  if (event.target === $("cartModal")) closeCart();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCart();
});

$("checkoutForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (cart.size === 0) {
    $("checkoutMessage").textContent =
      "Bitte lege zuerst eine Kerze in den Warenkorb.";
    return;
  }

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Bitte warten …";

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customer: {
          name: $("name").value,
          email: $("email").value,
          address: $("address").value,
          postcode: $("postcode").value,
          city: $("city").value
        },
        items: [...cart.values()].map(item => ({
          id: item.product.id,
          quantity: item.quantity
        }))
      })
    });

    const result = await response.json();

    if (!response.ok || !result.url) {
      throw new Error("Checkout konnte nicht gestartet werden.");
    }

    // Öffnet die vom Server erstellte Zahlungsseite.
    window.location.assign(result.url);

  } catch (error) {
    $("checkoutMessage").textContent =
      "Die Zahlung ist noch nicht eingerichtet. " +
      "Bitte versuche es später erneut.";

    button.disabled = false;
    button.textContent = "Zur Bestellung und Zahlung";
  }
});

$("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();