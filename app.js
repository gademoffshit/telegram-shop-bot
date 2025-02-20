let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#8774e1';

// Загрузка товаров с GitHub
async function getProducts() {
    try {
        console.log('Начало загрузки товаров...');
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/gademoffshit/telegram-shop-bot/main/products.json?t=${timestamp}`);
        if (!response.ok) {
            throw new Error(`HTTP ошибка! статус: ${response.status}`);
        }
        const data = await response.json();
        console.log('Товары успешно загружены:', data.products);
        return data.products || [];
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        return [];
    }
}

// Получаем актуальный список товаров
let products = [];
async function loadProducts() {
    try {
        products = await getProducts();
        console.log('Товары загружены в loadProducts:', products);
        filterAndDisplayProducts();
    } catch (error) {
        console.error('Ошибка в loadProducts:', error);
    }
}

// Обновляем товары каждые 30 секунд
setInterval(loadProducts, 30000);

// Инициализация при загрузке страницы
window.addEventListener('load', async () => {
    console.log('Страница загружена, инициализация...');
    await loadProducts();
    updateCartCounter();
});

// DOM элементы
const productsGrid = document.querySelector('.products-grid');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const cartCounter = document.querySelector('.cart-counter');
const homeButton = document.getElementById('homeButton');
const cartButton = document.getElementById('cartButton');
const filterBtn = document.querySelector('.filter-btn');

// Состояние программы
let cart = [];
let currentCategory = 'Murder Mystery 2'; // Меняем начальную категорию
let currentFilter = '';
let currentSort = 'default';

// Обработчики кнопок
homeButton.addEventListener('click', () => {
    currentCategory = 'Murder Mystery 2'; // Меняем категорию по умолчанию
    searchInput.value = '';
    currentFilter = '';
    sortSelect.value = 'default';
    currentSort = 'default';
    
    categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === 'Murder Mystery 2') { // Меняем активную категорию
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
        
        // Получаем название категории из текста кнопки
        currentCategory = button.querySelector('span').textContent;
        console.log('Выбранная категория:', currentCategory);
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
    showNotification(`Выбрана категория: ${category}`);
}

// Функция для фильтрации и отображения товаров
function filterAndDisplayProducts() {
    let filteredProducts = [...products];
    console.log('Начальные товары:', products);
    console.log('Текущая категория:', currentCategory);

    // Фильтрация по категории
    if (currentCategory && currentCategory !== 'All') {
        filteredProducts = filteredProducts.filter(product => {
            console.log('Проверка товара:', product.name, 'Категория:', product.category);
            return product.category && product.category === currentCategory;
        });
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

    console.log('Отфильтрованные товары:', filteredProducts);
    displayProducts(filteredProducts);
}

// Обработчик для кнопки "Показать"
function handleShowProducts() {
    showHome();
    filterAndDisplayProducts();
}

// Отображение товаров
function displayProducts(products) {
    console.log('Отображение товаров:', products);
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) {
        console.error('Products grid not found');
        return;
    }
    
    productsGrid.innerHTML = '';
    
    if (!products || products.length === 0) {
        const noProductsElement = document.createElement('div');
        noProductsElement.className = 'no-products';
        noProductsElement.textContent = 'Ничего не найдено';
        productsGrid.appendChild(noProductsElement);
        return;
    }
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">${product.price} руб</p>
            </div>
        `;
        
        productElement.addEventListener('click', () => {
            showProductDetails(product);
        });
        
        productsGrid.appendChild(productElement);
    });
}

// Показ корзины
function showCart() {
    hideAllContainers();
    
    if (cart.length === 0) {
        const cartContainer = document.createElement('div');
        cartContainer.className = 'cart-container';
        cartContainer.innerHTML = `
            <div class="cart-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h1>VAPE ROOM | ELFBAR WROCLAW</h1>
            </div>
            <div class="cart-empty">
                <p>Ваша корзина пуста</p>
            </div>
        `;
        
        const backButton = cartContainer.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }
        
        document.body.appendChild(cartContainer);
        return;
    }
    
    const cartContainer = document.createElement('div');
    cartContainer.className = 'cart-container';
    
    let cartHTML = `
        <div class="cart-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>VAPE ROOM | ELFBAR WROCLAW</h1>
        </div>
        <div class="cart-items">
    `;
    
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        cartHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <p class="cart-item-price">Розничная цена ${item.price}руб</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartHTML += `
        </div>
        <div class="cart-total">
            <div class="total-row">
                <span>Итого ${total.toFixed(2)} руб</span>
            </div>
        </div>
        <button class="checkout-button" onclick="checkout()">
            Оформить заказ
        </button>
    `;
    
    cartContainer.innerHTML = cartHTML;
    
    // Добавляем обработчики для кнопок количества
    cartContainer.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id, 10);
            console.log('Product ID:', id);
            const isPlus = e.target.classList.contains('plus');
            const product = cart.find(item => item.id === id);
            console.log('Product found:', product);
            if (product) {
                if (isPlus) {
                    product.quantity += 1;
                } else {
                    product.quantity -= 1;
                    if (product.quantity <= 0) {
                        const index = cart.indexOf(product);
                        cart.splice(index, 1);
                    }
                }
                console.log('Updated quantity:', product.quantity);
                updateCartCounter();
                showCart(); // Обновляем отображение корзины
            }
        });
    });
    
    // Обработчик для кнопки "Назад"
    const backButton = cartContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showHome();
        });
    }
    
    document.body.appendChild(cartContainer);
}

