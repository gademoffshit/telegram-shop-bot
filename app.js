let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация переменных
let cart = [];
let cartCounter = document.querySelector('.cart-counter');

// Функции для работы с корзиной
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
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

function updateCartCounter() {
    const cartCounter = document.querySelector('.cart-counter');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    cart = loadCart();
    updateCartCounter();
    
    // Инициализация счетчика корзины
    cartCounter = document.querySelector('.cart-counter');
    if (!cartCounter) {
        console.error('Cart counter element not found');
    }
});

// Инициализация Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#8774e1';

// Загрузка товаров с GitHub
async function getProducts(category = 'murder-mystery-2') {
    try {
        console.log('Начало загрузки товаров...');
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/gademoffshit/telegram-shop-bot/main/products.json?t=${timestamp}`);
        if (!response.ok) {
            throw new Error(`HTTP ошибка! статус: ${response.status}`);
        }
        const data = await response.json();
        console.log('Товары успешно загружены для категории:', category);
        return data[category] || [];
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
const homeButton = document.getElementById('homeButton');
const cartButton = document.getElementById('cartButton');
const filterBtn = document.querySelector('.filter-btn');

// Состояние программы
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
async function filterAndDisplayProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
    const sortValue = document.querySelector('.sort-select')?.value;

    let filteredProducts = products;

    // Фильтрация по категории
    if (activeCategory && activeCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === activeCategory);
    }

    // Фильтрация по поисковому запросу
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }

    // Сортировка
    if (sortValue) {
        filteredProducts.sort((a, b) => {
            if (sortValue === 'price-asc') return a.price - b.price;
            if (sortValue === 'price-desc') return b.price - a.price;
            if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
            if (sortValue === 'name-desc') return b.name.localeCompare(a.name);
            return 0;
        });
    }

    displayProducts(filteredProducts);
}

// Обработчик для кнопки "Показать"
function handleShowProducts() {
    showHome();
    filterAndDisplayProducts();
}

// Показ корзины
function showCart() {
    hideAllContainers();
    
    if (!cart || cart.length === 0) {
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
                cartContainer.remove();
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
                    <p class="cart-item-price">Розничная цена ${item.price}₽</p>
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
            <p>Итого: ${total}₽</p>
        </div>
        <button class="checkout-button" onclick="checkout()">
            Оформить заказ (${total}₽)
        </button>
    `;
    
    cartContainer.innerHTML = cartHTML;
    
    // Добавляем обработчики для кнопок + и -
    cartContainer.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const isPlus = button.classList.contains('plus');
            
            const item = cart.find(item => item.id === id);
            if (item) {
                if (isPlus) {
                    item.quantity += 1;
                } else if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart = cart.filter(cartItem => cartItem.id !== id);
                }
                saveCart();
                showCart(); // Перерисовываем корзину
                updateCartCounter();
            }
        });
    });
    
    const backButton = cartContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            cartContainer.remove();
            showHome();
        });
    }
    
    document.body.appendChild(cartContainer);
}

// Добавление в корзину
function addToCart(product) {
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
    const cartCounter = document.querySelector('.cart-counter');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Оформление заказа
function checkout() {
    hideAllContainers();
    
    const checkoutContainer = document.createElement('div');
    checkoutContainer.className = 'checkout-container';
    
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    checkoutContainer.innerHTML = `
        <div class="section">
            <div class="section-header">
                <div class="section-number">1</div>
                <h2>Контактные данные</h2>
            </div>
            <div class="form-group">
                <label for="name">Имя</label>
                <input type="text" id="name" required>
                <span class="helper-text">Как к вам обращаться</span>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <div class="section-number">2</div>
                <h2>Итого</h2>
            </div>
            <p class="total-amount">${total}₽</p>
        </div>
        
        <button class="checkout-button" id="checkoutButton">
            Оформить заказ
        </button>
    `;
    
    document.body.appendChild(checkoutContainer);

    // Добавляем обработчик для кнопки оформления заказа
    const checkoutButton = document.getElementById('checkoutButton');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', validateAndProceed);
    }
}

function validateAndProceed() {
    const name = document.getElementById('name').value.trim();

    let isValid = true;
    let errorMessage = '';

    if (!name) {
        isValid = false;
        errorMessage += 'Введите имя\n';
        document.getElementById('name').classList.add('invalid');
    }

    if (!isValid) {
        showNotification(errorMessage);
        return;
    }

    // Сохраняем данные пользователя
    savedUserDetails = {
        name
    };

    const orderData = getOrderData();
    sendOrderConfirmationToUser(orderData);
}

