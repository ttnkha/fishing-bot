const { showRodShop } = require("@handlers/shopHandlers");
const items = require("@root/items.json");
const utils = require("@handlers/utils");

jest.mock("@handlers/utils");

describe("showRodShop", () => {
  let message;

  beforeEach(() => {
    message = { editReply: jest.fn() };
    utils.getRepairCost.mockClear();
  });

  it("should show max rod message if no next rod", async () => {
    const maxLevel = Math.max(...items.rods.map((r) => r.level));
    const userData = {
      rod: { level: maxLevel, name: "Max Rod" },
      coins: 5000,
    };

    await showRodShop(message, userData);

    expect(message.editReply).toHaveBeenCalledTimes(1);
    const text = message.editReply.mock.calls[0][0];
    expect(text).toContain("🏁 Bạn đã sở hữu cần câu cấp cao nhất");
  });

  it("should show next rod with ❗ Thiếu if not enough coins", async () => {
    const currentRod = items.rods.find((r) => r.level === 1);
    const nextRod = items.rods.find((r) => r.level === 2);
    const coins = nextRod.price - 100;

    const userData = {
      rod: currentRod,
      coins,
    };

    await showRodShop(message, userData);

    expect(message.editReply).toHaveBeenCalledTimes(1);
    const text = message.editReply.mock.calls[0][0];
    expect(text).toContain(`❗ Thiếu: ${nextRod.price - coins} coins`);
    expect(text).toContain(`Level ${nextRod.level}`);
    expect(text).toContain(nextRod.name);
  });

  it("should show next rod with ✅ Đủ tiền if enough coins", async () => {
    const currentRod = items.rods.find((r) => r.level === 1);
    const nextRod = items.rods.find((r) => r.level === 2);
    const coins = nextRod.price;

    const userData = {
      rod: currentRod,
      coins,
    };

    await showRodShop(message, userData);

    expect(message.editReply).toHaveBeenCalledTimes(1);
    const text = message.editReply.mock.calls[0][0];
    expect(text).toContain("✅ Đủ tiền");
    expect(text).toContain(`Level ${nextRod.level}`);
    expect(text).toContain(nextRod.name);
  });

  it("should include repair message if rod is broken", async () => {
    const currentRod = {
      level: 1,
      name: "Broken Rod",
      broken: true,
    };
    const userData = {
      rod: currentRod,
      coins: 1000,
    };

    utils.getRepairCost.mockReturnValue(250);

    await showRodShop(message, userData);

    expect(utils.getRepairCost).toHaveBeenCalledWith(currentRod);

    const text = message.editReply.mock.calls[0][0];
    expect(text).toContain("🛠️ **Cần câu của bạn đang bị hỏng!**");
    expect(text).toContain("!suacancau");
    expect(text).toContain("250 coins");
  });

  it("should handle empty userData gracefully", async () => {
    await showRodShop(message, null);
    expect(message.editReply).toHaveBeenCalledTimes(1);
    const text = message.editReply.mock.calls[0][0];
    // default rod level 1 so next rod should be level 2
    const nextRod = items.rods.find((r) => r.level === 2);
    expect(text).toContain(`Level ${nextRod.level}`);
  });
});
