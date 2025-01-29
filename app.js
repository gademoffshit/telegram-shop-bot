let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#8774e1';

// Загрузка товаров с GitHub
async function getProducts() {
    try {
        // Добавляем timestamp для предотвращения кэширования
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/gademoffshit/telegram-shop-bot/main/products.json?t=${timestamp}`);
        const data = await response.json();
        return data.products;
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

// Обновляем товары каждые 30 секунд
setInterval(loadProducts, 30000);

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
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
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

// Создаем нижнюю навигацию
const bottomNav = document.createElement('div');
bottomNav.className = 'bottom-nav';
bottomNav.innerHTML = `
    <div class="nav-item" data-page="home">
        <i class="material-icons">home</i>
        <span>Главная</span>
    </div>
    <div class="nav-item" data-page="catalog">
        <i class="material-icons">category</i>
        <span>Каталог</span>
    </div>
    <div class="nav-item" data-page="cart">
        <i class="material-icons">shopping_cart</i>
        <span>Корзина</span>
        <div class="cart-badge">0</div>
    </div>
    <div class="nav-item" data-page="chat">
        <i class="material-icons">chat</i>
        <span>Чаты</span>
    </div>
    <div class="nav-item" data-page="account">
        <i class="material-icons">person</i>
        <span>Кабинет</span>
    </div>
`;
document.body.appendChild(bottomNav);

// Обработчики навигации
const navItems = bottomNav.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const page = item.dataset.page;
        switch(page) {
            case 'home':
                showHome();
                break;
            case 'catalog':
                showCatalog();
                break;
            case 'cart':
                showCart();
                break;
            case 'chat':
                tg.openTelegramLink('https://t.me/gadefp_bot');
                break;
            case 'account':
                showAccount();
                break;
        }
    });
});

// Функции для страниц
function showHome() {
    document.querySelector('.app').style.display = 'block';
    document.querySelector('.cart-container')?.remove();
    document.querySelector('.catalog-container')?.remove();
    currentCategory = 'Люди';
    filterAndDisplayProducts();
}

function showCatalog() {
    document.querySelector('.app').style.display = 'none';
    document.querySelector('.cart-container')?.remove();
    
    // Создаем контейнер каталога если его нет
    let catalogContainer = document.querySelector('.catalog-container');
    if (!catalogContainer) {
        catalogContainer = document.createElement('div');
        catalogContainer.className = 'catalog-container';
        catalogContainer.innerHTML = `
            <div class="catalog-header">
                <h2>Категории</h2>
            </div>
            <div class="catalog-grid">
                <div class="catalog-item" data-category="Люди">
                    <div class="catalog-item-icon">
                        <i class="material-icons">people</i>
                    </div>
                    <div class="catalog-item-title">Люди</div>
                </div>
                <div class="catalog-item" data-category="Рудина">
                    <div class="catalog-item-icon">
                        <i class="material-icons">person</i>
                    </div>
                    <div class="catalog-item-title">Рудина</div>
                </div>
                <div class="catalog-item" data-category="Одноразки">
                    <div class="catalog-item-icon">
                        <i class="material-icons">smoking_rooms</i>
                    </div>
                    <div class="catalog-item-title">Одноразки</div>
                </div>
                <div class="catalog-item" data-category="Картриджи">
                    <div class="catalog-item-icon">
                        <i class="material-icons">battery_charging_full</i>
                    </div>
                    <div class="catalog-item-title">Картриджи</div>
                </div>
            </div>
        `;
        
        // Добавляем обработчики для категорий
        catalogContainer.querySelectorAll('.catalog-item').forEach(item => {
            item.addEventListener('click', () => {
                currentCategory = item.dataset.category;
                showHome();
                filterAndDisplayProducts();
            });
        });
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

function showAccount() {
    document.querySelector('.app').style.display = 'none';
    document.querySelector('.cart-container')?.remove();
    document.querySelector('.catalog-container')?.remove();
    
    let accountContainer = document.querySelector('.account-container');
    if (!accountContainer) {
        accountContainer = document.createElement('div');
        accountContainer.className = 'account-container';
        accountContainer.innerHTML = `
            <div class="account-header">
                <div class="account-avatar">
                    <i class="material-icons">account_circle</i>
                </div>
                <h2>Личный кабинет</h2>
            </div>
            <div class="account-menu">
                <div class="account-menu-item" data-action="orders">
                    <i class="material-icons">shopping_bag</i>
                    <span>Мои заказы</span>
                    <i class="material-icons">chevron_right</i>
                </div>
                <div class="account-menu-item" data-action="support">
                    <i class="material-icons">support_agent</i>
                    <span>Поддержка</span>
                    <i class="material-icons">chevron_right</i>
                </div>
                <div class="account-menu-item" data-action="about">
                    <i class="material-icons">info</i>
                    <span>О нас</span>
                    <i class="material-icons">chevron_right</i>
                </div>
            </div>
        `;
        
        // Добавляем обработчики для пунктов меню
        accountContainer.querySelectorAll('.account-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                switch (item.dataset.action) {
                    case 'orders':
                        showOrders();
                        break;
                    case 'support':
                    case 'about':
                        tg.openTelegramLink('https://t.me/gadefp_bot');
                        break;
                }
            });
        });
        
        document.body.appendChild(accountContainer);
    }
    
    accountContainer.style.display = 'block';
}

function showOrders() {
    // Здесь будет реализация отображения истории заказов
    tg.showPopup({
        title: 'История заказов',
        message: 'История заказов пока недоступна',
        buttons: [{type: 'ok'}]
    });
}

// Добавляем стили
const style = document.createElement('style');
style.textContent = `
    .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--tg-theme-bg-color);
        display: flex;
        justify-content: space-around;
        padding: 10px 0;
        box-shadow: 0 -1px 0 0 var(--tg-theme-hint-color);
        z-index: 1000;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--tg-theme-hint-color);
        cursor: pointer;
        transition: all 0.3s;
        padding: 4px 8px;
        position: relative;
        min-width: 64px;
    }

    .nav-item.active {
        color: var(--tg-theme-button-color);
    }

    .nav-item i {
        font-size: 24px;
        margin-bottom: 4px;
    }

    .nav-item span {
        font-size: 12px;
        text-align: center;
    }

    .cart-badge {
        position: absolute;
        top: -2px;
        right: 8px;
        background: var(--tg-theme-button-color);
        color: var(--tg-theme-button-text-color);
        border-radius: 12px;
        padding: 2px 6px;
        font-size: 10px;
        display: none;
        min-width: 8px;
        height: 16px;
        text-align: center;
        line-height: 16px;
    }

    .products-grid {
        margin-bottom: 80px;
        padding-bottom: 20px;
    }

    .app {
        padding-bottom: 70px;
    }
