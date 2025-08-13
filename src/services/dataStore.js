const fs = require("fs").promises;
const { existsSync } = require("fs");
const dataFile = process.env.DATA_FILE;

async function loadData() {
  if (!existsSync(dataFile)) {
    await fs.writeFile(dataFile, "{}");
  }
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function saveData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  loadData,
  saveData,
};
