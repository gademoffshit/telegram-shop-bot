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

// Обработчик клика по категории
function handleCategoryClick(category) {
    currentCategory = category;
    showHome();
    filterAndDisplayProducts();
    showNotification(`Обрано категорію: ${category}`);
}

// Функция для фильтрации и отображения продуктов
function filterAndDisplayProducts() {
    let filteredProducts = products;
    
    // Фильтрация по категории
    if (currentCategory) {
        filteredProducts = products.filter(product => product.category === currentCategory);
    }
    
    // Фильтрация по поисковому запросу
    const searchQuery = document.querySelector('.search-input')?.value.toLowerCase();
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery)
        );
    }
    
    displayProducts(filteredProducts);
    
    // Обновляем счетчик найденных товаров
    const productsCount = document.querySelector('.products-count');
    if (productsCount) {
        productsCount.textContent = `Знайдено товарів: ${filteredProducts.length}`;
    }
}

// Обработчик для кнопки "Показати"
function handleShowProducts() {
    showHome();
    filterAndDisplayProducts();
}

// Фильтрация и отображение товаров
function filterAndDisplayProducts() {
    let filteredProducts = [...products];

    // Фильтрация по категории
    if (currentCategory && currentCategory !== 'Все') {
        filteredProducts = filteredProducts.filter(product => 
            product.category && product.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    // Фильтрация по поиску
    if (currentFilter) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(currentFilter.toLowerCase())
        );
    }

    // Сортировка
    if (currentSort) {
        filteredProducts.sort((a, b) => {
            switch(currentSort) {
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                case 'popular':
                    return (b.popularity || 0) - (a.popularity || 0);
                default:
                    return 0;
            }
        });
    }

    displayProducts(filteredProducts);
}

// Отображение товаров
function displayProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        const noProductsElement = document.createElement('div');
        noProductsElement.className = 'no-products';
        noProductsElement.textContent = 'Ничего не найдено';
        productsGrid.appendChild(noProductsElement);
    } else {
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
                showProductDetails(product);
            });
            
            productsGrid.appendChild(productElement);
        });
    }
}

// Показ корзины
function showCart() {
    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }

    hideAllContainers();
    
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

// Функция для показа уведомлений
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Функция для отображения деталей продукта
function showProductDetails(product) {
    hideAllContainers();
    
    let detailsContainer = document.querySelector('.product-details');
    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.className = 'product-details';
    }
    
    detailsContainer.innerHTML = `
        <div class="details-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h2>Детали</h2>
        </div>
        
        <div class="details-content">
            <img src="${product.image}" alt="${product.name}" class="product-image-large">
            
            <div class="product-price-large">${product.price} zł</div>
            <h1 class="product-name-large">${product.name}</h1>
            
            ${product.available === false ? '<div class="availability-badge">Немає у наявності</div>' : ''}
            
            <div class="details-section">
                <h3>Характеристики</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Об'єм:</div>
                        <div class="detail-value">${product.volume || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Міцність:</div>
                        <div class="detail-value">${product.strength || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Виробник:</div>
                        <div class="detail-value">${product.manufacturer || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h3>Опис</h3>
                <p class="product-description">${product.description || 'Опис недоступний'}</p>
            </div>
        </div>
    `;

    // Добавляем кнопку корзины всегда, кроме случая когда товар явно недоступен
    const cartButton = document.createElement('button');
    cartButton.className = 'add-to-cart-button';
    cartButton.textContent = 'ДОДАТИ В КОРЗИНУ';
    cartButton.addEventListener('click', () => {
        addToCart(product);
        showNotification('Товар додано в корзину');
    });
    detailsContainer.appendChild(cartButton);
    
    // Обработчик для кнопки "Назад"
    const backButton = detailsContainer.querySelector('.back-button');
    backButton.addEventListener('click', () => {
        showHome();
    });
    
    document.body.appendChild(detailsContainer);
    detailsContainer.style.display = 'block';
}

// Обработчик для категорий в каталоге
function handleCategoryClick(category) {
    currentCategory = category;
    hideAllContainers();
    document.querySelector('.app').style.display = 'block';
    filterAndDisplayProducts();
}

