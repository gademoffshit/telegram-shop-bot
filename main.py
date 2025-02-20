from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from datetime import datetime
import logging
import os
import json
from dotenv import load_dotenv
import asyncio
import uuid

# Загрузка переменных окружения
load_dotenv()

# Инициализация бота и диспетчера
bot = Bot(token='5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo')
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# URL вашего веб-приложения
WEBAPP_URL = "https://gademoffshit.github.io/telegram-shop-bot/"

# ID администратора
ADMIN_ID = 7356161144

# Словари для хранения данных
orders_data = {}
pending_orders = {}
admin_referral_stats = {}
admin_ref_usernames = {}

# Состояния
class PaymentStates(StatesGroup):
    waiting_for_receipt = State()

# Создаем папку для квитанций если её нет
if not os.path.exists('receipts'):
    os.makedirs('receipts')

def get_main_keyboard():
    """Создаем основную клавиатуру"""
    buttons = [
        [{"text": "🛍 Сделать заказ", "web_app": {"url": WEBAPP_URL}}],
        [{"text": "❓ Помощь", "callback_data": "help"}],
        [{"text": "ℹ️ О нас", "callback_data": "about_us"}]
    ]
    return types.InlineKeyboardMarkup(inline_keyboard=buttons)

def get_payment_keyboard():
    """Создаем клавиатуру для выбора способа оплаты"""
    buttons = [
        [{"text": "Monobank", "callback_data": "pay_mono"}],
        [{"text": "Blik", "callback_data": "pay_blik"}],
        [{"text": "Crypto trc-20", "callback_data": "pay_crypto"}],
        [{"text": "Отправить квитанцию", "callback_data": "send_receipt"}],
        [{"text": "◀️ Назад", "callback_data": "back_to_order"}]
    ]
    return types.InlineKeyboardMarkup(inline_keyboard=buttons)

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
    return types.InlineKeyboardMarkup(inline_keyboard=buttons)

def get_order_keyboard(order_id: str):
    """Создание клавиатуры для конкретного заказа"""
    buttons = [
        [
            {"text": "✅ Принять", "callback_data": f"accept_{order_id}"},
            {"text": "❌ Отклонить", "callback_data": f"reject_{order_id}"}
        ],
        [{"text": "🔙 Назад", "callback_data": "back_to_orders"}]
    ]
    return types.InlineKeyboardMarkup(inline_keyboard=buttons)

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

# Основные обработчики
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "👋 Добро пожаловать в наш магазин!\n"
        "Выберите действие:",
        reply_markup=get_main_keyboard()
    )

@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if str(message.from_user.id) == str(ADMIN_ID):
        await message.answer(
            "🔐 Панель администратора",
            reply_markup=get_admin_keyboard()
        )
    else:
        await message.answer("⛔️ У вас нет доступа к панели администратора")

