const { EmbedBuilder } = require("discord.js");

function msToTime(duration) {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes} phút ${seconds} giây`;
}

function createProgressBar(total, current, size = 10) {
  const progress = Math.floor((current / total) * size);
  const emptyProgress = size - progress;
  return `[${"█".repeat(progress)}${"░".repeat(emptyProgress)}]`;
}

function createCooldownEmbed(cooldownMs, cooldownRemaining) {
  const progressBar = createProgressBar(cooldownMs, cooldownMs - cooldownRemaining);
  const timeLeft = msToTime(cooldownRemaining);

  return new EmbedBuilder()
    .setColor("#FFA500")
    .setTitle("⏳ Lệnh đang cooldown")
    .setDescription(
      `Vui lòng đợi trước khi sử dụng lại lệnh.\n\n${progressBar}\nThời gian còn lại: **${timeLeft}**`
    )
    .setTimestamp();
}

module.exports = {
  createCooldownEmbed,
  msToTime,
  createProgressBar,
};