function getOrderData() {
    return {
        customerInfo: {
            name: savedUserDetails.name
        },
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
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

    const messageText = `🛍 Ваш заказ:\n\n` +
        `📋 Данные заказа:\n` +
        `👤 Имя: ${orderData.customerInfo.name}\n\n` +
        `📦 Товары:\n${orderData.items.map(item => 
            `• ${item.name} - ${item.quantity}шт. x ${item.price}₽`
        ).join('\n')}\n\n` +
        `💰 Итого: ${orderData.total}₽`;

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
                    [
                        {
                            text: "✅ Подтвердить заказ",
                            callback_data: "confirm_order"
                        }
                    ],
                    [
                        {
                            text: "В главное меню",
                            callback_data: "main_menu"
                        }
                    ]
                ]
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            console.log('Подтверждение заказа отправлено успешно');
            showNotification('Пожалуйста, подтвердите заказ в сообщении от бота');
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

function sendOrderDetailsToAdmin(orderData) {
    if (!orderData) {
        console.error('Данные заказа не найдены');
        showNotification('Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.');
        return;
    }

    const adminChatId = '2122584931';
    const botToken = '5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo';
    
    // Создаем читаемый текст сообщения
    const messageText = `🆕 Новый заказ!\n\n` +
        `👤 Данные покупателя:\n` +
        `Имя: ${orderData.customerInfo.name}\n\n` +
        `🛍️ Товары:\n${orderData.items.map(item => 
            `• ${item.name} - ${item.quantity}шт. x ${item.price}₽`
        ).join('\n')}\n\n` +
        `💰 Итого: ${orderData.total}₽`;
    
    // Отправляем сообщение админу
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
            // Очищаем корзину после успешного заказа
            cart = [];
            saveCart();
            updateCartCounter();
            showNotification('Заказ успешно оформлен!');
            // Закрываем веб-приложение
            setTimeout(() => {
                tg.close();
            }, 2000);
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

// Обработчик для кнопки "Показать"
function handleShowProducts() {
    showHome();
    filterAndDisplayProducts();
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
            <button class="button">Крутить барабан</button>
        </div>
    `;
    
    document.body.appendChild(wheelContainer);

    // Добавляем обработчики после того, как элементы добавлены в DOM
    const wheel = wheelContainer.querySelector('.wheel');
    const startButton = wheelContainer.querySelector('.button');
    let deg = 0;

    // Проверяем, когда пользователь в последний раз крутил колесо
    const lastSpinTime = localStorage.getItem('lastSpinTime');
    const currentTime = Date.now();
    const cooldownTime = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

    if (lastSpinTime && (currentTime - parseInt(lastSpinTime) < cooldownTime)) {
        // Если прошло меньше 24 часов
        const timeLeft = cooldownTime - (currentTime - parseInt(lastSpinTime));
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        
        startButton.disabled = true;
        startButton.textContent = `Доступно через ${hoursLeft}ч ${minutesLeft}м`;
        showNotification(`Вы сможете крутить колесо через ${hoursLeft} ч. ${minutesLeft} мин.`);
    } else {
        startButton.addEventListener('click', () => {
            if (startButton.disabled) return;
            
            startButton.disabled = true;
            deg = Math.floor(5000 + Math.random() * 5000);
            wheel.style.transform = `rotate(${deg}deg)`;

            // Сохраняем время последнего вращения
            localStorage.setItem('lastSpinTime', Date.now().toString());

            // Ждем окончания анимации
            setTimeout(() => {
                // Определяем выигрыш
                const actualDeg = deg % 360;
                let prize = '';
                
                if (actualDeg >= 0 && actualDeg < 45) prize = 'Скидка 5%';
                else if (actualDeg >= 45 && actualDeg < 90) prize = 'Скидка 10%';
                else if (actualDeg >= 90 && actualDeg < 135) prize = 'Скидка 15%';
                else if (actualDeg >= 135 && actualDeg < 180) prize = 'Скидка 20%';
                else if (actualDeg >= 180 && actualDeg < 225) prize = 'Скидка 25%';
                else if (actualDeg >= 225 && actualDeg < 270) prize = 'Скидка 30%';
                else if (actualDeg >= 270 && actualDeg < 315) prize = 'Скидка 35%';
                else prize = 'Скидка 40%';

                showNotification(`Поздравляем! Вы выиграли ${prize}!`);
                
                // Обновляем текст кнопки
                startButton.textContent = 'Доступно через 24ч';
            }, 5500);
        });
    }
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
    const cartCounter = document.querySelector('.cart-counter');
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

window.addEventListener('load', () => {
    loadCart();
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

async function showProducts(category = 'murder-mystery-2') {
    const productsGrid = document.querySelector('.products-grid');
    productsGrid.innerHTML = '<div class="loading">Загрузка товаров...</div>';

    const products = await getProducts(category);
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">Товары не найдены</div>';
        return;
    }

    productsGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='placeholder.png'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price}₽</span>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <i class="material-icons">add_shopping_cart</i>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });

    // Добавляем обработчики для кнопок
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.id;
            const product = products.find(p => p.id === productId);
            if (product) {
                addToCart(product);
                saveCart(); // Сохраняем корзину после добавления товара
            }
        });
    });
}

// Обработчики категорий
document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Убираем активный класс у всех кнопок
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс нажатой кнопке
        button.classList.add('active');
        
        // Показываем товары выбранной категории
        const category = button.dataset.category;
        showProducts(category);
    });
});

// Функция отображения товаров
function displayProducts(productsToShow) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">Товары не найдены</div>';
        return;
    }

    productsToShow.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='placeholder.png'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price}₽</span>
                    <button class="add-to-cart-btn" data-product='${JSON.stringify(product)}'>
                        <i class="material-icons">add_shopping_cart</i>
                    </button>
                </div>
            </div>
        `;

        // Добавляем обработчик для кнопки
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            const productData = JSON.parse(addToCartBtn.dataset.product);
            addToCart(productData);
        });

        productsGrid.appendChild(card);
    });
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
