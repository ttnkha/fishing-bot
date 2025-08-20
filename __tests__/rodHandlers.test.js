const { handleUpgradeRod, fixRod } = require("@handlers/rodHandlers");
const items = require("@root/items.json");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");
const { getRepairCost } = require("@handlers/utils");

jest.mock("@services/data");
jest.mock("@services/strings");
jest.mock("@handlers/utils");

describe("handleUpgradeRod", () => {
  const userId = "user123";
  let message;

  beforeEach(() => {
    message = { editReply: jest.fn() };
    saveData.mockClear();
    message.editReply.mockClear();
  });

  it("should reply 'User data not found.' if no userData", async () => {
    await handleUpgradeRod(message, null, userId);
    expect(message.editReply).toHaveBeenCalledWith("User data not found.");
  });

  it("should reply already max rod if no next rod available", async () => {
    const userData = { rod: { level: 999 }, coins: 1000 };
    items.rods = [{ level: 1, price: 100 }]; // no rod with level 1000
    messages.alreadyMaxRod = "Max rod reached";

    await handleUpgradeRod(message, userData, userId);
    expect(message.editReply).toHaveBeenCalledWith("Max rod reached");
  });

  it("should reply not enough coins if user has insufficient coins", async () => {
    const userData = { rod: { level: 1 }, coins: 50 };
    const nextRod = { level: 2, price: 100, name: "SuperRod" };
    items.rods = [{ level: 1, price: 50 }, nextRod];
    messages.notEnoughCoins = (missing) => `Missing ${missing} coins`;

    await handleUpgradeRod(message, userData, userId);
    expect(message.editReply).toHaveBeenCalledWith("Missing 50 coins");
  });

  it("should upgrade rod, deduct coins, save data and reply success", async () => {
    const nextRod = { level: 2, price: 100, name: "SuperRod" };
    items.rods = [{ level: 1, price: 50 }, nextRod];
    const userData = { rod: { level: 1 }, coins: 200 };
    messages.upgradeSuccess = (name, price) => `Upgraded to ${name} for ${price}`;

    await handleUpgradeRod(message, userData, userId);

    expect(userData.coins).toBe(100);
    expect(userData.rod).toBe(nextRod);
    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(message.editReply).toHaveBeenCalledWith("Upgraded to SuperRod for 100");
  });
});

describe("fixRod", () => {
  const userId = "user123";
  let message;

  beforeEach(() => {
    message = { editReply: jest.fn() };
    saveData.mockClear();
    message.editReply.mockClear();
    getRepairCost.mockClear();
  });

  it("should reply error if no rod", async () => {
    await fixRod(message, {}, userId);
    expect(message.editReply).toHaveBeenCalledWith("❌ Bạn chưa có cần câu để sửa.");
  });

  it("should reply rod is not broken if rod.broken is false", async () => {
    const userData = { rod: { broken: false } };
    messages.rodRepairNotBroken = "Rod not broken";

    await fixRod(message, userData, userId);
    expect(message.editReply).toHaveBeenCalledWith("Rod not broken");
  });

  it("should reply not enough coins if user coins less than repair cost", async () => {
    const userData = { rod: { broken: true, level: 3 }, coins: 50 };
    getRepairCost.mockReturnValue(100);
    messages.rodRepairNotEnoughCoins = (cost) => `Need ${cost} coins`;

    await fixRod(message, userData, userId);
    expect(message.editReply).toHaveBeenCalledWith("Need 100 coins");
  });

  it("should repair rod, deduct coins, save data and reply success", async () => {
    const userData = { rod: { broken: true, level: 3, durability: 20 }, coins: 200 };
    getRepairCost.mockReturnValue(100);
    messages.rodRepairSuccess = "Rod repaired successfully";

    await fixRod(message, userData, userId);

    expect(userData.coins).toBe(100);
    expect(userData.rod.broken).toBe(false);
    expect(userData.rod.durability).toBe(100);
    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(message.editReply).toHaveBeenCalledWith("Rod repaired successfully");
  });

  it("should reply not enough coins if userData.coins is undefined", async () => {
    const userData = { rod: { broken: true, level: 3 } }; // no coins property
    getRepairCost.mockReturnValue(100);
    messages.rodRepairNotEnoughCoins = (cost) => `Need ${cost} coins`;

    await fixRod(message, userData, userId);

    expect(message.editReply).toHaveBeenCalledWith("Need 100 coins");
  });
});
