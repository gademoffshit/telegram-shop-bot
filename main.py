import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters.command import Command
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo
)
from dotenv import load_dotenv
import os
import sqlite3
import json

# Загрузка переменных окружения
load_dotenv()

# Инициализация базы данных
def init_db():
    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            image TEXT NOT NULL,
            popularity INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Инициализация бота и диспетчера
bot = Bot(token=os.getenv('BOT_TOKEN'))
dp = Dispatcher()

# URL вашего веб-приложения
WEBAPP_URL = "https://gademoffshit.github.io/telegram-shop-bot/"

def get_main_keyboard():
    """Создание инлайн клавиатуры"""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Перейти до магазину", web_app=WebAppInfo(url=WEBAPP_URL))],
            [InlineKeyboardButton(text="Чат з оператором 💬", callback_data="operator_chat")],
            [InlineKeyboardButton(text="Допомога", callback_data="help")]
        ]
    )
    return keyboard

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    await message.answer(
        "Раді бачити тебе у нашому магазині CHASER | HOTSPOT 👍\n\n"
        "Купуй улюблений смак зручно та 24/7 через наш телеграм бот 🌐",
        reply_markup=get_main_keyboard()
    )

@dp.callback_query(lambda c: c.data == "operator_chat")
async def operator_chat(callback: types.CallbackQuery):
    """Обработчик кнопки чата с оператором"""
    await callback.message.answer(
        "Наш оператор скоро свяжется с вами.\n"
        "Пожалуйста, опишите ваш вопрос."
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data == "help")
async def help_handler(callback: types.CallbackQuery):
    """Обработчик кнопки помощи"""
    help_text = (
        "🛍 Как сделать заказ:\n"
        "1. Нажмите 'Перейти до магазину'\n"
        "2. Выберите товары\n"
        "3. Добавьте их в корзину\n"
        "4. Оформите заказ\n\n"
        "❓ Есть вопросы? Используйте 'Чат з оператором'"
    )
    await callback.message.answer(help_text)
    await callback.answer()

# Команды для администратора
@dp.message(Command("add_product"))
async def add_product(message: types.Message):
    if not await is_admin(message):
        await message.answer("У вас нет прав для выполнения этой команды.")
        return

    try:
        # Формат: /add_product name|price|category|image_url
        product_data = message.text.replace('/add_product ', '').split('|')
        if len(product_data) != 4:
            await message.answer("Неверный формат. Используйте: /add_product название|цена|категория|ссылка_на_изображение")
            return

        name, price, category, image = product_data
        price = float(price)

        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        c.execute('INSERT INTO products (name, price, category, image) VALUES (?, ?, ?, ?)',
                 (name, price, category, image))
        conn.commit()
        conn.close()

        await message.answer(f"Товар '{name}' успешно добавлен!")
    except Exception as e:
        await message.answer(f"Ошибка при добавлении товара: {str(e)}")

@dp.message(Command("remove_product"))
async def remove_product(message: types.Message):
    if not await is_admin(message):
        await message.answer("У вас нет прав для выполнения этой команды.")
        return

    try:
        product_id = int(message.text.replace('/remove_product ', ''))
        
        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        c.execute('DELETE FROM products WHERE id = ?', (product_id,))
        if c.rowcount > 0:
            conn.commit()
            await message.answer(f"Товар с ID {product_id} успешно удален!")
        else:
            await message.answer(f"Товар с ID {product_id} не найден.")
        conn.close()
    except Exception as e:
        await message.answer(f"Ошибка при удалении товара: {str(e)}")

@dp.message(Command("list_products"))
async def list_products(message: types.Message):
    if not await is_admin(message):
        await message.answer("У вас нет прав для выполнения этой команды.")
        return

    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    c.execute('SELECT id, name, price, category FROM products')
    products = c.fetchall()
    conn.close()

    if not products:
        await message.answer("Список товаров пуст.")
        return

    message_text = "Список товаров:\n\n"
    for product in products:
        message_text += f"ID: {product[0]}\nНазвание: {product[1]}\nЦена: {product[2]} zł\nКатегория: {product[3]}\n\n"
    
    await message.answer(message_text)

@dp.message(Command("edit_product"))
async def edit_product(message: types.Message):
    if not await is_admin(message):
        await message.answer("У вас нет прав для выполнения этой команды.")
        return

    try:
        # Формат: /edit_product id|name|price|category|image_url
        product_data = message.text.replace('/edit_product ', '').split('|')
        if len(product_data) != 5:
            await message.answer("Неверный формат. Используйте: /edit_product id|название|цена|категория|ссылка_на_изображение")
            return

        product_id, name, price, category, image = product_data
        product_id = int(product_id)
        price = float(price)

        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        c.execute('''
            UPDATE products 
            SET name = ?, price = ?, category = ?, image = ?
            WHERE id = ?
        ''', (name, price, category, image, product_id))
        
        if c.rowcount > 0:
            conn.commit()
            await message.answer(f"Товар с ID {product_id} успешно обновлен!")
        else:
            await message.answer(f"Товар с ID {product_id} не найден.")
        
        conn.close()
    except Exception as e:
        await message.answer(f"Ошибка при обновлении товара: {str(e)}")

# Вспомогательные функции
async def is_admin(message: types.Message) -> bool:
    # Здесь можно добавить список ID администраторов
    admin_ids = [123456789]  # Замените на реальные ID администраторов
    return message.from_user.id in admin_ids

async def get_products():
    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    c.execute('SELECT id, name, price, category, image, popularity FROM products')
    products = c.fetchall()
    conn.close()
    
    return [
        {
            'id': p[0],
            'name': p[1],
            'price': p[2],
            'category': p[3],
            'image': p[4],
            'popularity': p[5]
        }
        for p in products
    ]

async def main():
    """Запуск бота"""
    init_db()
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
