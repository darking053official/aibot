const { Client, GatewayIntentBits, EmbedBuilder, Colors } = require("@jubbio/core");
const http = require("http");
const fetch = require("node-fetch");

const TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY; // Render'dan çekecek

// HTTP sunucu
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "online", bot: "AIBot" }));
}).listen(PORT);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// GÜNCEL Gemini sorgulama (gemini-2.0-flash ile)
async function geminiSor(prompt) {
  // ÇALIŞAN model - gemini-2.0-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("API Hata Detayı:", error);
    throw new Error(`API Hatası: ${response.status}`);
  }
  
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap alınamadı.";
}

// Test fonksiyonu
async function testAPI() {
  console.log("🔍 API test ediliyor...");
  try {
    const cevap = await geminiSor("Merhaba! Nasılsın?");
    console.log("✅ API çalışıyor! Cevap:", cevap);
  } catch (error) {
    console.error("❌ API hatası:", error.message);
  }
}

client.on("ready", () => {
  console.log(`✅ ${client.user?.username} hazır!`);
  console.log(`📊 ${client.guilds.size} sunucu`);
  console.log(`🤖 AI Bot Aktif | by DRK`);
  testAPI();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();
  const soru = args.join(" ");

  if (cmd === "ai" || cmd === "sor") {
    if (!soru) {
      return message.reply("❌ **Soru yazmalısın!** `!ai <sorun>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🤖 **Düşünüyorum...**");
    
    try {
      const cevap = await geminiSor(soru);
      
      const embed = new EmbedBuilder()
        .setTitle("🤖 Yapay Zeka")
        .setColor(Colors.Purple)
        .addFields(
          { name: "❓ Soru", value: `\`\`\`${soru.slice(0, 500)}\`\`\``, inline: false },
          { name: "💬 Cevap", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Gemini 2.0 Flash • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error("AI Hatası:", error.message);
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
      const cevap = await geminiSor(`Kısa ve samimi bir şekilde cevap ver: ${soru}`);
      await bekliyor.edit(`${cevap.slice(0, 1800)}\n📍 by DRK`);
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // YARDIM
  if (cmd === "aiyardim" || cmd === "aihelp") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 AI Bot Komutları")
      .setDescription("Gemini 2.0 Flash ile güçlendirilmiş yapay zeka botu")
      .setColor(Colors.Purple)
      .addFields(
        { name: "❓ !ai <soru>", value: "Yapay zekaya soru sor", inline: true },
        { name: "💬 !sohbet <mesaj>", value: "Sohbet et", inline: true },
        { name: "🔍 !yorumla <metin>", value: "Metni yorumla", inline: true },
        { name: "📄 !ozetle <metin>", value: "Metni özetle", inline: true },
        { name: "🌐 !cevir <dil> <metin>", value: "Metni çevir", inline: true },
        { name: "💡 !fikir <konu>", value: "Fikir üret", inline: true }
      )
      .setFooter({ text: "AI Bot • Gemini 2.0 Flash • by DRK" })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
