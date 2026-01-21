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
    [{ text: "🛍️ PRODUK", callback_data: "MENU_PRODUK" }],
    [{ text: "⭐ TESTIMONI", callback_data: "MENU_TESTIMONI" }],
    [{ text: "🆘 BANTUAN", callback_data: "MENU_BANTUAN" }],
  ];

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

// Handler tombol inline
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  // Hilangkan "loading" pada tombol
  await bot.answerCallbackQuery(query.id);

  if (data === "MENU_PRODUK") {
    // contoh respon produk
    const text =
      "*Daftar Produk*\n" +
      "1) Produk A - Rp 10.000\n" +
      "2) Produk B - Rp 20.000\n\n" +
      "Ketik: /start untuk kembali ke menu.";
    return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  if (data === "MENU_TESTIMONI") {
    const text =
      "*Testimoni Pelanggan*\n" +
      "⭐️⭐️⭐️⭐️⭐️ Mantap, cepat sampai!\n" +
      "⭐️⭐️⭐️⭐️⭐️ Barang sesuai deskripsi.\n\n" +
      "Ketik: /start untuk kembali ke menu.";
    return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  if (data === "MENU_BANTUAN") {
    const text =
      "*Bantuan*\n" +
      "• Klik *PRODUK* untuk lihat katalog\n" +
      "• Klik *TESTIMONI* untuk lihat ulasan\n" +
      "• Jika butuh CS, balas pesan ini.\n\n" +
      "Ketik: /start untuk kembali ke menu.";
    return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  if (data === "MENU_SETTING") {
    if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, "Maaf, menu ini khusus admin.");
    }

    const text =
      "*SETTING (Admin)*\n" +
      "Contoh:\n" +
      "• Tambah produk\n" +
      "• Hapus produk\n" +
      "• Lihat pesanan\n\n" +
      "Ketik: /start untuk kembali ke menu.";
    return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  // fallback kalau callback_data tidak dikenal
  return bot.sendMessage(chatId, "Menu tidak dikenal. Ketik /start untuk kembali.");
});

// Log sederhana
console.log("Bot berjalan...");
