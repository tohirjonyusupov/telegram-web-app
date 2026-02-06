import "dotenv/config";
import { Telegraf, Markup } from "telegraf";

// WebAppdan keladigan payload turlari
type XoResultPayload = {
  type: "xo_result";
  winner: "X" | "O" | "draw" | null;
  board: Array<"X" | "O" | null>;
  finishedAt?: string;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const BOT_TOKEN = mustEnv("BOT_TOKEN");
const WEBAPP_URL = mustEnv("WEBAPP_URL");

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(
    "XO o‘yinini ochish uchun tugmani bosing 👇",
    Markup.inlineKeyboard([Markup.button.webApp("🎮 XO o‘yini", WEBAPP_URL)])
  );
});

// Qo‘shimcha: /app buyrug‘i ham bo‘lsin
bot.command("app", async (ctx) => {
  await ctx.reply(
    "Web App 👇",
    Markup.inlineKeyboard([Markup.button.webApp("🎮 XO o‘yini", WEBAPP_URL)])
  );
});

// WebAppdan kelgan data: ctx.message.web_app_data.data
bot.on("message", async (ctx) => {
  const msg: any = ctx.message;
  const data: string | undefined = msg?.web_app_data?.data;
  if (!data) return;

  try {
    const payload = JSON.parse(data) as XoResultPayload;

    if (payload.type !== "xo_result") {
      await ctx.reply("Noma’lum payload turi keldi 🤔");
      return;
    }

    const w = payload.winner;
    const text =
      w === "draw" ? "Durrang 😄" : w ? `G‘olib: ${w} ✅` : "O‘yin tugamagan 🤔";

    await ctx.reply(`Natija: ${text}`);
  } catch (e) {
    await ctx.reply("JSON parse xato 😅 WebApp noto‘g‘ri data yubordi.");
  }
});

bot.catch((err) => {
  console.error("BOT ERROR:", err);
});

bot.launch().then(() => console.log("Bot running..."));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
