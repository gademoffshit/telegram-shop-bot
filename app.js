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
    const mainApp = document.querySelector('.app');
    mainApp.style.display = 'none';

    // Создаем контейнер корзины
    const cartContainer = document.createElement('div');
    cartContainer.className = 'cart-container';

    // Добавляем шапку
    const cartHeader = document.createElement('div');
    cartHeader.className = 'cart-header';
    cartHeader.innerHTML = `
        <button class="back-button">
            <i class="material-icons">arrow_back</i>
        </button>
        <div class="cart-title">CHASER | HOTSPOT</div>
    `;
    cartContainer.appendChild(cartHeader);

    // Добавляем товары
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
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
        `;
        cartContainer.appendChild(cartItem);
    });

    // Добавляем итог
    const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const cartTotal = document.createElement('div');
    cartTotal.className = 'cart-total';
    cartTotal.innerHTML = `
        <div class="total-row">
            <span>Сумма</span>
            <span>${total.toFixed(2)} zł</span>
        </div>
        <button class="checkout-button">Оформити замовлення</button>
    `;
    cartContainer.appendChild(cartTotal);

    // Добавляем корзину на страницу
    document.body.appendChild(cartContainer);

    // Обработчики событий
    const backButton = cartContainer.querySelector('.back-button');
    backButton.addEventListener('click', () => {
        document.body.removeChild(cartContainer);
        mainApp.style.display = 'block';
    });

    const checkoutButton = cartContainer.querySelector('.checkout-button');
    checkoutButton.addEventListener('click', () => {
        checkout();
        document.body.removeChild(cartContainer);
        mainApp.style.display = 'block';
    });

    // Обработчики кнопок количества
    const minusButtons = cartContainer.querySelectorAll('.minus');
    const plusButtons = cartContainer.querySelectorAll('.plus');

    minusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.index;
            if (!cart[index].quantity || cart[index].quantity === 1) {
                cart.splice(index, 1);
                if (cart.length === 0) {
                    document.body.removeChild(cartContainer);
                    mainApp.style.display = 'block';
                } else {
                    showCart(); // Перерисовываем корзину
                }
            } else {
                cart[index].quantity--;
                showCart(); // Перерисовываем корзину
            }
            updateCartCounter();
        });
    });

    plusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.index;
            cart[index].quantity = (cart[index].quantity || 1) + 1;
            showCart(); // Перерисовываем корзину
            updateCartCounter();
        });
    });
}

// Удаление товара из корзины
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCounter();
    showCart();
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
        total: cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
    };
    
    tg.sendData(JSON.stringify(orderData));
    clearCart();
}

// Инициализация
filterAndDisplayProducts();
