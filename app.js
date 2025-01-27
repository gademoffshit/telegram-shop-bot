let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#8774e1';

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

// Данные о товарах
const products = [
    {
        id: 1,
        name: 'Ursa Baby Pro Gunmetal Espresso',
        price: 140,
        category: 'Одноразки',
        image: 'https://i.imgur.com/example1.jpg',
        popularity: 10
    },
    {
        id: 2,
        name: 'Ursa Nano Pro 2 Classic Brown',
        price: 150,
        category: 'Одноразки',
        image: 'https://i.imgur.com/example2.jpg',
        popularity: 8
    },
    // Добавьте больше товаров здесь
];

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
    if (cart.length === 0) {
        tg.showPopup({
            title: 'Корзина пуста',
            message: 'Добавьте товары в корзину',
            buttons: [{id: "ok", type: "cancel", text: "OK"}]
        });
        return;
    }

    let cartMessage = 'Корзина:\n\n';
    let total = 0;
    
    cart.forEach((item, index) => {
        cartMessage += `${index + 1}. ${item.name} - ${item.price} zł\n`;
        total += item.price;
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
    const orderData = {
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price, 0)
    };
    
    tg.sendData(JSON.stringify(orderData));
    clearCart();
}

// Инициализация
filterAndDisplayProducts();