@dp.callback_query(lambda c: c.data == "help")
async def process_help(callback: types.CallbackQuery):
    help_text = (
        "🛍 <b>Как сделать заказ:</b>\n\n"
        "1. Нажмите кнопку 'Сделать заказ'\n"
        "2. Выберите товары\n"
        "3. Оформите заказ\n"
        "4. Выберите способ оплаты\n"
        "5. Загрузите квитанцию\n\n"
        "❓ Есть вопросы? Пишите: @odnorazki_wrot"
    )
    await callback.message.edit_text(
        help_text,
        parse_mode="HTML",
        reply_markup=get_main_keyboard()
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data == "about_us")
async def process_about(callback: types.CallbackQuery):
    about_text = (
        "🏪 <b>О нашем магазине</b>\n\n"
        "Мы предлагаем широкий ассортимент товаров высокого качества.\n\n"
        "✅ Быстрая доставка\n"
        "✅ Надежная упаковка\n"
        "✅ Гарантия качества\n"
        "✅ Поддержка 24/7\n\n"
        "📞 Контакты: @odnorazki_wro"
    )
    await callback.message.edit_text(
        about_text,
        parse_mode="HTML",
        reply_markup=get_main_keyboard()
    )
    await callback.answer()

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
    keyboard = types.InlineKeyboardMarkup(inline_keyboard=buttons)

    await callback.message.edit_text(
        f"Реквізити для оплати:\n\n{payment_info[payment_method]}\n\n"
        "Після оплати натисніть кнопку 'Я сплатив'",
        reply_markup=keyboard
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data == "payment_done")
async def process_payment_confirmation(callback: types.CallbackQuery):
    """Обработчик подтверждения оплаты"""
    # Запрашиваем квитанцию
    await callback.message.edit_text(
        "❗️ Для подтверждения оплаты необходимо прикрепить квитанцию.\n\n"
        "📎 Пожалуйста, отправьте фото или файл квитанции об оплате.\n"
        "✅ Поддерживаемые форматы: jpg, png, pdf",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [{"text": "📤 Отправить квитанцию", "callback_data": "send_receipt"}],
            [{"text": "◀️ Назад к способам оплаты", "callback_data": "back_to_payment"}]
        ])
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data == "back_to_payment")
async def back_to_payment(callback: types.CallbackQuery):
    """Обработчик кнопки возврата к выбору способа оплаты"""
    await callback.message.edit_text(
        "Выберите способ оплаты:",
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
    keyboard = types.InlineKeyboardMarkup(inline_keyboard=buttons)
    
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
    
    keyboard = types.InlineKeyboardMarkup(inline_keyboard=buttons)
    
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
        keyboard = types.InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback.message.answer(
            f"Заказ #{order_id} {order['status'].lower()}",
            reply_markup=keyboard
        )
    await callback.answer()

@dp.callback_query(lambda c: c.data == 'send_receipt')
async def request_receipt(callback_query: types.CallbackQuery, state: FSMContext):
    await state.set_state(PaymentStates.waiting_for_receipt)
    await callback_query.message.edit_text(
        "📄 Пожалуйста, отправьте фото или файл квитанции об оплате.\n"
        "❗️ Поддерживаемые форматы: jpg, png, pdf\n\n"
        "Для отмены нажмите /cancel"
    )

@dp.message(lambda message: message.content_type in ['document', 'photo'], PaymentStates.waiting_for_receipt)
async def handle_receipt(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    
    try:
        # Создаем папку для пользователя если её нет
        user_folder = f'receipts/{user_id}'
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)
        
        # Генерируем имя файла
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if message.document:
            # Проверяем расширение файла
            file_ext = os.path.splitext(message.document.file_name)[1].lower()
            if file_ext not in ['.jpg', '.jpeg', '.png', '.pdf']:
                await message.reply(
                    "❌ Неподдерживаемый формат файла.\n"
                    "Пожалуйста, отправьте файл в формате jpg, png или pdf."
                )
                return
            
            # Сохраняем документ
            file_id = message.document.file_id
            file = await bot.get_file(file_id)
            file_path = f"{user_folder}/{timestamp}{file_ext}"
            await bot.download_file(file.file_path, file_path)
            
        elif message.photo:
            # Берем фото максимального размера
            photo = message.photo[-1]
            file_id = photo.file_id
            file = await bot.get_file(file_id)
            file_path = f"{user_folder}/{timestamp}.jpg"
            await bot.download_file(file.file_path, file_path)
        
        # Отправляем уведомление администратору
        admin_message = (
            f"📥 Получена новая квитанция об оплате\n\n"
            f"👤 От пользователя: {message.from_user.username or message.from_user.id}\n"
            f"🕒 Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}"
        )
        
        # Создаем клавиатуру для админа
        keyboard = types.InlineKeyboardMarkup(inline_keyboard=[[
            types.InlineKeyboardButton(text="✅ Подтвердить", callback_data=f"approve_payment_{user_id}"),
            types.InlineKeyboardButton(text="❌ Отклонить", callback_data=f"reject_payment_{user_id}")
        ]])
        
        # Пересылаем файл админу
        if message.document:
            await bot.send_document(ADMIN_ID, message.document.file_id, caption=admin_message, reply_markup=keyboard)
        else:
            await bot.send_photo(ADMIN_ID, photo.file_id, caption=admin_message, reply_markup=keyboard)
        
        # Отправляем подтверждение пользователю
        await message.reply(
            "✅ Квитанция успешно отправлена!\n"
            "Ожидайте подтверждения от администратора.\n\n"
            "После проверки вы получите уведомление о статусе оплаты."
        )
        
        await state.clear()
        
    except Exception as e:
        logging.error(f"Error handling receipt: {e}")
        await message.reply(
            "❌ Произошла ошибка при обработке файла.\n"
            "Пожалуйста, попробуйте еще раз или обратитесь к администратору."
        )
        await state.clear()

@dp.callback_query(lambda c: c.data.startswith('approve_payment_'))
async def approve_payment(callback_query: types.CallbackQuery):
    user_id = int(callback_query.data.split('_')[2])
    
    await bot.send_message(
        user_id,
        "✅ Ваш платеж подтвержден!\n"
        "Спасибо за покупку!"
    )
    
    await callback_query.message.edit_caption(
        callback_query.message.caption + "\n\n✅ Платеж подтвержден",
        reply_markup=None
    )

@dp.callback_query(lambda c: c.data.startswith('reject_payment_'))
async def reject_payment(callback_query: types.CallbackQuery):
    user_id = int(callback_query.data.split('_')[2])
    
    await bot.send_message(
        user_id,
        "❌ Ваш платеж отклонен.\n"
        "Пожалуйста, проверьте правильность оплаты и отправьте квитанцию повторно."
    )
    
    await callback_query.message.edit_caption(
        callback_query.message.caption + "\n\n❌ Платеж отклонен",
        reply_markup=None
    )

# Запуск бота
async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
