import os
from dotenv import load_dotenv
import json
import sqlite3
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters, ConversationHandler

load_dotenv()
TOKEN = os.getenv('BOT_TOKEN')

# Состояния разговора
(
    MAIN_MENU,
    ADD_PRODUCT_NAME,
    ADD_PRODUCT_PRICE,
    ADD_PRODUCT_CATEGORY,
    ADD_PRODUCT_IMAGE,
    EDIT_PRODUCT_SELECT,
    EDIT_PRODUCT_FIELD,
    EDIT_PRODUCT_VALUE,
    REMOVE_PRODUCT_CONFIRM,
) = range(9)

# Данные для временного хранения
product_data = {}

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

# Клавиатуры
def get_admin_keyboard():
    return ReplyKeyboardMarkup([
        ['➕ Добавить товар', '📝 Редактировать товар'],
        ['❌ Удалить товар', '📋 Список товаров'],
        ['🔙 Выйти из админ-панели']
    ], resize_keyboard=True)

def get_edit_field_keyboard():
    return ReplyKeyboardMarkup([
        ['Название', 'Цена'],
        ['Категория', 'Изображение'],
        ['🔙 Назад']
    ], resize_keyboard=True)

def get_categories_keyboard():
    return ReplyKeyboardMarkup([
        ['Люди', 'Одноразки'],
        ['Картриджи', 'Жидкости'],
        ['🔙 Назад']
    ], resize_keyboard=True)

# Команды администратора
async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update.effective_user.id):
        await update.message.reply_text("У вас нет прав для доступа к админ-панели.")
        return ConversationHandler.END

    await update.message.reply_text(
        "Добро пожаловать в админ-панель!\n\n"
        "Выберите действие:",
        reply_markup=get_admin_keyboard()
    )
    return MAIN_MENU

async def add_product_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Введите название товара:",
        reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
    )
    return ADD_PRODUCT_NAME

async def add_product_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    product_data['name'] = update.message.text
    await update.message.reply_text("Введите цену товара (только число):")
    return ADD_PRODUCT_PRICE

async def add_product_price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    try:
        price = float(update.message.text)
        product_data['price'] = price
        await update.message.reply_text(
            "Выберите категорию товара:",
            reply_markup=get_categories_keyboard()
        )
        return ADD_PRODUCT_CATEGORY
    except ValueError:
        await update.message.reply_text("Пожалуйста, введите корректную цену (только число):")
        return ADD_PRODUCT_PRICE

async def add_product_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    product_data['category'] = update.message.text
    await update.message.reply_text(
        "Отправьте ссылку на изображение товара:",
        reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
    )
    return ADD_PRODUCT_IMAGE

async def add_product_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    product_data['image'] = update.message.text
    
    try:
        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        c.execute(
            'INSERT INTO products (name, price, category, image) VALUES (?, ?, ?, ?)',
            (product_data['name'], product_data['price'], product_data['category'], product_data['image'])
        )
        conn.commit()
        conn.close()
        
        await update.message.reply_text(
            f"✅ Товар успешно добавлен!\n\n"
            f"Название: {product_data['name']}\n"
            f"Цена: {product_data['price']} zł\n"
            f"Категория: {product_data['category']}\n",
            reply_markup=get_admin_keyboard()
        )
        product_data.clear()
        return MAIN_MENU
    
    except Exception as e:
        await update.message.reply_text(
            f"❌ Ошибка при добавлении товара: {str(e)}",
            reply_markup=get_admin_keyboard()
        )
        return MAIN_MENU

async def edit_product_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    c.execute('SELECT id, name, price FROM products')
    products = c.fetchall()
    conn.close()
    
    if not products:
        await update.message.reply_text(
            "Нет доступных товаров для редактирования.",
            reply_markup=get_admin_keyboard()
        )
        return MAIN_MENU
    
    product_list = "\n".join([f"ID: {p[0]} - {p[1]} ({p[2]} zł)" for p in products])
    await update.message.reply_text(
        f"Список товаров:\n\n{product_list}\n\nВведите ID товара для редактирования:",
        reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
    )
    return EDIT_PRODUCT_SELECT

async def edit_product_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    try:
        product_id = int(update.message.text)
        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        c.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = c.fetchone()
        conn.close()
        
        if product:
            product_data['edit_id'] = product_id
            await update.message.reply_text(
                "Выберите поле для редактирования:",
                reply_markup=get_edit_field_keyboard()
            )
            return EDIT_PRODUCT_FIELD
        else:
            await update.message.reply_text("Товар с таким ID не найден. Попробуйте еще раз:")
            return EDIT_PRODUCT_SELECT
    
    except ValueError:
        await update.message.reply_text("Пожалуйста, введите корректный ID товара:")
        return EDIT_PRODUCT_SELECT

