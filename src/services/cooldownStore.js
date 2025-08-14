const fs = require("fs").promises;
const { existsSync } = require("fs");
const COOLDOWN_FILE = process.env.COOLDOWN_FILE;

async function readCooldowns() {
  if (!existsSync(COOLDOWN_FILE)) {
    await fs.writeFile(COOLDOWN_FILE, "{}", "utf8");
  }
  const raw = await fs.readFile(COOLDOWN_FILE, "utf8");
  return JSON.parse(raw || "{}");
}

async function writeCooldowns(data) {
  await fs.writeFile(COOLDOWN_FILE, JSON.stringify(data, null, 2));
}

async function getUserCooldown(userId, action) {
  const data = await readCooldowns();
  return data[userId]?.[action] || 0;
}

async function setUserCooldown(userId, action, timestamp) {
  const data = await readCooldowns();
  if (!data[userId]) data[userId] = {};
  data[userId][action] = timestamp;
  await writeCooldowns(data);
}

async function isOnCooldown(userId, action, cooldownMs) {
  const lastUsed = await getUserCooldown(userId, action);
  console.log("===>", userId, action, lastUsed);
  return Date.now() - lastUsed < cooldownMs;
}

async function getCooldownRemaining(userId, action, cooldownMs) {
  const lastUsed = await getUserCooldown(userId, action);
  return Math.max(0, cooldownMs - (Date.now() - lastUsed));
}

module.exports = {
  getCooldownRemaining,
  isOnCooldown,
  setUserCooldown,
  getUserCooldown,
};
