const items = require("@root/items.json");
const { getRepairCost } = require("@handlers/utils");

async function showRodShop(message, userData) {
  const currentRod = userData?.rod;
  const currentLevel = currentRod?.level || 1;
  const userCoins = userData?.coins || 0;

  let shopText = "🛒 **CỬA HÀNG CẦN CÂU**\n\n🎣 **Các loại cần câu có thể nâng cấp:**\n";

  const availableUpgrades = items.rods.filter((r) => r.level > currentLevel);

  if (availableUpgrades.length === 0) {
    shopText += "• 🚫 Không có nâng cấp nào khả dụng cho cần câu của bạn.\n";
  } else {
    availableUpgrades.forEach((r) => {
      const remaining = r.price - userCoins;
      const remainingText = remaining > 0 ? `❗ Thiếu: ${remaining} coins` : `✅ Đủ tiền`;

      shopText += `• 🔹 **Level ${r.level}** - ${r.name} — 💰 ${r.price} coins (${remainingText})\n`;
    });
  }

  shopText += `\n📈 Dùng lệnh \`!nangcapcan\` để nâng cấp cần câu của bạn.`;

  if (currentRod?.broken) {
    const repairCost = getRepairCost(currentRod);
    shopText += `\n\n🛠️ **Cần câu của bạn đang bị hỏng!**\nSử dụng lệnh \`!suacancau\` để sửa với giá **${repairCost} coins**.`;
  }

  message.reply(shopText);
}

module.exports = {
  showRodShop,
};