// Добавление в корзину
function addToCart(product) {
    if (!product.in_stock) {
        alert('Извините, этот товар временно недоступен.');
        return;
    }
    
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    updateCartCounter();
    showNotification('Товар добавлен в корзину');
    showCart();
}

// Обновление лічильника корзины
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
    hideAllContainers();
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const checkoutContainer = document.createElement('div');
    checkoutContainer.className = 'checkout-container';
    
    checkoutContainer.innerHTML = `
        <div class="checkout-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Оформление заказа</h1>
        </div>
        
        <h1>Оформление заказа</h1>
        
        <div class="form-section">
            <div class="section-header">
                <div class="section-number">1</div>
                <h2>Контактная информация</h2>
            </div>
            
            <div class="form-group">
                <label for="name">Имя</label>
                <input type="text" id="name" placeholder="Введите имя">
                <span class="error-message" id="nameError"></span>
            </div>
            
            <div class="form-group">
                <label for="surname">Фамилия</label>
                <input type="text" id="surname" placeholder="Введите фамилию">
                <span class="error-message" id="surnameError"></span>
            </div>
            
            <div class="form-group">
                <label for="telegram">Ваш Telegram</label>
                <input type="text" id="telegram" placeholder="@username">
                <span class="helper-text">Чтобы менеджер мог с вами связаться</span>
                <span class="error-message" id="telegramError"></span>
            </div>
        </div>
        



            
            <div class="form-group">
                <label for="promo">Промокод</label>
                <input type="text" id="promo" placeholder="Введите промокод">
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-header">
                <div class="section-number">3</div>
                <h2>Итого</h2>
            </div>
            <p class="total-amount">${total.toFixed(2)} руб</p>
        </div>
        
        <button class="checkout-form-button" onclick="validateAndProceed()">
            Оформить заказ
        </button>
    `;
    
    // Обработчики кнопок
    const backButton = checkoutContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showCart();
        });
    }
    
    const homeButton = checkoutContainer.querySelector('.home-button');
    if (homeButton) {
        homeButton.addEventListener('click', (e) => {
            e.preventDefault();
            showHome();
        });
    }
    
    document.body.appendChild(checkoutContainer);
}

let savedUserDetails = {};

function validateAndProceed() {
    const inputs = document.querySelectorAll('.checkout-container input');
    let isValid = true;

    inputs.forEach(input => {
        let valid = true;
        if (input.id === 'name' || input.id === 'surname') {
            valid = /^[А-Яа-яA-Za-z]+$/.test(input.value);
        } else if (input.id === 'telegram') {
            valid = input.value.trim() !== '';
        }

        if (!valid) {
            input.classList.add('invalid');
            isValid = false;
        } else {
            input.classList.remove('invalid');
        }
    });

    if (isValid) {
        savedUserDetails = getUserDetails(); // Save user details
        sendOrderDetailsToAdmin();
        sendOrderConfirmationToUser(getOrderData());
    } else {
        showNotification('Пожалуйста, заполните все обязательные поля правильно.');
    }
}

function getUserDetails() {
    const user = tg.initDataUnsafe.user;
    const userDetails = {
        name: document.querySelector('#name').value,
        surname: document.querySelector('#surname').value,
        telegram: user ? user.username : '',
    };

    console.log('Получены данные пользователя:', userDetails);

    // Check if all fields are filled
    for (const [key, value] of Object.entries(userDetails)) {
        if (!value && key !== 'telegram') { // telegram can be empty
            console.error(`Отсутствует значение для ${key}`);
            return null;
        }
    }

    return userDetails;
}

