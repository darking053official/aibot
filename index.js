const { Client, GatewayIntentBits, EmbedBuilder, Colors } = require("@jubbio/core");
const http = require("http");
const OpenAI = require("openai");

const TOKEN = process.env.BOT_TOKEN;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

// Cerebras OpenAI uyumlu client
const openai = new OpenAI({
  apiKey: CEREBRAS_API_KEY,
  baseURL: "https://api.cerebras.ai/v1",
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

// ─── GÜVENLİ MESAJ GÖNDERME (CHANNEL HATASI DÜZELTİLDİ) ────────────
async function guvenliGonder(hedefMesaj, embedIcerik) {
  try {
    await hedefMesaj.edit({ content: null, embeds: [embedIcerik] });
  } catch (editError) {
    console.log("⚠️ Edit başarısız, yeni mesaj deneniyor:", editError.message);
    try {
      // Jubbio'da channelId var, channel yok - doğrudan message.reply kullanalım
      await hedefMesaj.reply({ embeds: [embedIcerik] });
      await hedefMesaj.delete().catch(() => {});
    } catch (sendError) {
      console.log("❌ Reply de başarısız:", sendError.message);
      // Hiçbir şey yapma, en azından bot çökmez
    }
  }
}

async function guvenliYaziGonder(hedefMesaj, yazi) {
  try {
    await hedefMesaj.edit(yazi);
  } catch (editError) {
    console.log("⚠️ Edit başarısız, yeni mesaj deneniyor:", editError.message);
    try {
      await hedefMesaj.reply(yazi);
      await hedefMesaj.delete().catch(() => {});
    } catch (sendError) {
      console.log("❌ Reply de başarısız:", sendError.message);
    }
  }
}

// ─── CEREBRAS SORGULAMA (TÜRKÇE ZORUNLU) ─────────────────────────────
async function cerebrasSor(prompt) {
  const response = await openai.chat.completions.create({
    model: "llama3.1-8b",
    messages: [
      { 
        role: "system", 
        content: "Sen Türkçe konuşan bir yapay zeka asistanısın. Tüm cevaplarını SADECE Türkçe olarak ver. Asla başka dil kullanma. Samimi, doğal ve yardımsever bir ton kullan." 
      },
      { 
        role: "user", 
        content: prompt 
      }
    ],
    temperature: 0.7,
    max_completion_tokens: 1024,
  });
  
  return response.choices[0].message.content || "Cevap alınamadı.";
}

// ─── TEST FONKSİYONU ──────────────────────────────────────────────
async function testAPI() {
  console.log("🔍 Cerebras API test ediliyor...");
  try {
    const cevap = await cerebrasSor("Merhaba! Nasılsın?");
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

  // ─── AI SORU ──────────────────────────────────────────────────────
  if (cmd === "ai" || cmd === "sor") {
    if (!soru) {
      return message.reply("❌ **Soru yazmalısın!** `!ai <sorun>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🤖 **Düşünüyorum...**");
    
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
      
      await guvenliGonder(bekliyor, embed);
    } catch (error) {
      console.error("AI Hatası:", error.message);
      await guvenliYaziGonder(bekliyor, `❌ **Hata oluştu:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── SOHBET ───────────────────────────────────────────────────────
  if (cmd === "sohbet" || cmd === "chat") {
    if (!soru) {
      return message.reply("❌ **Bir şey yazmalısın!** `!sohbet <mesaj>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("💬 **Yazıyor...**");
    
    try {
      const cevap = await cerebrasSor(`Kısa ve samimi bir şekilde cevap ver: ${soru}`);
      await guvenliYaziGonder(bekliyor, `${cevap.slice(0, 1800)}\n━━━━━━━━━━━━━━━━━━\n📍 by DRK`);
    } catch (error) {
      await guvenliYaziGonder(bekliyor, `❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── YORUMLA ──────────────────────────────────────────────────────
  if (cmd === "yorumla") {
    if (!soru) {
      return message.reply("❌ **Yorumlanacak metin yaz!** `!yorumla <metin>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🔍 **Yorumluyorum...**");
    
    try {
      const cevap = await cerebrasSor(`Şu metni detaylıca yorumla, analiz et, ana fikrini ve önemli noktalarını belirt: ${soru}`);
      
      const embed = new EmbedBuilder()
        .setTitle("🔍 Metin Yorumlama")
        .setColor(Colors.Blue)
        .addFields(
          { name: "📄 Metin", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "💬 Yorum", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Cerebras Llama 3.1 8B • by DRK" })
        .setTimestamp();
      
      await guvenliGonder(bekliyor, embed);
    } catch (error) {
      await guvenliYaziGonder(bekliyor, `❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── ÖZETLE ───────────────────────────────────────────────────────
  if (cmd === "ozetle") {
    if (!soru) {
      return message.reply("❌ **Özetlenecek metin yaz!** `!ozetle <metin>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("📝 **Özetliyorum...**");
    
    try {
      const cevap = await cerebrasSor(`Şu metni kısa ve öz bir şekilde özetle, en önemli noktaları çıkar: ${soru}`);
      
      const embed = new EmbedBuilder()
        .setTitle("📝 Metin Özeti")
        .setColor(Colors.Green)
        .addFields(
          { name: "📄 Orijinal Metin", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "✂️ Özet", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Cerebras Llama 3.1 8B • by DRK" })
        .setTimestamp();
      
      await guvenliGonder(bekliyor, embed);
    } catch (error) {
      await guvenliYaziGonder(bekliyor, `❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── ÇEVİRİ ───────────────────────────────────────────────────────
  if (cmd === "cevir") {
    const dil = args[0];
    const metin = args.slice(1).join(" ");
    
    if (!dil || !metin) {
      return message.reply("❌ **Kullanım:** `!cevir <dil> <metin>`\nÖrnek: `!cevir İngilizce Merhaba dünya nasılsın`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🌐 **Çeviriyorum...**");
    
    try {
      const cevap = await cerebrasSor(`Şu metni ${dil} diline çevir. SADECE çeviriyi ver, başka hiçbir şey yazma, açıklama yapma: ${metin}`);
      
      const embed = new EmbedBuilder()
        .setTitle("🌐 Çeviri")
        .setColor(Colors.Yellow)
        .addFields(
          { name: "📥 Orijinal (Türkçe)", value: `\`\`\`${metin.slice(0, 500)}\`\`\``, inline: false },
          { name: `📤 Çeviri (${dil})`, value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Cerebras Llama 3.1 8B • by DRK" })
        .setTimestamp();
      
      await guvenliGonder(bekliyor, embed);
    } catch (error) {
      await guvenliYaziGonder(bekliyor, `❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── FİKİR ────────────────────────────────────────────────────────
  if (cmd === "fikir") {
    if (!soru) {
      return message.reply("❌ **Konu yaz!** `!fikir <konu>`\nÖrnek: `!fikir mobil uygulama`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("💡 **Fikir üretiyorum...**");
    
    try {
      const cevap = await cerebrasSor(`"${soru}" konusunda yaratıcı fikirler, öneriler ve ilham verici düşünceler paylaş. Maddeler halinde sırala.`);
      
      const embed = new EmbedBuilder()
        .setTitle("💡 Yaratıcı Fikirler")
        .setColor(Colors.Orange)
        .addFields(
          { name: "🎯 Konu", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "✨ Fikirler ve Öneriler", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "Cerebras Llama 3.1 8B • by DRK" })
        .setTimestamp();
      
      await guvenliGonder(bekliyor, embed);
    } catch (error) {
      await guvenliYaziGonder(bekliyor, `❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ─── PING ─────────────────────────────────────────────────────────
  if (cmd === "ping") {
    const start = Date.now();
    const m = await message.reply("🏓 Ölçülüyor...");
    const ping = Date.now() - start;
    await guvenliYaziGonder(m, `🏓 Pong! **${ping}ms**\n📍 by DRK`);
  }

  // ─── YARDIM ───────────────────────────────────────────────────────
  if (cmd === "aiyardim" || cmd === "aihelp" || cmd === "yardim" || cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Cerebras AI Bot Komutları")
      .setDescription("⚡ **Dünyanın en hızlı AI çipi** Cerebras Inference ile güçlendirilmiştir\nSaniyede 2.200 token hızında cevap verir")
      .setColor(Colors.Purple)
      .addFields(
        { name: "❓ !ai <soru>", value: "Yapay zekaya soru sor", inline: true },
        { name: "💬 !sohbet <mesaj>", value: "Bot ile sohbet et", inline: true },
        { name: "🔍 !yorumla <metin>", value: "Metni analiz et, yorumla", inline: true },
        { name: "📄 !ozetle <metin>", value: "Uzun metni özetle", inline: true },
        { name: "🌐 !cevir <dil> <metin>", value: "Metni başka dile çevir", inline: true },
        { name: "💡 !fikir <konu>", value: "Konu hakkında fikir üret", inline: true },
        { name: "🏓 !ping", value: "Bot gecikmesini göster", inline: true }
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
