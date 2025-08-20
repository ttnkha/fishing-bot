const items = require("@root/items.json");
const { getRepairCost } = require("@handlers/utils");

async function showRodShop(message, userData) {
  const currentRod = userData?.rod;
  const currentLevel = currentRod?.level || 1;
  const userCoins = userData?.coins || 0;

  let shopText = "🛒 **CỬA HÀNG CẦN CÂU**\n\n🎣 **Cần câu tiếp theo bạn có thể nâng cấp:**\n";

  // Only allow upgrading to the next level rod (one at a time)
  const nextRod = items.rods.find((r) => r.level === currentLevel + 1);

  if (!nextRod) {
    shopText += "• 🏁 Bạn đã sở hữu cần câu cấp cao nhất!\n";
  } else {
    const remaining = nextRod.price - userCoins;
    const remainingText = remaining > 0 ? `❗ Thiếu: ${remaining} coins` : `✅ Đủ tiền`;

    shopText += `• 🔹 **Level ${nextRod.level}** - ${nextRod.name} — 💰 ${nextRod.price} coins (${remainingText})\n`;
    shopText += `\n📈 Dùng lệnh \`!nangcapcan\` để nâng cấp lên cần câu này.`;
  }

  if (currentRod?.broken) {
    const repairCost = getRepairCost(currentRod);
    shopText += `\n\n🛠️ **Cần câu của bạn đang bị hỏng!**\nSử dụng lệnh \`!suacancau\` để sửa với giá **${repairCost} coins**.`;
  }

  message.editReply(shopText);
}

module.exports = {
  showRodShop,
};