function getOrderData() {
    const userDetails = getUserDetails();
    if (!userDetails) {
        console.error('Данные заказа не найдены');
        return null;
    }

    return {
        name: userDetails.name,
        surname: userDetails.surname,
        telegram: userDetails.telegram,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
}

function sendOrderDetailsToAdmin() {
    const orderData = getOrderData();
    if (!orderData) {
        console.error('Данные заказа не найдены');
        showNotification('Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.');
        return;
    }

    const adminChatId = '7356161144';
    const botToken = '5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo';
    
    // Create readable text without JSON tags
    const humanReadableText = `🆕 Новый заказ!\n\n` +
        `📋 Данные заказа:\n` +
        `👤 Имя: ${orderData.name}\n` +
        `👥 Фамилия: ${orderData.surname}\n` +
        `📱 Telegram: @${orderData.telegram}\n\n` +
        `🛍️ Товары:\n${orderData.items.map(item => 
            `• ${item.name} - ${item.quantity}шт. x ${item.price} руб`
        ).join('\n')}\n\n` +
        `💰 Итого: ${orderData.total} руб`;
    
    const messageText = `${humanReadableText}`;
    
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: adminChatId,
            text: messageText,
            parse_mode: 'HTML'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            console.log('Данные заказа отправлены успешно');
            // Send order confirmation to user
            sendOrderConfirmationToUser(orderData);
        } else {
            console.error('Ошибка отправки данных заказа:', data);
            showNotification('Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.');
        }
    })
    .catch(error => {
        console.error('Ошибка отправки данных заказа:', error);
        showNotification('Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.');
    });
}

