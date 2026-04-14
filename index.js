const { Client, GatewayIntentBits, EmbedBuilder, Colors } = require("@jubbio/core");
const OpenAI = require("openai");

const TOKEN = process.env.BOT_TOKEN;
const API_KEY = process.env.LLMAPI_KEY || process.env.OPENAI_API_KEY;

// OpenAI client (LLMAPI.ai için)
const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://api.llmapi.ai/v1",
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// LLMAPI.ai sorgulama
async function llmapiSor(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }]
  });
  
  return response.choices[0].message.content || "Cevap alınamadı.";
}

// Test fonksiyonu
async function testAPI() {
  console.log("🔍 LLMAPI.ai test ediliyor...");
  try {
    const cevap = await llmapiSor("Merhaba!");
    console.log("✅ API çalışıyor! Cevap:", cevap.substring(0, 50) + "...");
  } catch (error) {
    console.error("❌ API hatası:", error.message);
  }
}

client.on("ready", () => {
  console.log(`✅ ${client.user?.username} hazır!`);
  console.log(`📊 ${client.guilds.cache.size} sunucu`);
  console.log(`🤖 AI Bot Aktif | by DRK`);
  testAPI();
});

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
    
    const bekliyor = await message.reply("🤖 **Düşünüyorum...**");
    
    try {
      const cevap = await llmapiSor(soru);
      
      const embed = new EmbedBuilder()
        .setTitle("🤖 Yapay Zeka")
        .setColor(Colors.Purple)
        .addFields(
          { name: "❓ Soru", value: `\`\`\`${soru.slice(0, 500)}\`\`\``, inline: false },
          { name: "💬 Cevap", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "GPT-4o • by DRK" })
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
      const cevap = await llmapiSor(`Kısa ve samimi bir şekilde cevap ver: ${soru}`);
      await bekliyor.edit(`${cevap.slice(0, 1800)}\n📍 by DRK`);
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // YORUMLA
  if (cmd === "yorumla") {
    if (!soru) {
      return message.reply("❌ **Yorumlanacak metin yaz!** `!yorumla <metin>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🔍 **Yorumluyorum...**");
    
    try {
      const cevap = await llmapiSor(`Şu metni detaylıca yorumla, analiz et: ${soru}`);
      
      const embed = new EmbedBuilder()
        .setTitle("🔍 Metin Yorumlama")
        .setColor(Colors.Blue)
        .addFields(
          { name: "📄 Metin", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "💬 Yorum", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "GPT-4o • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ÖZETLE
  if (cmd === "ozetle") {
    if (!soru) {
      return message.reply("❌ **Özetlenecek metin yaz!** `!ozetle <metin>`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("📝 **Özetliyorum...**");
    
    try {
      const cevap = await llmapiSor(`Şu metni kısa ve öz bir şekilde özetle: ${soru}`);
      
      const embed = new EmbedBuilder()
        .setTitle("📝 Metin Özeti")
        .setColor(Colors.Green)
        .addFields(
          { name: "📄 Orijinal", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "✂️ Özet", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "GPT-4o • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // ÇEVİRİ
  if (cmd === "cevir") {
    const dil = args[0];
    const metin = args.slice(1).join(" ");
    
    if (!dil || !metin) {
      return message.reply("❌ **Kullanım:** `!cevir <dil> <metin>`\nÖrnek: `!cevir İngilizce Merhaba dünya`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("🌐 **Çeviriyorum...**");
    
    try {
      const cevap = await llmapiSor(`Şu metni ${dil} diline çevir, sadece çeviriyi ver: ${metin}`);
      
      const embed = new EmbedBuilder()
        .setTitle("🌐 Çeviri")
        .setColor(Colors.Yellow)
        .addFields(
          { name: "📥 Orijinal", value: `\`\`\`${metin.slice(0, 500)}\`\`\``, inline: false },
          { name: `📤 ${dil}`, value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "GPT-4o • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // FİKİR
  if (cmd === "fikir") {
    if (!soru) {
      return message.reply("❌ **Konu yaz!** `!fikir <konu>`\nÖrnek: `!fikir mobil uygulama`\n📍 by DRK");
    }
    
    const bekliyor = await message.reply("💡 **Fikir üretiyorum...**");
    
    try {
      const cevap = await llmapiSor(`"${soru}" konusunda yaratıcı fikirler, öneriler ve ilham verici düşünceler paylaş:`);
      
      const embed = new EmbedBuilder()
        .setTitle("💡 Yaratıcı Fikirler")
        .setColor(Colors.Orange)
        .addFields(
          { name: "🎯 Konu", value: `\`\`\`${soru.slice(0, 300)}\`\`\``, inline: false },
          { name: "✨ Fikirler", value: `\`\`\`${cevap.slice(0, 1500)}\`\`\``, inline: false }
        )
        .setFooter({ text: "GPT-4o • by DRK" })
        .setTimestamp();
      
      await bekliyor.edit({ content: null, embeds: [embed] });
    } catch (error) {
      await bekliyor.edit(`❌ **Hata:** ${error.message}\n📍 by DRK`);
    }
  }

  // YARDIM
  if (cmd === "aiyardim" || cmd === "aihelp") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 AI Bot Komutları")
      .setDescription("GPT-4o ile güçlendirilmiş yapay zeka botu")
      .setColor(Colors.Purple)
      .addFields(
        { name: "❓ !ai <soru>", value: "Yapay zekaya soru sor", inline: true },
        { name: "💬 !sohbet <mesaj>", value: "Sohbet et", inline: true },
        { name: "🔍 !yorumla <metin>", value: "Metni yorumla", inline: true },
        { name: "📄 !ozetle <metin>", value: "Metni özetle", inline: true },
        { name: "🌐 !cevir <dil> <metin>", value: "Metni çevir", inline: true },
        { name: "💡 !fikir <konu>", value: "Fikir üret", inline: true }
      )
      .setFooter({ text: "AI Bot • GPT-4o • by DRK" })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