// Обновляем функцию showCatalog
function showCatalog() {
    hideAllContainers();
    
    let catalogContainer = document.querySelector('.catalog-container');
    if (!catalogContainer) {
        catalogContainer = document.createElement('div');
        catalogContainer.className = 'catalog-container';
        catalogContainer.innerHTML = `
            <div class="catalog-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h2>Фільтр</h2>
                <button class="clear-button">Очистити</button>
            </div>
            <div class="filter-count">: 0</div>
            <div class="catalog-section">
                <h3>Вибір категорії</h3>
                <div class="category-list">
                    <div class="category-item" data-category="Поди">
                        <span>Поди</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Рідина">
                        <span>Рідина</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Одноразки">
                        <span>Одноразки</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Картриджи">
                        <span>Картриджи</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Box">
                        <span>Box</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Мерч">
                        <span>Мерч</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Уголь">
                        <span>Уголь</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Табак">
                        <span>Табак</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                </div>
            </div>
            <div class="catalog-section">
                <h3>Вартість</h3>
                <div class="price-range">
                    <input type="range" min="0" max="280" value="0" class="price-slider">
                    <div class="price-inputs">
                        <input type="number" value="0" min="0" max="280" class="price-input">
                        <input type="number" value="280" min="0" max="280" class="price-input">
                    </div>
                </div>
            </div>
            <button class="show-products-button">
                Показати
                <span class="products-count">Знайдено товарів: 130</span>
            </button>
        `;
        
        // Добавляем обработчики для категорий
        catalogContainer.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                handleCategoryClick(item.dataset.category);
            });
        });

        // Обработчик для кнопки "Назад"
        const backButton = catalogContainer.querySelector('.back-button');
        backButton.addEventListener('click', () => {
            showHome();
        });

        // Обработчик для кнопки "Очистить"
        const clearButton = catalogContainer.querySelector('.clear-button');
        clearButton.addEventListener('click', () => {
            currentCategory = null;
            showNotification('Фільтри очищені');
            showHome();
        });

        // Обработчик для кнопки "Показати"
        const showButton = catalogContainer.querySelector('.show-products-button');
        showButton.addEventListener('click', handleShowProducts);
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

// Функция для скрытия всех контейнеров
function hideAllContainers() {
    document.querySelector('.app').style.display = 'none';
    document.querySelector('.cart-container')?.remove();
    document.querySelector('.catalog-container')?.remove();
    document.querySelector('.account-container')?.remove();
    document.querySelector('.product-details-container')?.remove();
}

// Функции для страниц
function showHome() {
    hideAllContainers();
    document.querySelector('.app').style.display = 'block';
    currentCategory = 'Люди';
    filterAndDisplayProducts();
}

function showAccount() {
    hideAllContainers();
    
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
    showNotification('История заказов пока недоступна');
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
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
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
                if (cart.length === 0) {
                    showNotification('Корзина пуста');
                } else {
                    showCart();
                }
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

// Добавляем стили для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        background: var(--tg-theme-bg-color);
        color: var(--tg-theme-text-color);
        padding: 12px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transition: transform 0.3s ease-out;
        text-align: center;
    }

    .notification.show {
        transform: translateX(-50%) translateY(0);
    }
`;
document.head.appendChild(notificationStyles);

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

// Добавляем стили для деталей продукта
const productDetailsStyles = document.createElement('style');
productDetailsStyles.textContent = `
    .product-details {
        padding: 16px;
        padding-bottom: 80px;
    }

    .details-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .details-content {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .product-price-large {
        color: #4CAF50;
        font-size: 24px;
        margin-bottom: 8px;
    }

    .product-name-large {
        margin-bottom: 16px;
    }

    .availability-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 14px;
        margin-bottom: 16px;
        display: inline-block;
        background: #F44336;
        color: white;
    }

    .details-section {
        margin-bottom: 24px;
    }

    .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .detail-label {
        color: var(--tg-theme-hint-color);
        font-size: 14px;
        margin-bottom: 4px;
    }

    .detail-value {
        color: var(--tg-theme-text-color);
        font-size: 16px;
    }

    .product-description {
        margin-top: 16px;
    }

    .add-to-cart-button {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background: #4CAF50;
        color: white;
        font-size: 16px;
        cursor: pointer;
        margin-top: 16px;
    }
`;
document.head.appendChild(productDetailsStyles);

// Обновляем стили для личного кабинета
const accountStyles = document.createElement('style');
accountStyles.textContent = `
    .account-container {
        padding: 20px 16px 80px;
    }

    .account-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 32px;
        padding: 20px;
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .account-avatar i {
        font-size: 48px;
        color: var(--tg-theme-button-text-color);
    }

    .account-header h2 {
        color: var(--tg-theme-text-color);
        font-size: 24px;
        margin: 0;
    }

    .account-menu {
        background: var(--tg-theme-bg-color);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .account-menu-item {
        display: flex;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        border-bottom: 1px solid var(--tg-theme-hint-color);
    }

    .account-menu-item:last-child {
        border-bottom: none;
    }

    .account-menu-item:active {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .account-menu-item i:first-child {
        margin-right: 16px;
        color: var(--tg-theme-button-color);
        font-size: 24px;
    }

    .account-menu-item span {
        flex: 1;
        color: var(--tg-theme-text-color);
        font-size: 16px;
    }

    .account-menu-item i:last-child {
        color: var(--tg-theme-hint-color);
    }
`;
document.head.appendChild(accountStyles);

// Обновляем стили для каталога
const catalogStyles = document.createElement('style');
catalogStyles.textContent = `
    .catalog-container {
        padding: 16px;
        padding-bottom: 80px;
    }

    .catalog-header {
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
`;
document.head.appendChild(catalogStyles);

// Устанавливаем активную вкладку при загрузке
document.querySelector('.nav-item[data-page="home"]').classList.add('active');

// Добавляем стили для отображения пустого результата
const noProductsStyle = document.createElement('style');
noProductsStyle.textContent = `
    .no-products {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--tg-theme-hint-color);
        font-size: 16px;
        text-align: center;
    }

    .products-grid {
        position: relative;
        min-height: calc(100vh - 200px);
    }
`;
document.head.appendChild(noProductsStyle);
