/**
 * Telegram Bot Toko Online (Node.js + Telegraf)
 * Fitur:
 * - /start: sambutan + inline menu (Produk, Testimoni, Bantuan, Setting[admin])
 * - Auto order flow: pilih produk -> qty -> kirim alamat -> konfirmasi -> simpan order (JSON)
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

// =====================
// Konfigurasi ENV
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN belum di-set. Buat file .env berisi BOT_TOKEN=xxxx");
  process.exit(1);
}

// Admin IDs: format "123,456" (Telegram user id)
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => Number(s));

// Admin-only Setting menu
function isAdmin(ctx) {
  const id = ctx.from?.id;
  return Boolean(id && ADMIN_IDS.includes(id));
}

// =====================
// Data storage (JSON)
// =====================
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  if (!fs.existsSync(PRODUCTS_FILE)) {
    const defaultProducts = [
      { id: "P001", name: "Kaos Premium", price: 85000, stock: 50 },
      { id: "P002", name: "Hoodie Oversize", price: 185000, stock: 20 },
      { id: "P003", name: "Totebag Kanvas", price: 65000, stock: 35 }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
}

function loadProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
}

function loadOrders() {
  return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function rupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

// =====================
// Bot init
// =====================
ensureDataFiles();
const bot = new Telegraf(BOT_TOKEN);

// In-memory session sederhana (tanpa DB)
const sessions = new Map();
/**
 * session = {
 *   state: "IDLE" | "CHOOSING_PRODUCT" | "CHOOSING_QTY" | "WAITING_ADDRESS" | "CONFIRMING",
 *   cart: { productId, qty, address }
 * }
 */
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, { state: "IDLE", cart: {} });
  }
  return sessions.get(userId);
}

function resetSession(userId) {
  sessions.set(userId, { state: "IDLE", cart: {} });
}

// =====================
// UI: Main Menu
// =====================
function mainMenu(ctx) {
  const buttons = [
    [Markup.button.callback("🛍️ PRODUK", "MENU_PRODUK")],
    [Markup.button.callback("⭐ TESTIMONI", "MENU_TESTIMONI")],
    [Markup.button.callback("❓ BANTUAN", "MENU_BANTUAN")]
  ];

  if (isAdmin(ctx)) {
    buttons.push([Markup.button.callback("⚙️ SETTING (ADMIN)", "MENU_SETTING")]);
  }

  return Markup.inlineKeyboard(buttons);
}

// =====================
// Handlers
// =====================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  resetSession(userId);

  const name = ctx.from.first_name || "kak";
  const text =
    `Halo ${name}! 👋\n` +
    `Selamat datang di *Toko Online Bot*.\n\n` +
    `Silakan pilih menu di bawah ini:`;

  await ctx.reply(text, { parse_mode: "Markdown", ...mainMenu(ctx) });
});

// Menu clicks
bot.action("MENU_PRODUK", async (ctx) => {
  const userId = ctx.from.id;
  const session = getSession(userId);
  session.state = "CHOOSING_PRODUCT";
  session.cart = {};

  const products = loadProducts();
  const productButtons = products.map((p) => ([
    Markup.button.callback(
      `${p.name} — ${rupiah(p.price)}`,
      `PICK_PRODUCT:${p.id}`
    )
  ]));

  productButtons.push([Markup.button.callback("⬅️ Kembali", "BACK_TO_MAIN")]);

  await ctx.editMessageText(
    "Pilih produk yang ingin kamu order:",
    Markup.inlineKeyboard(productButtons)
  );

  await ctx.answerCbQuery();
});

bot.action("MENU_TESTIMONI", async (ctx) => {
  const text =
    "⭐ *Testimoni Pelanggan*\n\n" +
    "✅ \"Barangnya bagus, cepat sampai!\" — Rina\n" +
    "✅ \"Admin ramah, kualitas premium.\" — Dimas\n" +
    "✅ \"Repeat order, recommended!\" — Sari\n\n" +
    "Mau order? Klik *PRODUK* ya.";

  await ctx.editMessageText(text, { parse_mode: "Markdown", ...mainMenu(ctx) });
  await ctx.answerCbQuery();
});

bot.action("MENU_BANTUAN", async (ctx) => {
  const text =
    "❓ *Bantuan*\n\n" +
    "Cara order:\n" +
    "1) Klik *PRODUK*\n" +
    "2) Pilih produk & qty\n" +
    "3) Kirim alamat lengkap\n" +
    "4) Konfirmasi order\n\n" +
    "Butuh
