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
import uuid

# Загрузка переменных окружения
load_dotenv()

# Инициализация бота и диспетчера
bot = Bot(token='5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo')
dp = Dispatcher()

# URL вашего веб-приложения
WEBAPP_URL = "https://gademoffshit.github.io/telegram-shop-bot/"

# Словарь для хранения данных заказов
orders_data = {}

def get_main_keyboard():
    """Создание инлайн клавиатуры"""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Перейти до магазину", web_app=WebAppInfo(url=WEBAPP_URL))],
            [InlineKeyboardButton(text="Чат з оператором 💬", callback_data="operator_chat")],
            [InlineKeyboardButton(text="Допомога", callback_data="help")],
            [InlineKeyboardButton(text="Адмін панель", callback_data="admin_panel")]
        ]
    )
    return keyboard


def get_payment_keyboard():
    """Создание клавиатуры для выбора способа оплаты"""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Monobank", callback_data="pay_mono")],
            [InlineKeyboardButton(text="Blik", callback_data="pay_blik")],
            [InlineKeyboardButton(text="Crypto trc-20", callback_data="pay_crypto")],
            [InlineKeyboardButton(text="Назад", callback_data="back_to_order")]
        ]
    )
    return keyboard


def get_admin_keyboard():
    """Создание клавиатуры для админ панели"""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Все заказы", callback_data="all_orders")],
            [InlineKeyboardButton(text="Ожидают оплаты", callback_data="waiting_orders")],
            [InlineKeyboardButton(text="Оплаченные", callback_data="paid_orders")],
            [InlineKeyboardButton(text="Отправленные", callback_data="shipped_orders")]
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


@dp.callback_query(lambda c: c.data == "confirm_order")
async def process_confirm_order(callback: types.CallbackQuery):
    """Обработчик подтверждения заказа"""
    user_id = callback.from_user.id
    order_id = str(uuid.uuid4())
    orders_data[order_id] = {
        "user_id": user_id,
        "status": "waiting for payment",
        "details": callback.message.text
    }
    await callback.message.edit_text(
        f"{callback.message.text}\n\n"
        "✅ Дані підтверджено\n"
        "Оберіть спосіб оплати:",
        reply_markup=get_payment_keyboard()
    )
    await callback.answer()


@dp.callback_query(lambda c: c.data.startswith("pay_"))
async def process_payment(callback: types.CallbackQuery):
    """Обработчик выбора способа оплаты"""
    payment_method = callback.data.split("_")[1]
    payment_info = {
        "mono": "Monobank:\n4441 1144 5791 2777\nОтримувач: Максим",
        "blik": "Blik:\n799 799 799",
        "crypto": "TRC20 USDT:\nTW6yb9RoWxHxXkgZvPG7nGW8ZzWJmYCYts"
    }

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="✅ Я сплатив", callback_data="payment_done")],
            [InlineKeyboardButton(text="Назад", callback_data="back_to_payment")]
        ]
    )

    await callback.message.edit_text(
        f"Реквізити для оплати:\n\n{payment_info[payment_method]}\n\n"
        "Після оплати натисніть кнопку 'Я сплатив'",
        reply_markup=keyboard
    )
    await callback.answer()


@dp.callback_query(lambda c: c.data == "payment_done")
async def process_payment_confirmation(callback: types.CallbackQuery):
    """Обработчик подтверждения оплаты"""
    for order_id, order in orders_data.items():
        if order["user_id"] == callback.from_user.id and order["status"] == "waiting for payment":
            order["status"] = "paid"
            break
    await callback.message.edit_text(
        "✅ Дякуємо за замовлення!\n\n"
        "Ми отримали підтвердження оплати і скоро відправимо ваше замовлення.\n"
        "Очікуйте повідомлення з номером відстеження.",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[[
                InlineKeyboardButton(text="До головного меню", callback_data="main_menu")
            ]]
        )
    )
    await callback.answer()


@dp.callback_query(lambda c: c.data == "back_to_payment")
async def back_to_payment(callback: types.CallbackQuery):
    """Обработчик кнопки возврата к выбору способа оплаты"""
    await callback.message.edit_text(
        "Оберіть спосіб оплати:",
        reply_markup=get_payment_keyboard()
    )
    await callback.answer()


@dp.callback_query(lambda c: c.data == "admin_panel")
async def admin_panel(callback: types.CallbackQuery):
    """Обработчик открытия админ панели"""
    if str(callback.from_user.id) == '2122584931':  # ID администратора
        await callback.message.answer("Заказы:", reply_markup=get_admin_keyboard())
    else:
        await callback.message.answer("У вас нет доступа к админ панели.")
    await callback.answer()


@dp.callback_query(lambda c: c.data in ["all_orders", "waiting_orders", "paid_orders", "shipped_orders"])
async def filter_orders(callback: types.CallbackQuery):
    """Обработчик фильтрации заказов"""
    status_map = {
        "all_orders": "Все заказы",
        "waiting_orders": "waiting for payment",
        "paid_orders": "paid",
        "shipped_orders": "shipped"
    }
    selected_status = status_map.get(callback.data)
    orders_list = "Список заказов:\n"
    for order_id, order in orders_data.items():
        if callback.data == "all_orders" or order["status"] == selected_status:
            orders_list += f"{order_id}: {order['status']}\n"
            orders_list += f"Пользователь: {order['details']}\n"
            orders_list += "------------------\n"
    if orders_list == "Список заказов:\n":
        orders_list += "Нет заказов"

    # Проверка на изменение сообщения
    if callback.message.text != orders_list:
        await callback.message.edit_text(orders_list, reply_markup=get_admin_keyboard())
    await callback.answer()


@dp.callback_query(lambda c: c.data == "main_menu")
async def back_to_main_menu(callback: types.CallbackQuery):
    """Обработчик возврата в главное меню"""
    await callback.message.edit_text(
        "Раді бачити тебе у нашому магазині CHASER | HOTSPOT 👍\n\n"
        "Купуй улюблений смак зручно та 24/7 через наш телеграм бот 🌐",
        reply_markup=get_main_keyboard()
    )
    await callback.answer()


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


async def main():
    """Запуск бота"""
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
