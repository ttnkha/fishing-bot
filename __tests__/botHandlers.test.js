jest.mock("@root/items.json", () => ({
  rods: [
    { name: "Cần gỗ", level: 1, price: 0 },
    { name: "Cần sắt", level: 2, price: 100 },
  ],
}));

jest.mock("@services/data", () => ({
  saveData: jest.fn(),
}));

jest.mock("@services/strings", () => ({
  messages: {
    alreadyStarted: "Bạn đã bắt đầu trước đó.",
    startSuccess: "Bắt đầu thành công!",
    notStarted: "Bạn chưa bắt đầu trò chơi.",
    alreadyMaxRod: "Cần câu đã đạt cấp tối đa.",
    notEnoughCoins: (needed) => `Bạn cần thêm ${needed} coins.`,
    upgradeSuccess: (name, price) => `Đã nâng cấp lên ${name} với giá ${price} coins.`,
  },
}));

const { handleStart, handleBag } = require("@handlers/botHandlers");

const { saveData } = require("@services/data");
const { messages } = require("@services/strings");

describe("handleStart", () => {
  it("should editReply alreadyStarted if userData exists", async () => {
    const message = { editReply: jest.fn() };
    await handleStart(message, { rod: {} }, "123");
    expect(message.editReply).toHaveBeenCalledWith(messages.alreadyStarted);
  });

  it("should initialize user data and editReply success", async () => {
    const message = { editReply: jest.fn() };
    const userId = "123";
    await handleStart(message, null, userId);

    expect(saveData).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        rod: expect.any(Object),
        bait: [],
        inventory: [],
        coins: 0,
      })
    );
    expect(message.editReply).toHaveBeenCalledWith(messages.startSuccess);
  });
});

describe("handleBag", () => {
  it("should editReply notStarted if no userData", async () => {
    const message = { editReply: jest.fn() };
    await handleBag(message, null);
    expect(message.editReply).toHaveBeenCalledWith(messages.notStarted);
  });

  it("should display full inventory info", async () => {
    const message = { editReply: jest.fn() };
    const userData = {
      rod: { name: "Cần gỗ", durability: 80, broken: false },
      bait: [{ name: "Trùng", quantity: 3 }],
      inventory: [{ name: "Cá trê", quantity: 2 }],
      coins: 50,
    };

    await handleBag(message, userData);

    expect(message.editReply).toHaveBeenCalledWith(
      expect.stringContaining("🎒 Túi đồ của bạn gồm:")
    );
    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("Cần gỗ"));
    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("Trùng"));
    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("Cá trê"));
    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("💰 Coins: 50"));
  });

  it("should handle empty inventory gracefully", async () => {
    const message = { editReply: jest.fn() };
    const userData = {
      rod: { name: "Cần gỗ" },
      bait: [],
      inventory: [],
      coins: 0,
    };

    await handleBag(message, userData);

    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("Trống"));
  });

  it("should display broken status when rod is broken", async () => {
    const message = { editReply: jest.fn() };
    const userData = {
      rod: { name: "Cần gỗ", broken: true, durability: 40 },
      bait: [],
      inventory: [],
      coins: 0,
    };

    await handleBag(message, userData);

    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("❌ Hỏng"));
  });

  it("should fallback to 100 durability when undefined", async () => {
    const message = { editReply: jest.fn() };
    const userData = {
      rod: { name: "Cần gỗ" }, // no durability
      bait: [],
      inventory: [],
      coins: 0,
    };

    await handleBag(message, userData);

    expect(message.editReply).toHaveBeenCalledWith(expect.stringContaining("Độ bền: 100"));
  });
});
