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
import requests

# Загрузка переменных окружения
load_dotenv()

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

@dp.message(content_types=['web_app_data'])
async def web_app_data(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        order_text = "🛍 Новый заказ:\n\n"
        total = 0

        for item in data['items']:
            amount = item['price'] * item.get('quantity', 1)
            total += amount
            order_text += f"• {item['name']}\n"
            order_text += f"  {item.get('quantity', 1)} x {item['price']} zł = {amount} zł\n"

        order_text += f"\n💰 Итого: {total} zł"
        
        await message.answer(order_text)
        await message.answer("✅ Ваш заказ принят! Мы свяжемся с вами в ближайшее время.")
        
        # Отправляем заказ на сервер для обработки
        response = requests.post('http://localhost:5000/api/orders', json=data)
        if response.status_code != 201:
            await message.answer("❌ Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте снова.")
        
    except Exception as e:
        await message.answer("❌ Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте снова.")
        print(f"Error processing order: {e}")

async def main():
    """Запуск бота"""
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
