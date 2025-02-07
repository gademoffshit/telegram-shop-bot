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
import json

# Загрузка переменных окружения
load_dotenv()

# Инициализация бота и диспетчера
bot = Bot(token='5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo')
dp = Dispatcher()

# URL вашего веб-приложения
WEBAPP_URL = "https://gademoffshit.github.io/telegram-shop-bot/"

# Словарь для хранения данных заказов
orders_data = {}

# Словарь для хранения временных данных заказов
pending_orders = {}

def get_main_keyboard():
    """Создаем основную клавиатуру"""
    buttons = [
        [{"text": "Перейти до магазину", "web_app": {"url": WEBAPP_URL}}],
        [{"text": "Чат з оператором 💬", "callback_data": "operator_chat"}],
        [{"text": "Допомога", "callback_data": "help"}],
        [{"text": "Про нас", "callback_data": "about_us"}]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_payment_keyboard():
    """Создание клавиатуры для выбора способа оплаты"""
    buttons = [
        [{"text": "Monobank", "callback_data": "pay_mono"}],
        [{"text": "Blik", "callback_data": "pay_blik"}],
        [{"text": "Crypto trc-20", "callback_data": "pay_crypto"}],
        [{"text": "Назад", "callback_data": "back_to_order"}]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_admin_keyboard():
    """Создание клавиатуры админ-панели"""
    buttons = [
        [
            {"text": "Все заказы", "callback_data": "all_orders"},
            {"text": "Ожидают оплаты", "callback_data": "waiting_orders"}
        ],
        [
            {"text": "Оплаченные", "callback_data": "paid_orders"},
            {"text": "Отправленные", "callback_data": "shipped_orders"}
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_order_keyboard(order_id: str):
    """Создание клавиатуры для конкретного заказа"""
    buttons = [
        [
            {"text": "✅ Принять", "callback_data": f"accept_{order_id}"},
            {"text": "❌ Отклонить", "callback_data": f"reject_{order_id}"}
        ],
        [{"text": "🔙 Назад", "callback_data": "back_to_orders"}]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def generate_order_id():
    """Функция для генерации уникального номера заказа"""
    return str(uuid.uuid4())


def create_order(user_id, order_data):
    """Функция для создания заказа"""
    # Проверяем, что order_data имеет нужную структуру
    required_fields = ['name', 'surname', 'phone', 'email', 'telegram', 'address', 'items', 'total']
    if not all(field in order_data for field in required_fields):
        raise ValueError("order_data is missing required fields")

    order_id = str(uuid.uuid4())[:8]  # Используем только первые 8 символов для краткости
    order = {
        'order_id': order_id,
        'user_id': user_id,
        'order_data': order_data,
        'status': 'Ожидает оплаты',
        'details': order_data  # Сохраняем полные детали заказа
    }
    orders_data[order_id] = order
    return order_id


def send_order_confirmation_to_user(user_id, order_id):
    """Функция для отправки сообщения пользователю"""
    message = f"✅ Дякуємо за замовлення!\n\nМи отримали підтвердження оплати і скоро відправимо ваше замовлення.\nОчікуйте повідомлення з номером відстеження.\nВаш номер замовлення: {order_id}"
    bot.send_message(chat_id=user_id, text=message)


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    await message.answer(
        "Ласкаво просимо до магазину VAPE ROOM | ELFBAR WROCLAW!\n\n"
        "Тут ви можете зробити замовлення та відстежувати його статус.",
        reply_markup=get_main_keyboard()
    )


@dp.message(Command("admin"))
async def admin_command(message: types.Message):
    """Обработчик команды /admin"""
    if str(message.from_user.id) == '7356161144':  # ID администратора
        await message.answer("Панель адміністратора:", reply_markup=get_admin_keyboard())
    else:
        await message.answer("У вас немає доступу до панелі адміністратора.")


@dp.callback_query(lambda c: c.data == "confirm_order")
async def process_confirm_order(callback: types.CallbackQuery):
    """Обработчик подтверждения заказа"""
    try:
        # Сначала удаляем кнопки, чтобы предотвратить повторное нажатие
        await callback.message.edit_reply_markup(reply_markup=None)
        
        # Получаем текст сообщения
        message_text = callback.message.text
        print(f"Processing message: {message_text}")

        # Пытаемся найти JSON в тегах
        start_tag = '<json>'
        end_tag = '</json>'
        start_index = message_text.find(start_tag)
        end_index = message_text.find(end_tag)

        if start_index != -1 and end_index != -1:
            # Если нашли JSON в тегах, используем его
            json_text = message_text[start_index + len(start_tag):end_index]
            order_data = json.loads(json_text)
        else:
            # Если JSON не найден в тегах, извлекаем данные из текста
            print("JSON tags not found, parsing message text")
            lines = message_text.split('\n')
            order_data = {
                'name': '',
                'surname': '',
                'phone': '',
                'email': '',
                'telegram': '',
                'address': '',
                'items': [],
                'total': 0,
                'deliveryPrice': 0
            }

            for line in lines:
                try:
                    line = line.strip()
                    if "Ім'я:" in line:
                        order_data['name'] = line.split("Ім'я:")[1].strip()
                    elif "Прізвище:" in line:
                        order_data['surname'] = line.split("Прізвище:")[1].strip()
                    elif "Телефон:" in line:
                        order_data['phone'] = line.split("Телефон:")[1].strip()
                    elif "Email:" in line:
                        order_data['email'] = line.split("Email:")[1].strip()
                    elif "Telegram:" in line:
                        order_data['telegram'] = line.split("@")[1].strip() if "@" in line else ""
                    elif "Адреса доставки:" in line:
                        order_data['address'] = line.split("Адреса доставки:")[1].strip()
                    elif "•" in line and "шт" in line:
                        try:
                            # Парсим информацию о товаре
                            item_info = line.replace('•', '').strip()
                            name_parts = item_info.split(' - ')
                            if len(name_parts) >= 2:
                                name = name_parts[0].strip()
                                quantity_part = name_parts[1].split('шт')[0].strip()
                                quantity = int(quantity_part)
                                order_data['items'].append({
                                    "name": name,
                                    "quantity": quantity,
                                    "price": 0  # Добавляем цену по умолчанию
                                })
                        except Exception as e:
                            print(f"Error parsing item: {e}")
                    elif "Усього:" in line:
                        try:
                            total = line.split('Усього:')[1].replace('zł', '').strip()
                            order_data['total'] = float(total)
                        except Exception as e:
                            print(f"Error parsing total: {e}")
                except Exception as e:
                    print(f"Error parsing line '{line}': {e}")
                    continue

        print(f"Parsed order data: {order_data}")
        
        # Создаем заказ
        user_id = callback.from_user.id
        order_id = create_order(user_id, order_data)
        
        # Отправляем подтверждение
        await callback.message.edit_text(
            f"✅ Ваш заказ підтверджений!\nНомер замовлення: {order_id}\n\n"
            "Оберіть спосіб оплати:",
            reply_markup=get_payment_keyboard()
        )
        await callback.answer("Заказ підтверджений!")
        
    except Exception as e:
        print(f"Error processing order: {e}")
        print(f"Message text: {message_text if 'message_text' in locals() else 'Not available'}")
        await callback.message.answer(f"Помилка обробки даних замовлення: {str(e)}")


@dp.callback_query(lambda c: c.data.startswith("pay_"))
async def process_payment(callback: types.CallbackQuery):
    """Обработчик выбора способа оплаты"""
    payment_method = callback.data.split("_")[1]
    payment_info = {
        "mono": "Monobank:\n4441 1144 5791 2777\nОтримувач: Максим",
        "blik": "Blik:\n799 799 799",
        "crypto": "TRC20 USDT:\nTW6yb9RoWxHxXkgZvPG7nGW8ZzWJmYCYts"
    }

    buttons = [
        [{"text": "✅ Я сплатив", "callback_data": "payment_done"}],
        [{"text": "Назад", "callback_data": "back_to_payment"}]
    ]
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)

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
        if order["user_id"] == callback.from_user.id and order["status"] == "Ожидает оплаты":
            order["status"] = "Оплачен"
            await bot.send_message(
                chat_id=callback.from_user.id,
                text=f"Ваш заказ с номером {order_id} на ожиданий!"
            )
            break
    buttons = [
        [{"text": "До головного меню", "callback_data": "main_menu"}]
    ]
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    await callback.message.edit_text(
        "✅ Дякуємо за замовлення!\n\n"
        "Ми отримали оплату і незабаром ваше замовлення буде відправлено.\n"
        "Очікуйте повідомлення з номером відстеження.",
        reply_markup=keyboard
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


@dp.callback_query(lambda c: c.data == "about_us")
async def send_about_us(callback: types.CallbackQuery):
    about_text = (
        "Про нас Vape Room\n\n"
        "Ми – перевірений магазин електронних сигарет, рідин для подів та аксесуарів. "
        "Вже 3,5 роки на ринку, за цей час ми обробили понад 3000 замовлень та отримали "
        "понад 1500 реальних відгуків від задоволених клієнтів.\n\n"
        "Чому обирають нас?\n\n"
        "✅ Швидка доставка – надсилаємо замовлення до інших міст з доставкою за 1-2 дні.\n"
        "Є сумніви? Напишіть менеджеру та отримайте відеофіксацію вашого замовлення!\n"
        "✅ Оперативна підтримка – відповідаємо протягом 10-15 хвилин.\n"
        "✅ Гнучка система знижок – постійні клієнти отримують вигідні пропозиції.\n"
        "✅ Гуртова торгівля – працюємо з великими замовленнями.\n\n"
        "Наша мета – надати якісний сервіс та найкращий вибір продукції для вейпінгу. "
        "Приєднуйтесь до Vape Room та переконайтеся самі!"
    )
    
    buttons = [[{"text": "🛍 Зробити замовлення", "web_app": {"url": WEBAPP_URL}}]]
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    
    await callback.message.answer(about_text, reply_markup=keyboard)
    await callback.answer()


@dp.callback_query(lambda c: c.data == "main_menu")
async def process_main_menu(callback: types.CallbackQuery):
    """Обработчик возврата в главное меню"""
    try:
        await callback.message.delete()
    except Exception as e:
        print(f"Error deleting message: {e}")

    await callback.message.answer(
        "Виберіть дію:",
        reply_markup=get_main_keyboard()
    )
    await callback.answer()


@dp.callback_query(lambda c: c.data in ["all_orders", "waiting_orders", "paid_orders", "shipped_orders"])
async def process_order_filter(callback: types.CallbackQuery):
    """Обработчик фильтрации заказов"""
    try:
        await callback.message.delete()
    except Exception as e:
        print(f"Error deleting message: {e}")

    status_map = {
        "all_orders": None,  # None означает все заказы
        "waiting_orders": "Ожидает оплаты",
        "paid_orders": "Оплачен",
        "shipped_orders": "Отправлен"
    }
    
    selected_status = status_map.get(callback.data)
    title = "Все заказы" if callback.data == "all_orders" else f"Заказы: {selected_status}"
    orders_list = f"📋 {title}:\n\n"
    
    buttons = []
    
    # Фильтруем заказы
    filtered_orders = {
        order_id: order for order_id, order in orders_data.items()
        if (selected_status is None or order['status'] == selected_status)
        and order['status'] != 'Отклонен'  # Не показываем отклоненные заказы
    }
    
    for order_id, order in filtered_orders.items():
        button_text = f"Заказ #{order_id} - {order['status']}"
        buttons.append([{"text": button_text, "callback_data": f"view_order_{order_id}"}])
    
    buttons.append([
        {"text": "🔄 Обновить", "callback_data": callback.data},
        {"text": "🔙 Назад", "callback_data": "main_menu"}
    ])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    
    if not filtered_orders:
        orders_list += "Нет активных заказов"
    
    await callback.message.answer(orders_list, reply_markup=keyboard)
    await callback.answer()


@dp.callback_query(lambda c: c.data.startswith('view_order_'))
async def process_view_order(callback: types.CallbackQuery):
    """Обработчик просмотра деталей заказа"""
    try:
        await callback.message.delete()
    except Exception as e:
        print(f"Error deleting message: {e}")

    order_id = callback.data.replace('view_order_', '')
    order = orders_data.get(order_id)
    
    if order:
        # Форматируем детали заказа
        details = order['details']
        formatted_details = (
            f"📦 Заказ #{order_id}\n\n"
            f"Статус: {order['status']}\n"
            f"Пользователь: {order['user_id']}\n\n"
            f"Имя: {details['name']}\n"
            f"Фамилия: {details['surname']}\n"
            f"Телефон: {details['phone']}\n"
            f"Email: {details['email']}\n"
            f"Telegram: @{details['telegram']}\n"
            f"Адреса доставки: {details['address']}\n\n"
            f"Товары: {', '.join(item['name'] for item in details['items'])}\n"
            f"Сумма: {details['total']} zł\n"
        )
        
        await callback.message.answer(
            formatted_details,
            reply_markup=get_order_keyboard(order_id)
        )
    await callback.answer()


@dp.callback_query(lambda c: c.data.startswith(('accept_', 'reject_')))
async def process_order_action(callback: types.CallbackQuery):
    """Обработчик принятия/отклонения заказа"""
    try:
        await callback.message.delete()
    except Exception as e:
        print(f"Error deleting message: {e}")

    action, order_id = callback.data.split('_')
    order = orders_data.get(order_id)
    
    if order:
        if action == 'accept':
            order['status'] = 'Принят'
            await bot.send_message(
                chat_id=order['user_id'],
                text=f"✅ Ваш заказ #{order_id} принят и будет обработан!"
            )
        else:
            order['status'] = 'Отклонен'
            await bot.send_message(
                chat_id=order['user_id'],
                text=f"❌ Ваш заказ #{order_id} был отклонен."
            )
        
        buttons = [[
            {"text": "🔙 К списку заказов", "callback_data": "all_orders"},
            {"text": "🏠 В главное меню", "callback_data": "main_menu"}
        ]]
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback.message.answer(
            f"Заказ #{order_id} {order['status'].lower()}",
            reply_markup=keyboard
        )
    await callback.answer()


async def main():
    """Запуск бота"""
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
