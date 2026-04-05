  // ============================================
// BUENAS IDEAS STUDIO - JAVASCRIPT
// Carrito + filtros (Tienda y Catálogo) + formulario de cotización + UX
// ============================================

(() => {
  'use strict';

  // =====================
  // CONFIG
  // =====================
  const WHATSAPP_NUMBER = '526651102363';
  const CART_STORAGE_KEY = 'buenasIdeasCart';

  // Estado del carrito
  let cart = [];

  // =====================
  // BOOTSTRAP
  // =====================
  document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    initializeCart();
    initializeFilters();
    initializeCatalogo();
    initializeQuoteForm();
    initializeAOS();
    initializeSmoothScroll();
    initializeQuickView();

    // Exponer funciones globales requeridas por onclick inline (carrito)
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.checkoutViaWhatsApp = checkoutViaWhatsApp;

    // Mensaje de consola
    console.log('%c¡Bienvenido a Buenas Ideas Studio!', 'color: #FF8C00; font-size: 20px; font-weight: bold;');
    console.log('%cSitio web desarrollado con cuidado para crear marcas que inspiran', 'color: #666; font-size: 12px;');
  });

  // =====================
  // HELPERS
  // =====================
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function safeJSONParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  }

  // =====================
  // NAVBAR
  // =====================
  function initializeNavbar() {
    const navbar = qs('#navbar');
    const hamburger = qs('#hamburger');
    const navMenu = qs('#navMenu');
    const navLinks = qsa('.nav-link');

    if (!navbar || !navMenu) return;

    // Sticky navbar
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 100);
    });

    // Toggle menú móvil
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
      });
    }

    // Cerrar menú móvil al hacer click en un link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger?.classList.remove('active');
      });
    });

    // Cerrar menú si se hace click fuera
    document.addEventListener('click', (event) => {
      if (!navMenu.classList.contains('active')) return;

      const clickInsideMenu = navMenu.contains(event.target);
      const clickOnHamburger = hamburger ? hamburger.contains(event.target) : false;

      if (!clickInsideMenu && !clickOnHamburger) {
        navMenu.classList.remove('active');
        hamburger?.classList.remove('active');
      }
    });
  }

  // =====================
  // CARRITO
  // =====================
  function initializeCart() {
    const cartIcon = qs('#cartIcon');
    const cartSidebar = qs('#cartSidebar');
    const closeCart = qs('#closeCart');
    const btnCheckout = qs('#btnCheckout');

    // Cargar carrito
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      cart = safeJSONParse(savedCart, []);
      if (!Array.isArray(cart)) cart = [];
      updateCartUI();
    }

    if (!cartSidebar) return;

    // Abrir/cerrar sidebar
    cartIcon?.addEventListener('click', () => cartSidebar.classList.add('active'));
    closeCart?.addEventListener('click', () => cartSidebar.classList.remove('active'));

    // Cerrar al hacer click fuera
    document.addEventListener('click', (event) => {
      if (!cartSidebar.classList.contains('active')) return;

      const clickInsideCart = cartSidebar.contains(event.target);
      const clickOnCartIcon = cartIcon ? cartIcon.contains(event.target) : false;

      if (!clickInsideCart && !clickOnCartIcon) {
        cartSidebar.classList.remove('active');
      }
    });

    // Botones agregar al carrito
    qsa('.btn-add-cart:not(.btn-cotizar)').forEach(button => {
      button.addEventListener('click', () => {
        const productName = button.getAttribute('data-product-name') || 'Producto';
        const productPrice = parseFloat(button.getAttribute('data-product-price') || '0');
        const productImage = button.getAttribute('data-product-image') || '';
        addToCart(productName, productPrice, productImage);
      });
    });

    // Checkout
    btnCheckout?.addEventListener('click', (e) => {
      e.preventDefault();
      checkoutViaWhatsApp();
    });
  }

  function addToCart(name, price, image) {
    const existing = cart.find(item => item.name === name);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: Date.now(),
        name,
        price: Number.isFinite(price) ? price : 0,
        image,
        quantity: 1,
      });
    }

    saveCart();
    updateCartUI();
    showNotification(`${name} agregado al carrito`);
  }

  function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
  }

  function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    saveCart();
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  function updateCartUI() {
    const cartCount = qs('#cartCount');
    const cartItems = qs('#cartItems');
    const cartTotal = qs('#cartTotal');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = String(totalItems);

    if (cartItems) {
      if (cart.length === 0) {
        cartItems.innerHTML = `
          <div class="cart-empty">
            <i class="fas fa-shopping-cart"></i>
            <p>Tu carrito está vacío</p>
          </div>
        `;
      } else {
        cartItems.innerHTML = cart.map(item => `
          <div class="cart-item">
            <div class="cart-item-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">$${item.price} MXN</div>
              <div class="cart-item-controls">
                <div class="cart-item-qty">
                  <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)" aria-label="Disminuir">
                    <i class="fas fa-minus"></i>
                  </button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)" aria-label="Aumentar">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})" title="Eliminar" aria-label="Eliminar">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)} MXN`;
  }

  function checkoutViaWhatsApp() {
    if (cart.length === 0) {
      showNotification('Tu carrito está vacío');
      return;
    }

    const lines = cart.map(item => `• ${item.name} x${item.quantity} - $${item.price * item.quantity} MXN`);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const message = [
      '¡Hola! Quiero hacer un pedido:',
      '',
      ...lines,
      '',
      `Total: $${total.toFixed(2)} MXN`,
      '',
      'Por favor, confírmame disponibilidad y tiempo de entrega.'
    ].join('\n');

    openWhatsApp(message);
  }

  // =====================
  // NOTIFICACIONES
  // =====================
  function ensureNotificationStyles() {
    if (qs('#notificationKeyframes')) return;
    const style = document.createElement('style');
    style.id = 'notificationKeyframes';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function showNotification(message) {
    ensureNotificationStyles();

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #25D366;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-weight: 600;
      max-width: min(420px, calc(100vw - 40px));
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // =====================
  // FILTROS (TIENDA)
  // =====================
  function initializeFilters() {
    const filterButtons = qsa('.filter-btn');
    const productCards = qsa('.product-card');
    const emptyState = qs('#emptyState');

    if (!filterButtons.length || !productCards.length) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');

        const category = button.getAttribute('data-category');
        let visibleCount = 0;

        productCards.forEach(card => {
          const cardCategories = card.getAttribute('data-categories') || '';
          const visible = category === 'all' || cardCategories.includes(category);
          card.style.display = visible ? 'block' : 'none';
          if (visible) visibleCount++;
        });

        if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      });
    });
  }

  // =====================
  // FILTROS (CATÁLOGO)
  // =====================
  function initializeCatalogo() {
    const buttons = qsa('.cat-filtro-btn');
    const cards = qsa('.catalogo-card');

    if (!buttons.length || !cards.length) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtro = btn.dataset.filtro || 'todos';

        cards.forEach(card => {
          const categoria = card.dataset.categoria || '';
          const show = filtro === 'todos' || categoria === filtro;
          card.classList.toggle('cat-oculto', !show);
        });
      });
    });
  }

  // =====================
  // FORMULARIO DE COTIZACIÓN
  // =====================
  function initializeQuoteForm() {
    const quoteForm = qs('#quoteForm');
    if (!quoteForm) return;

    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = qs('#quoteName')?.value?.trim() || '';
      const email = qs('#quoteEmail')?.value?.trim() || '';
      const phone = qs('#quotePhone')?.value?.trim() || '';
      const service = qs('#quoteService')?.value || '';
      const quantity = qs('#quoteQuantity')?.value || '';
      const message = qs('#quoteMessage')?.value?.trim() || '';

      const lines = [
        '¡Hola! Solicito cotización:',
        '',
        `Nombre: ${name}`,
        `Email: ${email}`,
        `Teléfono: ${phone}`,
        `Servicio: ${getServiceName(service)}`,
      ];

      if (quantity) lines.push(`Cantidad: ${quantity} piezas`);

      lines.push('', 'Detalles del proyecto:', message);

      openWhatsApp(lines.join('\n'));

      quoteForm.reset();
      showNotification('Redirigiendo a WhatsApp...');
    });
  }

  function getServiceName(serviceValue) {
    const serviceNames = {
      playeras: 'Playeras Personalizadas',
      sudaderas: 'Sudaderas Personalizadas',
      impresion: 'Impresión Textil por Volumen',
      otro: 'Otro servicio',
    };
    return serviceNames[serviceValue] || serviceValue || 'No especificado';
  }

  // =====================
  // AOS
  // =====================
  function initializeAOS() {
    if (typeof AOS === 'undefined') return;
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
    });
  }

  // =====================
  // SMOOTH SCROLL
  // =====================
  function initializeSmoothScroll() {
    qsa('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') {
          e.preventDefault();
          return;
        }

        const target = qs(href);
        if (!target) return;

        e.preventDefault();
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      });
    });
  }

  // =====================
  // QUICK VIEW (alert)
  // =====================
  function initializeQuickView() {
    const buttons = qsa('.btn-quick-view');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const productType = btn.getAttribute('data-product');
        showQuickView(productType);
      });
    });
  }

  function showQuickView(productType) {
    const productInfo = {
      playeras: {
        name: 'Playeras Personalizadas',
        description: 'Playeras de calidad serigráfica, pedido mínimo 12 piezas',
        details: [
          '100% algodón de alta calidad',
          'Serigrafía duradera y resistente',
          'Variedad de colores disponibles',
          'Pedido mínimo: 12 piezas',
          'Tiempo de entrega: 7-10 días',
        ],
        price: 'Desde $150 MXN',
      },
      sudaderas: {
        name: 'Sudaderas Personalizadas',
        description: 'Sudaderas premium para tu marca o equipo',
        details: [
          'Tela de alta calidad con forro interior',
          'Diseños duraderos y profesionales',
          'Perfectas para clima frío',
          'Pedido mínimo: 12 piezas',
          'Tiempo de entrega: 10-14 días',
        ],
        price: 'Desde $350 MXN',
      },
      impresion: {
        name: 'Impresión Textil',
        description: 'Servicio de impresión textil por volumen',
        details: [
          'Impresión profesional en alta calidad',
          'Ideal para pedidos grandes',
          'Múltiples técnicas disponibles',
          'Asesoría personalizada incluida',
          'Cotización según volumen y diseño',
        ],
        price: 'Solicita cotización',
      },
    };

    const product = productInfo[productType];
    if (!product) return;

    alert(
      `${product.name}\n\n${product.description}\n\n${product.details.join('\n')}\n\n${product.price}\n\n¡Contáctanos para más información!`
    );
  }
})();
