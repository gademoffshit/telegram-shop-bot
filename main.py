import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters.command import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv
import os

# Загрузка переменных окружения
load_dotenv()

# Инициализация бота и диспетчера
bot = Bot(token=os.getenv('BOT_TOKEN'))
dp = Dispatcher()

# Категории товаров
categories = ['Люди', 'Рідина', 'Одноразки', 'Картриджі']

# Примеры товаров
products = {
    'Ursa Baby Pro Gunmetal Espresso': {
        'price': '140 zł',
        'description': 'Компактная pod-система',
        'image': 'url_to_image'
    },
    'Ursa Nano Pro 2 Classic Brown': {
        'price': '150 zł',
        'description': 'Pod-система с регулировкой затяжки',
        'image': 'url_to_image'
    }
}

def get_main_keyboard():
    """Создание главной клавиатуры с категориями"""
    buttons = []
    for category in categories:
        buttons.append([InlineKeyboardButton(text=category, callback_data=f"category_{category}")])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    return keyboard

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    await message.answer(
        "Добро пожаловать в наш магазин!",
        reply_markup=get_main_keyboard()
    )

@dp.callback_query(lambda c: c.data.startswith('category_'))
async def process_category(callback: types.CallbackQuery):
    """Обработчик выбора категории"""
    category = callback.data.replace('category_', '')
    # Здесь можно добавить логику отображения товаров выбранной категории
    await callback.message.answer(f"Вы выбрали категорию: {category}")
    await callback.answer()

async def main():
    """Запуск бота"""
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
