const { connect } = require("./db");

const collectionName = process.env.COOLDOWN_COLLECTION || "dev_cooldowns";

async function getUserCooldown(userId, action) {
  const collection = await connect(collectionName);
  const doc = await collection.findOne({ _id: userId });
  return doc?.[action] || 0;
}

async function setUserCooldown(userId, action, timestamp) {
  const collection = await connect(collectionName);
  await collection.updateOne({ _id: userId }, { $set: { [action]: timestamp } }, { upsert: true });
}

async function isOnCooldown(userId, action, cooldownMs) {
  const lastUsed = await getUserCooldown(userId, action);
  return Date.now() - lastUsed < cooldownMs;
}

async function getCooldownRemaining(userId, action, cooldownMs) {
  const lastUsed = await getUserCooldown(userId, action);
  return Math.max(0, cooldownMs - (Date.now() - lastUsed));
}

async function getCooldownTable() {
  const collection = await connect(collectionName);
  const docs = await collection.find({}).toArray();
  // return object with userId as key
  return docs.reduce((acc, doc) => {
    const { _id, ...actions } = doc;
    acc[_id] = actions;
    return acc;
  }, {});
}

module.exports = {
  getCooldownRemaining,
  isOnCooldown,
  setUserCooldown,
  getUserCooldown,
  getCooldownTable,
};
