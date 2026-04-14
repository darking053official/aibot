const { Client, GatewayIntentBits, EmbedBuilder, Colors } = require("@jubbio/core");
const http = require("http");
const OpenAI = require("openai");

const TOKEN = process.env.BOT_TOKEN;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

// Cerebras OpenAI uyumlu client
const openai = new OpenAI({
  apiKey: CEREBRAS_API_KEY,
  baseURL: "https://api.cerebras.ai/v1", // Cerebras API endpoint'i [citation:2][citation:5]
});

// ─── HTTP SUNUCU (Render için) ─────────────────────────────────────
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "online", 
      bot: client.user?.username || "AIBot",
      uptime: process.uptime(),
      guilds: client.guilds?.size || 0
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP sunucu ${PORT} portunda çalışıyor`);
});

// ─── CLIENT ───────────────────────────────────────────────────────
const client = new Client({
  intents: 3276799 // Tüm intent'ler
});

// ─── CEREBRAS SORGULAMA ─────────────────────────────────────────────
async function cerebrasSor(prompt) {
  const response = await openai.chat.completions.create({
    model: "llama3.1-8b", // Cerebras'ın ücretsiz modeli, 2,200 token/saniye hız [citation:1][citation:8]
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_completion_tokens: 1024,
  });
  
  return response.choices[0].message.content || "Cevap alınamadı.";
}

// ─── TEST FONKSİYONU ──────────────────────────────────────────────
async function testAPI() {
  console.log("🔍 Cerebras API test ediliyor...");
  try {
    const cevap = await cerebrasSor("Merhaba!");
    console.log("✅ Cerebras API çalışıyor! Cevap:", cevap.substring(0, 50) + "...");
  } catch (error) {
    console.error("❌ Cerebras API hatası:", error.message);
  }
}

// ─── READY OLAYI ──────────────────────────────────────────────────
client.on("ready", () => {
  console.log(`✅ ${client.user?.username} hazır!`);
  console.log(`📊 ${client.guilds.size} sunucu`);
  console.log(`🆔 Bot ID: ${client.user?.id}`);
  console.log(`🤖 Cerebras AI Bot Aktif | by DRK`);
  testAPI();
});

// ─── MESAJ OLAYI ──────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();
  const soru = args.join(" ");

  // AI SORU
  if (cmd === "ai" || cmd === "sor") {
    if (!soru) {
      return message.reply("❌ **Soru yazmalısın!** `!ai <sorun>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🤖 **Cerebras düşünüyor...**");
    
    try {
      const cevap = await cerebrasSor(soru);
      
      const embed = new EmbedBuilder()
        .setTitle("🤖 Cerebras AI")
        .setColor(Colors.Purple)
        .addFields(
          { name: "❓ Soru", value: `\`\`\`${soru.slice(0, 500)}\`\`\``, inline: false },
          { name: "💬 Cevap", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Cerebras Llama 3.1 8B • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error("Cerebras Hatası:", error.message);
      await bekliyor.edit(`❌ **Hata oluştu:** ${error.message}\n📍 by DRK`);
    }
  }

  // SOHBET
  if (cmd === "sohbet" || cmd === "chat") {
    if (!soru) {
      return message.reply("❌ **Bir şey yazmalısın!** `!sohbet <mesaj>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("💬 **Yazıyor...**");
    
    try {
      const cevap = await cerebrasSor(`Kısa ve samimi bir şekilde cevap ver: ${soru}`);
      await bekliyor.edit(`${cevap.slice(0, 1800)}\n📍 by DRK`);
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // YARDIM
  if (cmd === "aiyardim" || cmd === "aihelp") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Cerebras AI Bot Komutları")
      .setDescription("⚡ Cerebras Inference (Dünyanın en hızlı AI çipi) ile güçlendirilmiştir [citation:1]")
      .setColor(Colors.Purple)
      .addFields(
        { name: "❓ !ai <soru>", value: "Cerebras'a soru sor", inline: true },
        { name: "💬 !sohbet <mesaj>", value: "Sohbet et", inline: true },
        { name: "🔍 !yorumla <metin>", value: "Metni yorumla", inline: true },
        { name: "📄 !ozetle <metin>", value: "Metni özetle", inline: true },
        { name: "🌐 !cevir <dil> <metin>", value: "Metni çevir", inline: true },
        { name: "💡 !fikir <konu>", value: "Fikir üret", inline: true }
      )
      .setFooter({ text: "Cerebras AI • Llama 3.1 8B • by DRK" })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
});

// ─── HATA YAKALAMA ────────────────────────────────────────────────
client.on("error", (err) => console.error("❌ Client error:", err.message));
process.on("unhandledRejection", (err) => console.error("❌ Unhandled rejection:", err));

// ─── BOTU BAŞLAT ──────────────────────────────────────────────────
console.log("🚀 Cerebras AI Bot başlatılıyor...");
client.login(TOKEN);
