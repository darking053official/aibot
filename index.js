const { Client, GatewayIntentBits, EmbedBuilder, Colors } = require("@jubbio/core");
const http = require("http");
const fetch = require("node-fetch");

const TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = "process.env.GEMINI_API_KEY"; // Direkt yazdım

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

// Bot başlangıç zamanı
const botStartTime = Date.now();

// Gemini AI sorgulama (DÜZELTİLMİŞ)
async function geminiSor(prompt) {
  // Yeni model adı: gemini-1.5-pro veya gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Hatası: ${response.status}`);
  }
  
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap alınamadı.";
}

client.on("ready", () => {
  console.log(`✅ ${client.user?.username} hazır!`);
  console.log(`📊 ${client.guilds.size} sunucu`);
  console.log(`🤖 AI Bot Aktif | by DRK`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();
  const soru = args.join(" ");

  // ─── YAPAY ZEKA SORU ─────────────────────────────────────────
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
        .setFooter({ text: "Gemini AI • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error("AI Hatası:", error.message);
      await bekliyor.edit(`❌ **Hata oluştu:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── SOYBOT (KISA CEVAP) ──────────────────────────────────────
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

  // ─── YORUMLA (METİN ANALİZİ) ──────────────────────────────────
  if (cmd === "yorumla") {
    if (!soru) {
      return message.reply("❌ **Yorumlanacak metin yaz!** `!yorumla <metin>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🔍 **Yorumlanıyor...**");
    
    try {
      const cevap = await geminiSor(`Şu metni kısaca yorumla ve analiz et: "${soru}"`);
      
      const embed = new EmbedBuilder()
        .setTitle("🔍 Metin Yorumlama")
        .setColor(Colors.Blue)
        .addFields(
          { name: "📝 Metin", value: `\`\`\`${soru.slice(0, 500)}\`\`\``, inline: false },
          { name: "💡 Yorum", value: `\`\`\`${cevap.slice(0, 1000)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Gemini AI • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── ÖZETLE ───────────────────────────────────────────────────
  if (cmd === "ozetle") {
    if (!soru) {
      return message.reply("❌ **Özetlenecek metin yaz!** `!ozetle <metin>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("📄 **Özetleniyor...**");
    
    try {
      const cevap = await geminiSor(`Şu metni 2-3 cümleyle özetle: "${soru}"`);
      
      const embed = new EmbedBuilder()
        .setTitle("📄 Metin Özeti")
        .setColor(Colors.Green)
        .addFields(
          { name: "📝 Orijinal", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "📋 Özet", value: `\`\`\`${cevap.slice(0, 500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Gemini AI • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── ÇEVİR ────────────────────────────────────────────────────
  if (cmd === "cevir") {
    if (args.length < 2) {
      return message.reply("❌ **Kullanım:** `!cevir <dil> <metin>`\nÖrnek: `!cevir ingilizce merhaba`\n📍 by DRK");
    }
    
    const dil = args[0];
    const metin = args.slice(1).join(" ");
    
    const bekliyor = await message.reply(`🌐 **${dil} diline çevriliyor...**`);
    
    try {
      const cevap = await geminiSor(`"${metin}" metnini ${dil} diline çevir. Sadece çeviriyi yaz.`);
      
      const embed = new EmbedBuilder()
        .setTitle("🌐 Çeviri")
        .setColor(Colors.Aqua)
        .addFields(
          { name: "📝 Orijinal", value: `\`\`\`${metin}\`\`\``, inline: false },
          { name: `🗣️ ${dil.toUpperCase()}`, value: `\`\`\`${cevap.slice(0, 500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Gemini AI • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── FİKİR ÜRET ───────────────────────────────────────────────
  if (cmd === "fikir") {
    if (!soru) {
      return message.reply("❌ **Konu yaz!** `!fikir <konu>`\nÖrnek: `!fikir yapay zeka`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("💡 **Fikir üretiliyor...**");
    
    try {
      const cevap = await geminiSor(`${soru} hakkında 5 yaratıcı fikir üret. Madde madde yaz.`);
      
      const embed = new EmbedBuilder()
        .setTitle("💡 Fikir Üretici")
        .setDescription(`**Konu:** ${soru}`)
        .setColor(Colors.Gold)
        .addFields({ name: "📋 Fikirler", value: `\`\`\`${cevap.slice(0, 1000)}\`\`\``, inline: false })
        .setFooter({ text: "Gemini AI • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── YARDIM ────────────────────────────────────────────────────
  if (cmd === "aiyardim" || cmd === "aihelp") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 AI Bot Komutları")
      .setDescription("Gemini AI ile güçlendirilmiş yapay zeka botu")
      .setColor(Colors.Purple)
      .addFields(
        { name: "❓ !ai <soru>", value: "Yapay zekaya soru sor", inline: true },
        { name: "💬 !sohbet <mesaj>", value: "Sohbet et", inline: true },
        { name: "🔍 !yorumla <metin>", value: "Metni yorumla", inline: true },
        { name: "📄 !ozetle <metin>", value: "Metni özetle", inline: true },
        { name: "🌐 !cevir <dil> <metin>", value: "Metni çevir", inline: true },
        { name: "💡 !fikir <konu>", value: "Fikir üret", inline: true }
      )
      .setFooter({ text: "AI Bot • Gemini AI • by DRK" })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
