const items = require("@root/items.json");
const { getBait } = require("@logic/gameLogic");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");
const { DIG_COOLDOWN_MS } = require("@config/constants");
const { isOnCooldown, setUserCooldown } = require("@services/cooldowns.js");

async function handleDig(message, userData, id) {
  if (!userData) {
    return message.reply(messages.notStarted);
  }

  if (await isOnCooldown(id, "dig", DIG_COOLDOWN_MS)) {
    return message.reply(messages.waitMessage);
  }

  await setUserCooldown(id, "dig", Date.now());

  const roll = Math.random() * 100;
  const { type, bait, trash } = getBait(items, roll);

  switch (type) {
    case "common":
    case "rare": {
      const inventory = userData.bait || [];
      const existingBait = inventory.find((b) => b.name === bait.name);

      if (existingBait) {
        existingBait.quantity = (existingBait.quantity || 1) + 1;
      } else {
        bait.quantity = 1;
        inventory.push(bait);
      }
      userData.bait = inventory;
      await saveData(id, userData);

      if (type === "common") {
        return message.reply(messages.foundBait(bait));
      } else {
        return message.reply(messages.foundRareBait(bait));
      }
    }
    case "trash":
      return message.reply(messages.foundTrash(trash));
  }
}

module.exports = {
  handleDig,
};
