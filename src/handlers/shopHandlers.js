const items = require("@root/items.json");
const { getRepairCost } = require("@handlers/utils");

async function showRodShop(message, userData) {
  let shopText = "🛒 **CỬA HÀNG CẦN CÂU**\n\n🎣 **Các loại cần câu có thể nâng cấp:**\n";

  items.rods.forEach((r) => {
    shopText += `• 🔹 **Level ${r.level}** - ${r.name} — 💰 ${r.price} coins\n`;
  });

  shopText += `\n📈 Dùng lệnh \`!nangcapcan\` để nâng cấp cần câu của bạn.`;

  const rod = userData?.rod;
  if (rod?.broken) {
    const repairCost = getRepairCost(rod);
    shopText += `\n\n🛠️ **Cần câu của bạn đang bị hỏng!**\nSử dụng lệnh \`!suacancau\` để sửa với giá **${repairCost} coins**.`;
  }

  message.reply(shopText);
}

module.exports = {
  showRodShop,
};
