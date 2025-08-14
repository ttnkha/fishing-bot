const fs = require("fs").promises;
const { existsSync } = require("fs");
const COOLDOWN_FILE = process.env.COOLDOWN_FILE;

async function readCooldowns() {
  try {
    if (!existsSync(COOLDOWN_FILE)) {
      await fs.writeFile(COOLDOWN_FILE, "{}", "utf8");
    }
    const raw = await fs.readFile(COOLDOWN_FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Error reading cooldown file:", err);
    return {};
  }
}

async function writeCooldowns(data) {
  await fs.writeFile(COOLDOWN_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function getUserCooldown(userId) {
  const data = await readCooldowns();
  return data[userId] || 0;
}

async function setUserCooldown(userId, timestamp) {
  const data = await readCooldowns();
  data[userId] = timestamp;
  await writeCooldowns(data);
}

async function isOnCooldown(userId, cooldownMs) {
  const lastUsed = await getUserCooldown(userId);
  return Date.now() - lastUsed < cooldownMs;
}

async function getCooldownRemaining(userId, cooldownMs) {
  const lastUsed = await getUserCooldown(userId);
  return Math.max(0, cooldownMs - (Date.now() - lastUsed));
}

module.exports = {
  getCooldownRemaining,
  isOnCooldown,
  setUserCooldown,
  getUserCooldown,
};
