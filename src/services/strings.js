const messages = {
  alreadyStarted: "Bạn đã bắt đầu trò chơi rồi!",
  startSuccess: "🎉 Bắt đầu thành công! Hãy dùng `!dao` để tìm mồi.",
  notStarted: "Bạn chưa bắt đầu trò chơi. Dùng `!batdau` để bắt đầu.",
  noBait: "Bạn không có mồi để câu cá. Hãy dùng `!dao` để tìm mồi.",
  miss: "Rất tiếc! Cá đã thoát mất.",
  notFoundFish: (fishName) => `Không thể bán cá "${fishName}" vì không tìm thấy thông tin giá.`,
  noFishInBag: (fishName) => `Bạn không có cá tên "${fishName}" trong túi.`,
  sellSuccess: (fish, price, quantity, totalEarned) =>
    `Bạn đã bán thành công **${quantity} ${fish}** với giá ${price} coins. Tổng nhận được: **${totalEarned} coins**!`,
  foundBait: (bait) => `Bạn tìm được mồi **${bait.name}** (Độ hiếm: ${bait.rarity})!`,
  foundTrash: (trash) => `Bạn tìm được rác: ${trash.name}...`,
  foundRareBait: (bait) => `Bạn rất may mắn! Nhặt được mồi hiếm **${bait.name}**!`,
  caughtFish: (fishName) => `Bạn câu được **${fishName}**! 🎣`,
  upgradeSuccess: (rodName, price) =>
    `Chúc mừng! Bạn đã nâng cấp cần câu lên **${rodName}** với giá ${price} coins.`,
  alreadyMaxRod: "Bạn đã sở hữu cần câu cao cấp nhất!",
  notEnoughCoins: (needed) => `Bạn cần thêm ${needed} coins để nâng cấp.`,
  rodRepairSuccess: "✅ Bạn đã sửa thành công cần câu!",
  rodRepairNotBroken: "🔧 Cần câu của bạn chưa bị hỏng.",
  rodRepairNotEnoughCoins: (cost) => `💰 Bạn cần ${cost} xu để sửa cần câu.`,
  noFishToSell: "Bạn không có cá nào trong túi.",
  selectFishToSell: "🎣 Chọn cá bạn muốn bán:",
  sellTimeout: "⏰ Hết thời gian chọn cá.",
  waitMessage: (unblockTime) => `Đ mệt hả trời 🫩, ${unblockTime} mở block.`,
};

module.exports = {
  messages,
};
