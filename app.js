let tg = window.Telegram.WebApp;

// Инициализация Telegram WebApp
tg.expand();
tg.enableClosingConfirmation();

// Получаем основные элементы
const searchInput = document.querySelector('.search-bar input');
const categoryButtons = document.querySelectorAll('.category-btn');
const filterBtn = document.querySelector('.filter-btn');
const sortSelect = document.querySelector('.sort-select');
const productsContainer = document.querySelector('.products');

// Данные о товарах
const products = [
    {
        id: 1,
        name: 'Ursa Baby Pro Gunmetal Espresso',
        price: '140 zł',
        category: 'Одноразки',
        image: 'product1.jpg'
    },
    {
        id: 2,
        name: 'Ursa Nano Pro 2 Classic Brown',
        price: '150 zł',
        category: 'Одноразки',
        image: 'product2.jpg'
    }
];

// Обработчики категорий
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterProducts();
    });
});

// Поиск по товарам
searchInput.addEventListener('input', filterProducts);

// Сортировка товаров
sortSelect.addEventListener('change', filterProducts);

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active').textContent;
    
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = activeCategory === 'Все' || product.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    displayProducts(filteredProducts);
}

function displayProducts(products) {
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">${product.price}</p>
        `;
        
        productElement.addEventListener('click', () => {
            tg.showPopup({
                title: product.name,
                message: `Цена: ${product.price}`,
                buttons: [
                    {id: "add_to_cart", type: "default", text: "Добавить в корзину"},
                    {id: "cancel", type: "cancel", text: "Закрыть"}
                ]
            });
        });

        productsContainer.appendChild(productElement);
    });
}

// Инициализация отображения
displayProducts(products);
