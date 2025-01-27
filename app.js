let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#2cab37';

// Данные о товарах
const products = [
    {
        id: 1,
        name: 'Ursa Baby Pro Gunmetal Espresso',
        price: '140 zł',
        category: 'Одноразки',
        image: 'https://i.imgur.com/example1.jpg'
    },
    {
        id: 2,
        name: 'Ursa Nano Pro 2 Classic Brown',
        price: '150 zł',
        category: 'Одноразки',
        image: 'https://i.imgur.com/example2.jpg'
    },
    // Добавьте больше товаров здесь
];

// Корзина
let cart = [];
let currentCategory = 'Люди';
let currentFilter = '';
let currentSort = 'default';

// DOM элементы
const productsGrid = document.querySelector('.products-grid');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const cartCounter = document.querySelector('.cart-counter');
const filterBtn = document.querySelector('.filter-btn');

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
                return parseFloat(a.price) - parseFloat(b.price);
            case 'price_desc':
                return parseFloat(b.price) - parseFloat(a.price);
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
                <p class="product-price">${product.price}</p>
            </div>
        `;
        
        productElement.addEventListener('click', () => {
            addToCart(product);
        });

        productsGrid.appendChild(productElement);
    });
}

// Добавление в корзину
function addToCart(product) {
    cart.push(product);
    updateCartCounter();
    
    tg.showPopup({
        title: 'Товар добавлен',
        message: `${product.name} добавлен в корзину`,
        buttons: [
            {id: "view_cart", type: "default", text: "Просмотреть корзину"},
            {id: "continue", type: "cancel", text: "Продолжить покупки"}
        ]
    }, (buttonId) => {
        if (buttonId === 'view_cart') {
            showCart();
        }
    });
}

// Обновление счетчика корзины
function updateCartCounter() {
    cartCounter.textContent = cart.length;
    if (cart.length > 0) {
        tg.MainButton.setText(`Оформить заказ (${cart.length})`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// Показ корзины
function showCart() {
    let cartMessage = 'Корзина:\n\n';
    let total = 0;
    
    cart.forEach((item, index) => {
        cartMessage += `${index + 1}. ${item.name} - ${item.price}\n`;
        total += parseFloat(item.price);
    });
    
    cartMessage += `\nИтого: ${total} zł`;
    
    tg.showPopup({
        title: 'Корзина',
        message: cartMessage,
        buttons: [
            {id: "checkout", type: "default", text: "Оформить заказ"},
            {id: "clear", type: "destructive", text: "Очистить корзину"},
            {id: "close", type: "cancel", text: "Закрыть"}
        ]
    }, (buttonId) => {
        if (buttonId === 'checkout') {
            checkout();
        } else if (buttonId === 'clear') {
            clearCart();
        }
    });
}

// Очистка корзины
function clearCart() {
    cart = [];
    updateCartCounter();
    tg.showPopup({
        message: 'Корзина очищена'
    });
}

// Оформление заказа
function checkout() {
    // Здесь будет логика оформления заказа
    tg.showPopup({
        message: 'Заказ оформлен! Мы свяжемся с вами для подтверждения.'
    });
    clearCart();
}

// Инициализация
filterAndDisplayProducts();
