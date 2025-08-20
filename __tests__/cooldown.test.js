jest.mock("@services/db");

const { connect } = require("@services/db");
const {
  getUserCooldown,
  setUserCooldown,
  isOnCooldown,
  getCooldownRemaining,
  getCooldownTable,
} = require("@services/cooldowns");

describe("Cooldown Utilities", () => {
  const mockCollection = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    connect.mockResolvedValue(mockCollection);
  });

  describe("getUserCooldown", () => {
    test("returns 0 if user or action not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const cooldown = await getUserCooldown("user1", "testAction");
      expect(cooldown).toBe(0);
    });

    test("returns correct timestamp if action found", async () => {
      mockCollection.findOne.mockResolvedValue({ _id: "user1", testAction: 123456789 });
      const cooldown = await getUserCooldown("user1", "testAction");
      expect(cooldown).toBe(123456789);
    });
  });

  describe("setUserCooldown", () => {
    test("updates cooldown timestamp with upsert", async () => {
      await setUserCooldown("user1", "testAction", 987654321);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: "user1" },
        { $set: { testAction: 987654321 } },
        { upsert: true }
      );
    });
  });

  describe("isOnCooldown", () => {
    test("returns true if cooldown not expired", async () => {
      const now = Date.now();
      mockCollection.findOne.mockResolvedValue({ _id: "user1", testAction: now - 1000 });
      const result = await isOnCooldown("user1", "testAction", 2000);
      expect(result).toBe(true);
    });

    test("returns false if cooldown expired", async () => {
      const now = Date.now();
      mockCollection.findOne.mockResolvedValue({ _id: "user1", testAction: now - 5000 });
      const result = await isOnCooldown("user1", "testAction", 2000);
      expect(result).toBe(false);
    });
  });

  describe("getCooldownRemaining", () => {
    test("returns remaining cooldown time", async () => {
      const now = Date.now();
      const lastUsed = now - 1000;
      const cooldownMs = 3000;
      mockCollection.findOne.mockResolvedValue({ _id: "user1", testAction: lastUsed });
      const remaining = await getCooldownRemaining("user1", "testAction", cooldownMs);
      expect(remaining).toBeGreaterThan(1900);
      expect(remaining).toBeLessThanOrEqual(3000);
    });

    test("returns 0 if cooldown expired", async () => {
      const now = Date.now();
      const lastUsed = now - 5000;
      const cooldownMs = 2000;
      mockCollection.findOne.mockResolvedValue({ _id: "user1", testAction: lastUsed });
      const remaining = await getCooldownRemaining("user1", "testAction", cooldownMs);
      expect(remaining).toBe(0);
    });
  });

  describe("getCooldownTable", () => {
    test("returns structured cooldown table", async () => {
      const mockDocs = [
        { _id: "user1", action1: 123, action2: 456 },
        { _id: "user2", actionA: 789 },
      ];

      mockCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue(mockDocs),
      });

      const result = await getCooldownTable();
      expect(result).toEqual({
        user1: { action1: 123, action2: 456 },
        user2: { actionA: 789 },
      });
    });
  });
});