`;
document.head.appendChild(style);

// Устанавливаем активную вкладку при загрузке
document.querySelector('.nav-item[data-page="home"]').classList.add('active');

// Добавляем стили для новых контейнеров
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .catalog-container, .account-container {
        padding: 16px;
        padding-bottom: 80px;
    }

    .catalog-header, .account-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .catalog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
    }

    .catalog-item {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .catalog-item:active {
        transform: scale(0.95);
    }

    .catalog-item-icon {
        background: var(--tg-theme-button-color);
        width: 48px;
        height: 48px;
        border-radius: 24px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .catalog-item-icon i {
        color: var(--tg-theme-button-text-color);
        font-size: 24px;
    }

    .catalog-item-title {
        color: var(--tg-theme-text-color);
        font-size: 14px;
    }

    .account-header {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .account-avatar {
        width: 80px;
        height: 80px;
        border-radius: 40px;
        background: var(--tg-theme-button-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
    }

    .account-avatar i {
        font-size: 48px;
        color: var(--tg-theme-button-text-color);
    }

    .account-menu {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
    }

    .account-menu-item {
        display: flex;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--tg-theme-hint-color);
    }

    .account-menu-item:last-child {
        border-bottom: none;
    }

    .account-menu-item i:first-child {
        margin-right: 16px;
        color: var(--tg-theme-button-color);
    }

    .account-menu-item span {
        flex: 1;
        color: var(--tg-theme-text-color);
    }

    .account-menu-item i:last-child {
        color: var(--tg-theme-hint-color);
    }
`;
document.head.appendChild(additionalStyles);