async def edit_product_field(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    field = update.message.text.lower()
    product_data['edit_field'] = field
    
    if field == 'категория':
        await update.message.reply_text(
            "Выберите новую категорию:",
            reply_markup=get_categories_keyboard()
        )
    else:
        await update.message.reply_text(
            f"Введите новое значение для поля '{field}':",
            reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
        )
    return EDIT_PRODUCT_VALUE

async def edit_product_value(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    try:
        field = product_data['edit_field']
        value = update.message.text
        
        if field == 'цена':
            value = float(value)
        
        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        
        field_map = {
            'название': 'name',
            'цена': 'price',
            'категория': 'category',
            'изображение': 'image'
        }
        
        sql_field = field_map.get(field)
        if sql_field:
            c.execute(
                f'UPDATE products SET {sql_field} = ? WHERE id = ?',
                (value, product_data['edit_id'])
            )
            conn.commit()
            conn.close()
            
            await update.message.reply_text(
                f"✅ Товар успешно обновлен!\n"
                f"Поле '{field}' изменено на '{value}'",
                reply_markup=get_admin_keyboard()
            )
            product_data.clear()
            return MAIN_MENU
        else:
            await update.message.reply_text(
                "❌ Неизвестное поле для редактирования",
                reply_markup=get_admin_keyboard()
            )
            return MAIN_MENU
    
    except ValueError:
        await update.message.reply_text(
            "Пожалуйста, введите корректное значение:",
            reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
        )
        return EDIT_PRODUCT_VALUE
    except Exception as e:
        await update.message.reply_text(
            f"❌ Ошибка при обновлении товара: {str(e)}",
            reply_markup=get_admin_keyboard()
        )
        return MAIN_MENU

async def remove_product_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    c.execute('SELECT id, name, price FROM products')
    products = c.fetchall()
    conn.close()
    
    if not products:
        await update.message.reply_text(
            "Нет доступных товаров для удаления.",
            reply_markup=get_admin_keyboard()
        )
        return MAIN_MENU
    
    product_list = "\n".join([f"ID: {p[0]} - {p[1]} ({p[2]} zł)" for p in products])
    await update.message.reply_text(
        f"Список товаров:\n\n{product_list}\n\nВведите ID товара для удаления:",
        reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
    )
    return REMOVE_PRODUCT_CONFIRM

async def remove_product_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == '🔙 Назад':
        return await show_admin_menu(update, context)
    
    try:
        product_id = int(update.message.text)
        conn = sqlite3.connect('shop.db')
        c = conn.cursor()
        c.execute('DELETE FROM products WHERE id = ?', (product_id,))
        
        if c.rowcount > 0:
            conn.commit()
            await update.message.reply_text(
                f"✅ Товар с ID {product_id} успешно удален!",
                reply_markup=get_admin_keyboard()
            )
        else:
            await update.message.reply_text(
                f"❌ Товар с ID {product_id} не найден.",
                reply_markup=get_admin_keyboard()
            )
        
        conn.close()
        return MAIN_MENU
    
    except ValueError:
        await update.message.reply_text(
            "Пожалуйста, введите корректный ID товара:",
            reply_markup=ReplyKeyboardMarkup([['🔙 Назад']], resize_keyboard=True)
        )
        return REMOVE_PRODUCT_CONFIRM

async def list_products(update: Update, context: ContextTypes.DEFAULT_TYPE):
    conn = sqlite3.connect('shop.db')
    c = conn.cursor()
    c.execute('SELECT id, name, price, category FROM products')
    products = c.fetchall()
    conn.close()
    
    if not products:
        await update.message.reply_text(
            "Список товаров пуст.",
            reply_markup=get_admin_keyboard()
        )
        return MAIN_MENU
    
    product_list = "\n\n".join([
        f"ID: {p[0]}\n"
        f"Название: {p[1]}\n"
        f"Цена: {p[2]} zł\n"
        f"Категория: {p[3]}"
        for p in products
    ])
    
    await update.message.reply_text(
        f"📋 Список товаров:\n\n{product_list}",
        reply_markup=get_admin_keyboard()
    )
    return MAIN_MENU

async def show_admin_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Выберите действие:",
        reply_markup=get_admin_keyboard()
    )
    return MAIN_MENU

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Действие отменено. Вы вышли из админ-панели.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END

# Вспомогательные функции
async def is_admin(user_id: int) -> bool:
    admin_ids = [123456789]  # Замените на реальные ID администраторов
    return user_id in admin_ids

def main():
    init_db()
    
    application = Application.builder().token(TOKEN).build()

    # Создаем обработчик разговора для админ-панели
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('admin', admin_panel)],
        states={
            MAIN_MENU: [
                MessageHandler(filters.Regex('^➕ Добавить товар$'), add_product_start),
                MessageHandler(filters.Regex('^📝 Редактировать товар$'), edit_product_start),
                MessageHandler(filters.Regex('^❌ Удалить товар$'), remove_product_start),
                MessageHandler(filters.Regex('^📋 Список товаров$'), list_products),
                MessageHandler(filters.Regex('^🔙 Выйти из админ-панели$'), cancel),
            ],
            ADD_PRODUCT_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, add_product_name)
            ],
            ADD_PRODUCT_PRICE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, add_product_price)
            ],
            ADD_PRODUCT_CATEGORY: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, add_product_category)
            ],
            ADD_PRODUCT_IMAGE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, add_product_image)
            ],
            EDIT_PRODUCT_SELECT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, edit_product_select)
            ],
            EDIT_PRODUCT_FIELD: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, edit_product_field)
            ],
            EDIT_PRODUCT_VALUE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, edit_product_value)
            ],
            REMOVE_PRODUCT_CONFIRM: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, remove_product_confirm)
            ],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    application.add_handler(conv_handler)
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
