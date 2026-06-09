// ============================================
// CART - Manage Cart Items and Checkout
// ============================================

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Mock Product catalog mapping to match your index.html markup rules
const MOCK_PRODUCTS = [
    { id: "PROD001", name: "Premium Wireless Headphones", price: 99.99, category: "Electronics", emoji: "🎧" },
    { id: "PROD002", name: "Minimalist Leather Watch", price: 149.50, category: "Accessories", emoji: "⌚" },
    { id: "PROD003", name: "Ergonomic Mechanical Keyboard", price: 89.00, category: "Computing", emoji: "⌨️" }
];

// ---------- RENDER HOME PAGE STORE PRODUCTS ----------
function renderStorefront() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return; // Exit cleanly if not on home page

    grid.innerHTML = MOCK_PRODUCTS.map(product => `
        <div class="product-card">
            <div class="product-img">${product.emoji}</div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${product.emoji}')">
                    Add to Cart 🛒
                </button>
            </div>
        </div>
    `).join('');
}

// ---------- GET CART TOTALS ----------
function getCartTotals() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const productNames = cart.map(item => item.name).join(', ');
    
    return { totalItems, totalPrice, productNames };
}

// ---------- ADD TO CART ----------
function addToCart(productId, name, price, image) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: parseFloat(price),
            image: image,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`Added ${name} to cart!`);
    
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }

    // --- MOENGAGE TRACKING FIX ---
    const totals = getCartTotals();
    Moengage.track_event("Product Added to Cart", {
        "product_id": productId,
        "product_name": name,
        "price": parseFloat(price),
        "cart_total": totals.totalPrice,
        "cart_url": window.location.origin + "/cart.html",
        "items_count": totals.totalItems,
        "all_product_names": totals.productNames
    });
}

// ---------- REMOVE FROM CART ----------
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        
        if (removedItem.quantity > 1) {
            removedItem.quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        if (window.location.pathname.includes('cart.html')) {
            renderCart();
        }

        const totals = getCartTotals();
        Moengage.track_event("Product Removed from Cart", {
            "product_id": productId,
            "product_name": removedItem.name,
            "cart_total": totals.totalPrice,
            "items_count": totals.totalItems
        });
    }
}

// ---------- UPDATE NAV COUNT ----------
function updateCartCount() {
    // Synchronize both IDs present in your different HTML files
    const badge = document.getElementById('cartCount') || document.getElementById('cartCountBadge');
    if (badge) {
        const totals = getCartTotals();
        badge.textContent = totals.totalItems;
    }
}

// ---------- RENDER CART PAGE UI ----------
function renderCart() {
    const cartContainer = document.getElementById('cartContent');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <span class="big-emoji">🛒</span>
                <p>Your cart is currently empty.</p>
                <a href="index.html" class="continue-btn" style="text-decoration:underline;">Go Back Shopping</a>
            </div>
        `;
        return;
    }

    const totals = getCartTotals();
    let cartHtml = '<div class="cart-layout"><div class="cart-items-list">';
    
    cart.forEach(item => {
        cartHtml += `
            <div class="cart-item">
                <div class="cart-item-emoji">${item.image}</div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="removeFromCart('${item.id}')">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="addToCart('${item.id}', '${item.name}', ${item.price}, '${item.image}')">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    cartHtml += `</div>
        <div class="cart-summary">
            <h3>Order Summary</h3>
            <div class="summary-row"><span>Items Count:</span><span>${totals.totalItems}</span></div>
            <div class="summary-row total"><span>Total:</span><span>$${totals.totalPrice.toFixed(2)}</span></div>
            <button class="checkout-btn" id="checkoutBtn" onclick="handleCheckout()">Place Order →</button>
        </div>
    </div>`;

    cartContainer.innerHTML = cartHtml;
}

// ---------- CHECKOUT / PLACE ORDER ----------
function handleCheckout() {
    if (cart.length === 0) return;

    const totals = getCartTotals();
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // --- MOENGAGE TRACKING: CART ABANDONMENT EXIT CONDITION ---
    Moengage.track_event("Order Placed", {
        "order_total": totals.totalPrice,
        "items_count": totals.totalItems,
        "product_list": totals.productNames,
        "timestamp": new Date().toISOString()
    });

    if (loggedInUser) {
        // Flag properties dynamically to stop First Order Discount streams
        Moengage.add_user_attribute("is_first_buyer", false);
        Moengage.add_user_attribute("last_purchase_date", new Date().toISOString());
        
        // Simulating incremental count updates locally
        let orderCount = parseInt(localStorage.getItem('order_count_' + loggedInUser.email) || "0") + 1;
        localStorage.setItem('order_count_' + loggedInUser.email, orderCount);
        Moengage.add_user_attribute("total_orders_placed", orderCount);
    }

    showToast("🎉 Order placed successfully!");
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ---------- TOAST SYSTEM IMPLEMENTATION ----------
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }
}

// ---------- DOM EVENT LISTENERS ----------
document.addEventListener("DOMContentLoaded", () => {
    renderStorefront();
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
});