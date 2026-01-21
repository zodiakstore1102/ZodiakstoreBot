require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Admin ID (angka). Pastikan di .env benar.
const ADMIN_ID = Number(process.env.ADMIN_ID);

// Helper: cek admin
function isAdmin(userId) {
  return Number(userId) === ADMIN_ID;
}

// Helper: bikin keyboard /start (SETTING hanya admin)
function startKeyboard(userId) {
  const keyboard = [
    [
      { text: "🛍️ PRODUK", callback_data: "MENU_PRODUK" },
      { text: "⭐ TESTIMONI", callback_data: "MENU_TESTIMONI" },
    ],
    [{ text: "🆘 BANTUAN", callback_data: "MENU_BANTUAN" }],
  ];

  // Tombol SETTING hanya untuk admin bot
  if (isAdmin(userId)) {
    keyboard.push([{ text: "⚙️ SETTING (Admin)", callback_data: "MENU_SETTING" }]);
  }

  return {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  };
}

// /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "kak";

  const text =
    `Halo ${firstName} 👋\n` +
    `Selamat datang di *Toko Online*!\n\n` +
    `Silakan pilih menu di bawah ini:`;

  await bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    ...startKeyboard(userId),
  });
});

// Handler tombol inline (BELUM diberi fungsi)
bot.on("callback_query", async (query) => {
  // wajib supaya tombol tidak loading terus
  await bot.answerCallbackQuery(query.id);

  // sengaja tidak ada aksi apa pun untuk semua tombol
  // (nanti kalau sudah siap, baru kita isi fungsi per menu)
});

// Log sederhana
console.log("Bot berjalan...");