function sendOrderConfirmationToUser(orderData) {
    if (!orderData) {
        console.error('Данные заказа не найдены для подтверждения пользователю');
        return;
    }

    const botToken = '5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo';
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) {
        console.error('ID пользователя не найден');
        return;
    }

    const humanReadableText = `Ваш заказ:\n\n` +
        `📋 Данные заказа:\n` +
        `👤 Имя: ${orderData.name}\n` +
        `👥 Фамилия: ${orderData.surname}\n` +
        `📱 Telegram: @${orderData.telegram}\n\n` +
        `🛍️ Товары:\n${orderData.items.map(item => 
            `• ${item.name} - ${item.quantity}шт. x ${item.price} руб`
        ).join('\n')}\n\n` +
        `💰 Итого: ${orderData.total} руб`;

    const messageText = `${humanReadableText}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: userId,
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "✅ Подтвердить заказ ✅",
                        callback_data: "confirm_order"
                    }],
                    [{
                        text: "Вернуться в главное меню",
                        callback_data: "back_to_main"
                    }]
                ]
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            console.log('Подтверждение заказа отправлено успешно');
            // Send order details to admin
            sendOrderDetailsToAdmin();
            Telegram.WebApp.close();
        } else {
            console.error('Ошибка отправки подтверждения заказа:', data);
            showNotification('Произошла ошибка при отправке подтверждения. Пожалуйста, попробуйте еще раз.');
        }
    })
    .catch(error => {
        console.error('Ошибка отправки подтверждения заказа:', error);
        showNotification('Произошла ошибка при отправке подтверждения. Пожалуйста, попробуйте еще раз.');
    });
}

// Функция для показа сообщений
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
    
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'product-details-container';
    detailsContainer.innerHTML = `
        <div class="product-details-header">
            <button class="back-button" id="detailsBackButton">
                <i class="material-icons">arrow_back</i>
            </button>
            <h2>Детали</h2>
        </div>
        <div class="product-details">
            <h1>${product.price} руб</h1>
            <h3>${product.name}</h3>
            <div class="availability ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                ${product.inStock ? 'В наличии' : 'Нет в наличии'}
            </div>
            <div class="product-characteristics">
                <h4>Характеристики</h4>
                <ul>
                    <li>Объем: ${product.volume || 'Н/Д'}</li>
                    <li>Сила: ${product.strength || 'Н/Д'}</li>
                    <li>Производитель: ${product.manufacturer || 'Н/Д'}</li>
                </ul>
            </div>
            <div class="product-description">
                <h4>Описание</h4>
                <p>${product.description || 'Описание не доступно'}</p>
            </div>
            <button class="add-to-cart-button">Добавить в корзину</button>
        </div>
    `;
    
    document.body.appendChild(detailsContainer);
    
    const backButton = document.getElementById('detailsBackButton');
    if (backButton) {
        backButton.onclick = () => {
            detailsContainer.remove();
            showHome();
        };
    }
    
    const addToCartButton = detailsContainer.querySelector('.add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.onclick = () => {
            addToCart(product);
            showNotification('Товар добавлен в корзину');
        };
    }
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
                <h2>Фильтр</h2>
                <button class="clear-button">Очистить</button>
            </div>
            <div class="catalog-section">
                <h3>Выберите категорию</h3>
                <div class="category-list">
                    <div class="category-item" data-category="Murder Mystery 2">
                        <span>Murder Mystery 2</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Natural Disaster Survival">
                        <span>Natural Disaster Survival</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Phantom Forces">
                        <span>Phantom Forces</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Jailbreak">
                        <span>Jailbreak</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Meep City">
                        <span>Meep City</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                </div>
            </div>
            <button class="show-products-button">
                Показать
                <span class="products-count">Найдено товаров: 130</span>
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
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }

        // Обработчик для кнопки "Очистить"
        const clearButton = catalogContainer.querySelector('.clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                currentCategory = null;
                showNotification('Фильтры очищены');
                showHome();
            });
        }

        // Обработчик для кнопки "Показать"
        const showButton = catalogContainer.querySelector('.show-products-button');
        if (showButton) {
            showButton.addEventListener('click', handleShowProducts);
        }
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

function handleCategoryClick(category) {
    hideAllContainers();
    
    const subcategories = {
        'Murder Mystery 2': [
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2',
            'Murder Mystery 2'
        ],
        'Natural Disaster Survival': [
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival',
            'Natural Disaster Survival'
        ],
        'Phantom Forces': [
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces',
            'Phantom Forces'
        ],
        'Jailbreak': [
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak',
            'Jailbreak'
        ],
        'Meep City': [
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City',
            'Meep City'
        ]
    };
    
    const selectedSubcategories = subcategories[category] || [];
    
    const catalogContainer = document.createElement('div');
    catalogContainer.className = 'catalog-container';
    
    let catalogHTML = `
        <div class="catalog-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Категория: ${category}</h1>
        </div>
        <div class="category-list">
            <div class="category-item" onclick="showCatalog()">
                <span>Все категории</span>
                <i class="material-icons">chevron_right</i>
            </div>
    `;
    
    selectedSubcategories.forEach(subcategory => {
        catalogHTML += `
            <div class="category-item">
                <span>${subcategory}</span>
                <i class="material-icons">chevron_right</i>
            </div>
        `;
    });
    
    catalogHTML += '</div>';
    catalogContainer.innerHTML = catalogHTML;
    
    const backButton = catalogContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', showCatalog);
    }
    
    document.body.appendChild(catalogContainer);
}

function showWheel() {
    hideAllContainers();
    
    const wheelContainer = document.createElement('div');
    wheelContainer.className = 'wheel-container';
    wheelContainer.innerHTML = `
        <div id="wheel-app">
            <img class="marker" src="marker.png" />
            <img class="wheel" src="wheel.png" />
            <img class="button" src="button.png" />
        </div>
    `;
    
    document.body.appendChild(wheelContainer);

    // Добавляем обработчики после того, как элементы добавлены в DOM
    const wheel = wheelContainer.querySelector('.wheel');
    const startButton = wheelContainer.querySelector('.button');
    let deg = 0;

    startButton.addEventListener('click', () => {
        // Отключаем кнопку во время вращения
        startButton.style.pointerEvents = 'none';
        
        // Генерируем случайное число от 0 до 100
        const random = Math.random() * 100;
        let currentProbability = 0;
        let selectedPrize = null;
        let selectedPrizeIndex = 0;
        
        // Выбираем приз на основе вероятности
        for (let i = 0; i < prizes.length; i++) {
            currentProbability += prizes[i].probability;
            if (random <= currentProbability) {
                selectedPrize = prizes[i];
                selectedPrizeIndex = i;
                break;
            }
        }

        // Вычисляем угол для выбранного приза
        const segmentSize = 360 / prizes.length;
        const targetDeg = (selectedPrizeIndex * segmentSize) + Math.random() * (segmentSize * 0.8);
        
        // Добавляем несколько полных оборотов
        deg = targetDeg + 1440 + Math.random() * 720; // 4-6 полных оборотов
        
        // Устанавливаем переход и вращаем колесо
        wheel.style.transition = 'all 10s ease-out';
        wheel.style.transform = `rotate(${deg}deg)`;
        
        // Добавляем размытие
        wheel.classList.add('blur');
    });

    wheel.addEventListener('transitionend', () => {
        // Убираем размытие
        wheel.classList.remove('blur');
        
        // Включаем кнопку
        startButton.style.pointerEvents = 'auto';
        
        // Убираем transition для мгновенного поворота
        wheel.style.transition = 'none';
        
        // Вычисляем актуальный угол
        const actualDeg = deg % 360;
        
        // Определяем выигрыш на основе случайного числа
        const random = Math.random() * 100;
        let currentProbability = 0;
        let selectedPrize = null;
        
        for (const prize of prizes) {
            currentProbability += prize.probability;
            if (random <= currentProbability) {
                selectedPrize = prize;
                break;
            }
        }

        // Показываем сообщение о выигрыше
        let message = '';
        switch(selectedPrize.type) {
            case 'nothing':
                message = 'К сожалению, вы ничего не выиграли. Попробуйте еще раз!';
                break;
            case 'discount':
                message = `Поздравляем! Вы выиграли скидку ${selectedPrize.amount}₽ при заказе от ${selectedPrize.minOrder}₽!`;
                break;
            case 'free':
                message = `Поздравляем! Вы выиграли бесплатный заказ на сумму до ${selectedPrize.maxAmount}₽!`;
                break;
        }
        showNotification(message);
        
        // Устанавливаем конечное положение
        wheel.style.transform = `rotate(${actualDeg}deg)`;
    });
    
    // Обновляем активную вкладку в нижней навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === 'wheel') {
            item.classList.add('active');
        }
    });
}

// Обновляем нижнюю навигацию
function createBottomNav() {
    const bottomNav = document.createElement('div');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
    <div class="nav-item" data-page="home">
        <i class="material-icons">home</i>
        <span>Главная</span>
    </div>
    <div class="nav-item" data-page="cart">
        <i class="material-icons">shopping_cart</i>
        <span>Корзина</span>
    </div>
    <div class="nav-item" data-page="wheel">
        <i class="material-icons">casino</i>
        <span>Призы</span>
    </div>
    <div class="nav-item" data-page="account">
        <i class="material-icons">person</i>
        <span>Профиль</span>
    </div>
    `;
    
    bottomNav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switch(page) {
                case 'home':
                    showHome();
                    break;
                case 'cart':
                    if (cart.length === 0) {
                        showNotification('Корзина пуста');
                        return;
                    }
                    showCart();
                    break;
                case 'wheel':
                    showWheel();
                    break;
                case 'account':
                    showAccount();
                    break;
            }
        });
    });
    
    return bottomNav;
}

