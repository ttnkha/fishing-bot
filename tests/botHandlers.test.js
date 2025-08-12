require("module-alias/register");

const { getFish, getBait } = require("@logic/gameLogic");
const { saveData } = require("@services/dataStore");

jest.mock("@services/dataStore", () => ({
  saveData: jest.fn(() => Promise.resolve()),
}));

jest.mock("@logic/gameLogic", () => ({
  getFish: jest.fn(),
  getBait: jest.fn(),
}));

const { handleStart, handleDig, handleHook, handleBag } = require("@handlers/botHandlers");

describe("botHandlers", () => {
  let message;
  let data;
  let userId;

  beforeEach(() => {
    userId = "user123";
    message = {
      reply: jest.fn(),
    };
    data = {};
    jest.clearAllMocks();
  });

  describe("handleStart", () => {
    it("replies if user already started", async () => {
      data[userId] = {};
      await handleStart(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Bạn đã bắt đầu chơi rồi!");
      expect(saveData).not.toHaveBeenCalled();
    });

    it("starts new user and saves data", async () => {
      await handleStart(message, data, userId);
      expect(data[userId]).toEqual({
        rod: "wood",
        bait: 0,
        inventory: [],
        coins: 0,
      });
      expect(saveData).toHaveBeenCalledWith(data);
      expect(message.reply).toHaveBeenCalledWith(
        "Bạn đã nhận 1 cần câu gỗ và bắt đầu hành trình câu cá!"
      );
    });
  });

  describe("handleDig", () => {
    it("replies if user not started", async () => {
      await handleDig(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Bạn chưa bắt đầu chơi. Dùng `!bắtđầu`.");
      expect(saveData).not.toHaveBeenCalled();
    });

    it("handles common bait", async () => {
      data[userId] = { bait: 0 };
      const baitMock = { name: "Mồi thường", rarity: "common" };
      getBait.mockReturnValue({ type: "common", bait: baitMock });

      await handleDig(message, data, userId);

      expect(data[userId].bait).toBe(1);
      expect(saveData).toHaveBeenCalledWith(data);
      expect(message.reply).toHaveBeenCalledWith(
        `Bạn tìm được mồi **${baitMock.name}** (Độ hiếm: ${baitMock.rarity})!`
      );
    });

    it("handles trash", async () => {
      data[userId] = { bait: 0 };
      getBait.mockReturnValue({ type: "trash", trash: "Rác thải" });

      await handleDig(message, data, userId);

      expect(saveData).not.toHaveBeenCalled();
      expect(message.reply).toHaveBeenCalledWith(`Bạn tìm được rác: Rác thải...`);
    });

    it("handles rare bait", async () => {
      data[userId] = { bait: 0 };
      const baitMock = { name: "Mồi hiếm", rarity: "rare" };
      getBait.mockReturnValue({ type: "rare", bait: baitMock });

      await handleDig(message, data, userId);

      expect(data[userId].bait).toBe(1);
      expect(saveData).toHaveBeenCalledWith(data);
      expect(message.reply).toHaveBeenCalledWith(
        `Bạn rất may mắn! Nhặt được mồi hiếm **${baitMock.name}**!`
      );
    });
  });

  describe("handleHook", () => {
    it("replies if user not started", async () => {
      await handleHook(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Bạn chưa bắt đầu chơi. Dùng `!bắtđầu`.");
      expect(saveData).not.toHaveBeenCalled();
    });

    it("replies if no bait", async () => {
      data[userId] = { bait: 0 };
      await handleHook(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Bạn không có mồi. Dùng `!đào` để tìm mồi.");
      expect(saveData).not.toHaveBeenCalled();
    });

    it("handles missed catch", async () => {
      data[userId] = { bait: 1, rod: "wood", inventory: [] };
      getFish.mockReturnValue({ type: "miss" });

      await handleHook(message, data, userId);

      expect(data[userId].bait).toBe(0);
      expect(saveData).toHaveBeenCalledWith(data);
      expect(message.reply).toHaveBeenCalledWith("Bạn hụt rồi! Không câu được gì...");
    });

    it("handles successful catch", async () => {
      data[userId] = { bait: 1, rod: "wood", inventory: [] };
      const fishMock = "Cá Vàng";
      getFish.mockReturnValue({ type: "catch", fish: fishMock });

      await handleHook(message, data, userId);

      expect(data[userId].bait).toBe(0);
      expect(data[userId].inventory).toContain(fishMock);
      expect(saveData).toHaveBeenCalledWith(data);
      expect(message.reply).toHaveBeenCalledWith(`Bạn câu được **${fishMock}**! 🎣`);
    });
  });

  describe("handleBag", () => {
    it("replies if user not started", async () => {
      await handleBag(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Bạn chưa bắt đầu chơi. Dùng `!bắtđầu`.");
    });

    it("shows empty bag", async () => {
      data[userId] = { bait: 5, inventory: [] };
      await handleBag(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Mồi: 5 | Túi cá: Trống");
    });

    it("shows bag with fish", async () => {
      data[userId] = { bait: 3, inventory: ["Cá chép", "Cá trắm"] };
      await handleBag(message, data, userId);
      expect(message.reply).toHaveBeenCalledWith("Mồi: 3 | Túi cá: Cá chép, Cá trắm");
    });
  });
});
