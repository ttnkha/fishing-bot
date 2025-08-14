const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || "dev_db";

let client;
let collection;

async function connect(collectionName) {
  if (collection) return collection;

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
  }

  collection = client.db(dbName).collection(collectionName);
  return collection;
}

module.exports = {
  connect,
};