// Функция для скрытия всех контейнеров
function hideAllContainers() {
    document.querySelectorAll('.checkout-container, .payment-container').forEach(container => container.remove());
    document.querySelector('.app').style.display = 'none';
    document.querySelector('.cart-container')?.remove();
    document.querySelector('.catalog-container')?.remove();
    document.querySelector('.account-container')?.remove();
    document.querySelector('.product-details-container')?.remove();
    document.querySelector('.wheel-container')?.remove();
}

// Функции для страниц
function showHome() {
    hideAllContainers();
    document.querySelector('.app').style.display = 'block';
    currentCategory = 'Murder Mystery 2';
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
                <h2>Аккаунт</h2>
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
                        tg.openTelegramLink('https://t.me/odnorazki_wro');
                        break;
                    case 'about':
                        // Отправляем callback для показа информации о магазине
                        fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                callback_query_id: tg.initDataUnsafe?.query_id,
                                data: 'about_us'
                            })
                        });
                        Telegram.WebApp.close();
                        break;
                }
            });
        });
        
        document.body.appendChild(accountContainer);
    }
    
    accountContainer.style.display = 'block';
}

function showOrders() {
    showNotification('История заказов недоступна');
}

// Создаем нижнюю навигацию
const bottomNav = createBottomNav();
document.body.appendChild(bottomNav);

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

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

cart = loadCart();

function addToCart(product) {
    if (!product.in_stock) {
        alert('Извините, этот товар временно недоступен.');
        return;
    }
    
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    updateCartCounter();
    showNotification('Товар добавлен в корзину');
    showCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCounter();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartCounter();
}

function updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    counter.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
}

window.addEventListener('load', () => {
    updateCartCounter();
});

// Массив призов для колеса фортуны
const prizes = [
    {
        text: "Ничего",
        probability: 45,
        type: "nothing"
    },
    {
        text: "Скидка 25₽ при заказе от 250₽",
        probability: 5,
        type: "discount",
        amount: 25,
        minOrder: 250
    },
    {
        text: "Бесплатный заказ до 100₽",
        probability: 0,
        type: "free",
        maxAmount: 100
    },
    {
        text: "Ничего",
        probability: 48,
        type: "nothing"
    },
    {
        text: "Скидка 5₽ при заказе от 50₽",
        probability: 2,
        type: "discount",
        amount: 5,
        minOrder: 50
    },
    {
        text: "Бесплатный заказ до 300₽",
        probability: 0,
        type: "free",
        maxAmount: 300
    }
];
