const { connect } = require("./db");

const collectionName = process.env.DATA_COLLECTION || "dev_data";

async function loadData(id) {
  const collection = await connect(collectionName);
  const doc = await collection.findOne({ _id: id });
  return doc?.value;
}

async function saveData(id, data) {
  const collection = await connect(collectionName);
  await collection.updateOne({ _id: id }, { $set: { value: data } }, { upsert: true });
}

module.exports = {
  loadData,
  saveData,
};
