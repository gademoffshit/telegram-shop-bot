let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#8774e1';

// GitHub API конфигурация
const REPO_OWNER = 'gademoffshit';
const REPO_NAME = 'telegram-shop-bot';
const FILE_PATH = 'products.json';

// Загрузка товаров с GitHub
async function getProducts() {
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const file = await response.json();
        const content = JSON.parse(atob(file.content));
        return content.products;
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Получаем актуальный список товаров
let products = [];
async function loadProducts() {
    products = await getProducts();
    filterAndDisplayProducts();
}

// Обновляем товары каждые 10 секунд
setInterval(loadProducts, 10000);

// Инициализация
loadProducts();

// DOM элементы
const productsGrid = document.querySelector('.products-grid');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const cartCounter = document.querySelector('.cart-counter');
const homeButton = document.getElementById('homeButton');
const cartButton = document.getElementById('cartButton');
const filterBtn = document.querySelector('.filter-btn');

// Состояние приложения
let cart = [];
let currentCategory = 'Люди';
let currentFilter = '';
let currentSort = 'default';

// Обработчики кнопок
homeButton.addEventListener('click', () => {
    currentCategory = 'Люди';
    searchInput.value = '';
    currentFilter = '';
    sortSelect.value = 'default';
    currentSort = 'default';
    
    categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === 'Люди') {
            btn.classList.add('active');
        }
    });
    
    filterAndDisplayProducts();
});

cartButton.addEventListener('click', showCart);

// Обработчики категорий
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentCategory = button.textContent;
        filterAndDisplayProducts();
    });
});

// Поиск
searchInput.addEventListener('input', (e) => {
    currentFilter = e.target.value.toLowerCase();
    filterAndDisplayProducts();
});

// Сортировка
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndDisplayProducts();
});

// Фильтрация и отображение товаров
function filterAndDisplayProducts() {
    let filteredProducts = products.filter(product => {
        const matchesCategory = currentCategory === 'Все' || product.category === currentCategory;
        const matchesSearch = product.name.toLowerCase().includes(currentFilter);
        return matchesCategory && matchesSearch;
    });

    // Сортировка
    filteredProducts.sort((a, b) => {
        switch(currentSort) {
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'popular':
                return b.popularity - a.popularity;
            default:
                return 0;
        }
    });

    displayProducts(filteredProducts);
}

// Отображение товаров
function displayProducts(products) {
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">${product.price} zł</p>
            </div>
        `;
        
        productElement.addEventListener('click', () => {
            addToCart(product);
        });

        productsGrid.appendChild(productElement);
    });
}

// Показ корзины
function showCart() {
    if (cart.length === 0) {
        tg.showPopup({
            title: 'Корзина пуста',
            message: 'Добавьте товары в корзину',
            buttons: [{id: "ok", type: "cancel", text: "OK"}]
        });
        return;
    }

    // Удаляем существующий контейнер корзины, если он есть
    const existingCart = document.querySelector('.cart-container');
    if (existingCart) {
        existingCart.remove();
    }

    const mainApp = document.querySelector('.app');
    mainApp.style.display = 'none';

    const cartContainer = document.createElement('div');
    cartContainer.className = 'cart-container';

    cartContainer.innerHTML = `
        <div class="cart-header">
            <button class="back-button" id="cartBackButton">
                <i class="material-icons">arrow_back</i>
            </button>
            <div class="cart-title">CHASER | HOTSPOT</div>
        </div>
        
        <div class="cart-items">
            ${cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">Роздрібна ціна ${item.price}zł</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn minus" data-index="${index}">-</button>
                            <span class="quantity-value">${item.quantity || 1}</span>
                            <button class="quantity-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="cart-total">
            <div class="total-row">
                <span>Сумма</span>
                <span>${cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0).toFixed(2)} zł</span>
            </div>
            <button class="checkout-button">ОФОРМИТИ ЗАМОВЛЕННЯ</button>
        </div>
    `;

    document.body.appendChild(cartContainer);

    function closeCart() {
        const cart = document.querySelector('.cart-container');
        if (cart) {
            cart.remove();
        }
        mainApp.style.display = 'block';
    }

    // Обработчик кнопки "назад"
    const backButton = document.getElementById('cartBackButton');
    if (backButton) {
        backButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeCart();
        };
    }

    // Добавляем обработчик клавиши Escape
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeCart();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);

    // Обработчики кнопок количества
    const minusButtons = cartContainer.querySelectorAll('.minus');
    const plusButtons = cartContainer.querySelectorAll('.plus');

    minusButtons.forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            if (!cart[index].quantity || cart[index].quantity === 1) {
                cart.splice(index, 1);
                updateCartCounter();
                if (cart.length === 0) {
                    closeCart();
                } else {
                    showCart();
                }
            } else {
                cart[index].quantity--;
                showCart();
                updateCartCounter();
            }
        };
    });

    plusButtons.forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            cart[index].quantity = (cart[index].quantity || 1) + 1;
            showCart();
            updateCartCounter();
        };
    });

    const checkoutButton = cartContainer.querySelector('.checkout-button');
    checkoutButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkout();
    };
}

// Добавление в корзину
function addToCart(product) {
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity = (existingProduct.quantity || 1) + 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    updateCartCounter();
    showCart();
}

// Обновление счетчика корзины
function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCounter.textContent = totalItems;
    if (totalItems > 0) {
        cartCounter.style.display = 'flex';
    } else {
        cartCounter.style.display = 'none';
    }
}

// Оформление заказа
function checkout() {
    const orderData = {
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
    };
    tg.sendData(JSON.stringify(orderData));
    cart = [];
    updateCartCounter();
    const cartContainer = document.querySelector('.cart-container');
    if (cartContainer) {
        document.body.removeChild(cartContainer);
        document.querySelector('.app').style.display = 'block';
    }
}
