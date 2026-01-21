require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// Polling + sedikit setting timeout supaya lebih stabil
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: { interval: 300, params: { timeout: 30 } },
});

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
      { text: "🛍️𝗣𝗥𝗢𝗗𝗨𝗞", callback_data: "MENU_PRODUK" },
      { text: "⭐𝗧𝗘𝗦𝗧𝗜𝗠𝗢𝗡𝗜", callback_data: "MENU_TESTIMONI" },
    ],
    [{ text: "🆘𝗕𝗔𝗡𝗧𝗨𝗔𝗡", callback_data: "MENU_BANTUAN" }],
  ];

  // Tombol SETTING hanya untuk admin bot
  if (isAdmin(userId)) {
    keyboard.push([
      { text: "⚙️𝗦𝗘𝗧𝗧𝗜𝗡𝗚 (ᴀᴅᴍɪɴ ʙᴏᴛ)", callback_data: "MENU_SETTING" },
    ]);
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
    `👋Halo ${firstName} selamat datang di *Zodiak Store*\n\n` +
    `🛍Zodiak Store menyediakan produk digital terpercaya dengan proses cepat dan 100% pastinya aman. ` +
    `Kami berkomitmen memberikan pelayanan terbaik dengan harga kompetitif. ` +
    `Solusi belanja digital Anda hanya di Zodiak Store\n\n` +
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

// Biar error polling (mis. ECONNABORTED) tidak bikin bot “panik”
bot.on("polling_error", (err) => {
  console.log("polling_error:", err?.code || "", err?.message || err);
});

console.log("Bot berjalan...");
