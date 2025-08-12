const fs = require("fs").promises;
const { existsSync } = require("fs");

const DATA_PATH = "./data/players.json";

async function loadData() {
  if (!existsSync(DATA_PATH)) {
    await fs.writeFile(DATA_PATH, "{}");
  }
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

async function saveData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  loadData,
  saveData,
};
