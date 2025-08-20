jest.mock("@root/items.json", () => ({
  trash: [{ name: "Vỏ chai" }],
}));

jest.mock("@logic/gameLogic", () => ({
  getBait: jest.fn(),
}));

jest.mock("@services/data", () => ({
  saveData: jest.fn(),
}));

jest.mock("@services/strings", () => ({
  messages: {
    notStarted: "Bạn chưa bắt đầu.",
    foundBait: (bait) => `Tìm thấy mồi: ${bait.name}`,
    foundRareBait: (bait) => `🎉 Mồi hiếm: ${bait.name}`,
    foundTrash: (trash) => `😢 Chỉ tìm được: ${trash.name}`,
  },
}));

jest.mock("@config/constants", () => ({
  DIG_COOLDOWN_MS: 5000,
}));

jest.mock("@services/cooldowns.js", () => ({
  getCooldownRemaining: jest.fn(),
  setUserCooldown: jest.fn(),
}));

const mockEmbed = { description: "Cooldown!" };
jest.mock("@services/cooldownEmbed", () => ({
  createCooldownEmbed: jest.fn(() => mockEmbed),
}));

const { handleDig } = require("@handlers/digHandler"); // Adjust path
const { getCooldownRemaining, setUserCooldown } = require("@services/cooldowns.js");
const { getBait } = require("@logic/gameLogic");
const { saveData } = require("@services/data");

describe("handleDig", () => {
  let message;
  const userId = "123";

  beforeEach(() => {
    message = { editReply: jest.fn() };
    jest.clearAllMocks();
  });

  it("should editReply if user has not started", async () => {
    await handleDig(message, null, userId);
    expect(message.editReply).toHaveBeenCalledWith("Bạn chưa bắt đầu.");
  });

  it("should show cooldown if still active", async () => {
    getCooldownRemaining.mockResolvedValue(3000);
    getBait.mockReturnValue({});
    await handleDig(message, { bait: [] }, userId);

    expect(message.editReply).toHaveBeenCalledWith({
      embeds: [mockEmbed],
    });
  });

  it("should handle common bait drop", async () => {
    getCooldownRemaining.mockResolvedValue(0);
    getBait.mockReturnValue({
      type: "common",
      bait: { name: "Trùng đất" },
    });

    const userData = { bait: [] };

    await handleDig(message, userData, userId);

    expect(setUserCooldown).toHaveBeenCalled();
    expect(saveData).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(message.editReply).toHaveBeenCalledWith("Tìm thấy mồi: Trùng đất");
  });

  it("should handle rare bait drop", async () => {
    getCooldownRemaining.mockResolvedValue(0);
    getBait.mockReturnValue({
      type: "rare",
      bait: { name: "Mồi vàng" },
    });

    const userData = { bait: [] };

    await handleDig(message, userData, userId);

    expect(saveData).toHaveBeenCalled();
    expect(message.editReply).toHaveBeenCalledWith("🎉 Mồi hiếm: Mồi vàng");
  });

  it("should handle trash drop", async () => {
    getCooldownRemaining.mockResolvedValue(0);
    getBait.mockReturnValue({
      type: "trash",
      trash: { name: "Vỏ chai" },
    });

    const userData = { bait: [] };

    await handleDig(message, userData, userId);

    expect(saveData).not.toHaveBeenCalled(); // trash does not change user data
    expect(message.editReply).toHaveBeenCalledWith("😢 Chỉ tìm được: Vỏ chai");
  });

  it("should increment bait quantity if already exists", async () => {
    getCooldownRemaining.mockResolvedValue(0);
    getBait.mockReturnValue({
      type: "common",
      bait: { name: "Trùng đất" },
    });

    const userData = {
      bait: [{ name: "Trùng đất", quantity: 2 }],
    };

    await handleDig(message, userData, userId);

    expect(userData.bait[0].quantity).toBe(3);
    expect(saveData).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(message.editReply).toHaveBeenCalledWith("Tìm thấy mồi: Trùng đất");
  });

  it("should increment quantity from 1 when existing bait has undefined quantity", async () => {
    const baitName = "Worm";

    // Mock getBait to return a common bait
    getBait.mockReturnValue({
      type: "common",
      bait: { name: baitName }, // no quantity property here
    });

    // User data with existing bait with undefined quantity
    const userData = {
      bait: [{ name: baitName, quantity: undefined }],
      coins: 0,
      rod: { code: "wood", level: 1 },
      inventory: [],
    };

    await handleDig(message, userData, userId);

    // quantity should be updated to 2 (1 + 1)
    expect(userData.bait[0].quantity).toBe(2);

    expect(saveData).toHaveBeenCalledWith(userId, userData);

    expect(message.editReply).toHaveBeenCalled();
  });

  it("should initialize bait array when userData.bait is undefined", async () => {
    // Mock getBait to return a common bait
    getBait.mockReturnValue({
      type: "common",
      bait: { name: "Worm" },
    });

    // userData with bait undefined
    const userData = {
      bait: undefined,
      coins: 0,
      rod: { code: "wood", level: 1 },
      inventory: [],
    };

    await handleDig(message, userData, userId);

    // After handleDig, bait should be initialized as array with new bait
    expect(Array.isArray(userData.bait)).toBe(true);
    expect(userData.bait.length).toBe(1);
    expect(userData.bait[0].name).toBe("Worm");

    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(message.editReply).toHaveBeenCalled();
  });
});
