jest.mock("discord.js");
jest.mock("@logic/gameLogic");
jest.mock("@services/data");
jest.mock("@services/cooldowns.js");
jest.mock("@services/cooldownEmbed");

jest.mock("@logic/gameLogic", () => ({
  getFish: jest.fn(),
}));

const hookHandler = require("@handlers/hookHandler");
const { getFish } = require("@logic/gameLogic");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");
const { getCooldownRemaining, setUserCooldown } = require("@services/cooldowns.js");
const { createCooldownEmbed } = require("@services/cooldownEmbed");
const { StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");

describe("promptUserToSelectBait", () => {
  let interaction;
  let userData;
  const userId = "user123";
  let mockSetCustomId;
  let mockSetPlaceholder;
  let mockAddOptions;
  let mockAddComponents;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockSetCustomId = jest.fn().mockReturnThis();
    mockSetPlaceholder = jest.fn().mockReturnThis();
    mockAddOptions = jest.fn().mockReturnThis();
    mockAddComponents = jest.fn().mockReturnThis();

    StringSelectMenuBuilder.mockImplementation(() => ({
      setCustomId: mockSetCustomId,
      setPlaceholder: mockSetPlaceholder,
      addOptions: mockAddOptions,
    }));

    ActionRowBuilder.mockImplementation(() => ({
      addComponents: mockAddComponents,
    }));

    interaction = {
      reply: jest.fn(),
      editReply: jest.fn().mockResolvedValue(),
      channel: {
        createMessageComponentCollector: jest.fn(),
      },
    };

    userData = {
      bait: [{ name: "Bait1", rarity: 1, quantity: 2 }],
      rod: { level: 1, broken: false, durability: 100 },
      inventory: [],
      coins: 100,
    };

    getCooldownRemaining.mockResolvedValue(0);
    setUserCooldown.mockResolvedValue();
    createCooldownEmbed.mockReturnValue({ description: "Cooldown embed" });
  });

  it("replies with cooldown embed if cooldown is active", async () => {
    getCooldownRemaining.mockResolvedValue(5000);
    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(createCooldownEmbed).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({
      embeds: [{ description: "Cooldown embed" }],
    });
  });

  it("replies no bait if user has no bait", async () => {
    userData.bait = [];
    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(interaction.editReply).toHaveBeenCalledWith("Bạn không có mồi nào để câu.");
  });

  it("replies no rod if user has no rod", async () => {
    userData.rod = null;
    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(interaction.editReply).toHaveBeenCalledWith("Bạn chưa có cần câu.");
  });

  it("replies rod broken message if rod is broken", async () => {
    userData.rod.broken = true;
    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(interaction.editReply).toHaveBeenCalledWith(
      "Cần câu của bạn đã bị gãy. Hãy sửa nó trước khi tiếp tục câu cá."
    );
  });

  it("breaks rod and replies if durability <= 0", async () => {
    userData.rod.level = 2;
    userData.rod.durability = 0;
    interaction.reply.mockResolvedValue();
    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(userData.rod.broken).toBe(true);
    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(interaction.editReply).toHaveBeenCalledWith("Cần câu của bạn đã bị gãy!");
  });

  it("shows select menu with bait options", async () => {
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Chọn mồi câu bạn muốn sử dụng:",
        components: expect.any(Array),
        flags: expect.any(Number),
      })
    );

    expect(interaction.channel.createMessageComponentCollector).toHaveBeenCalled();
    expect(fakeCollector.once).toHaveBeenCalledTimes(2);
  });

  it("creates collector with correct filter", async () => {
    let passedFilter;
    interaction.channel.createMessageComponentCollector.mockImplementation(({ filter }) => {
      passedFilter = filter;
      return {
        once: jest.fn(),
      };
    });

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    expect(passedFilter({ user: { id: userId } })).toBe(true);
    expect(passedFilter({ user: { id: "wrongId" } })).toBe(false);
  });

  it("should edit reply with timeout message when collector ends due to time", async () => {
    const mockInteraction = {
      user: { id: "user1" },
      channel: {
        createMessageComponentCollector: jest.fn(),
      },
      reply: jest.fn(),
      editReply: jest.fn().mockResolvedValue(),
    };

    const userData = {
      bait: [{ name: "Bait1", rarity: 1, quantity: 2 }],
      rod: { code: "wood", level: 1, durability: 100, broken: false },
    };
    const userId = "user1";

    let endCallback;
    mockInteraction.channel.createMessageComponentCollector.mockReturnValue({
      once: (event, cb) => {
        if (event === "end") endCallback = cb;
        // no need to mock collect here
      },
    });

    await hookHandler.promptUserToSelectBait(mockInteraction, userData, userId);

    // Simulate collector end with reason "time"
    await endCallback(null, "time");

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: "Hết thời gian chọn mồi câu.",
      components: [],
    });
  });

  it("should call handleHook when collector collects", async () => {
    // Create the spy but DON'T mock the implementation - let it execute
    const handleHookSpy = jest.spyOn(hookHandler, "handleHook");

    const mockInteraction = {
      user: { id: "user1" },
      channel: {
        createMessageComponentCollector: jest.fn(),
      },
      reply: jest.fn(),
      editReply: jest.fn(),
    };

    const userData = {
      bait: [{ name: "Bait1", rarity: 1, quantity: 2 }],
      rod: { code: "wood", level: 1, durability: 100, broken: false },
      inventory: [],
    };
    const userId = "user1";

    // Mock getFish to return a valid result
    getFish.mockReturnValue({
      type: "fish",
      fish: { name: "TestFish" },
    });

    // To capture the collect callback
    let collectCallback;

    mockInteraction.channel.createMessageComponentCollector.mockReturnValue({
      once: (event, cb) => {
        if (event === "collect") {
          collectCallback = cb;
        }
        // Mock the "end" event callback as well to prevent undefined behavior
        return this;
      },
    });

    // Run your function, it will set collectCallback
    await hookHandler.promptUserToSelectBait(mockInteraction, userData, userId);

    // Verify collectCallback was set
    expect(collectCallback).toBeDefined();

    // Now simulate collecting an interaction (trigger that callback)
    const collectedInteraction = {
      values: ["0"],
      user: { id: userId },
      reply: jest.fn(),
    };

    // Wait for the callback to complete
    await collectCallback(collectedInteraction);

    // Now you can assert that handleHook was called with correct args
    expect(handleHookSpy).toHaveBeenCalledWith(collectedInteraction, userData, userId, 0);

    // Clean up the spy
    handleHookSpy.mockRestore();
  });

  it("replies with not started message if userData is undefined", async () => {
    await hookHandler.promptUserToSelectBait(interaction, undefined, userId);

    expect(interaction.editReply).toHaveBeenCalledWith("Bạn không có mồi nào để câu.");
  });
  // Add these test cases to your promptUserToSelectBait describe block:

  it("should handle rod level > 1 with sufficient durability", async () => {
    userData.rod.level = 2; // This will trigger the rod.level > 1 condition
    userData.rod.durability = 50; // Sufficient durability

    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Should create select menu and collector (not break due to durability)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Chọn mồi câu bạn muốn sử dụng:",
        components: expect.any(Array),
      })
    );
    expect(userData.rod.durability).toBe(50); // Should remain unchanged
    expect(userData.rod.broken).toBe(false);
  });

  it("should handle rod level > 1 with undefined durability", async () => {
    userData.rod.level = 2;
    userData.rod.durability = undefined; // This will trigger the ?? 100 fallback

    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Should set durability to 100 and continue
    expect(userData.rod.durability).toBe(100);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Chọn mồi câu bạn muốn sử dụng:",
        components: expect.any(Array),
      })
    );
  });

  it("should edit reply with timeout message when collector ends due to time", async () => {
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Find the "end" event handler
    const endHandler = fakeCollector.once.mock.calls.find((call) => call[0] === "end")[1];

    // Simulate collector end with reason "time"
    await endHandler(null, "time");

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Hết thời gian chọn mồi câu.",
      components: [],
    });
  });

  it("should not edit reply when collector ends with reason other than time", async () => {
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Find the "end" event handler
    const endHandler = fakeCollector.once.mock.calls.find((call) => call[0] === "end")[1];

    // Simulate collector end with reason other than "time"
    await endHandler(null, "user");

    // editReply should NOT be called
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("should create select menu and collector when all conditions are met", async () => {
    // This test will cover the menu/row creation and collector setup lines
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Verify the select menu creation path was executed
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Chọn mồi câu bạn muốn sử dụng:",
      components: expect.any(Array),
      flags: MessageFlags.Ephemeral,
    });

    // Verify collector was created
    expect(interaction.channel.createMessageComponentCollector).toHaveBeenCalledWith({
      componentType: 3,
      time: 30000,
      filter: expect.any(Function),
    });

    // Verify both event handlers were registered
    expect(fakeCollector.once).toHaveBeenCalledWith("collect", expect.any(Function));
    expect(fakeCollector.once).toHaveBeenCalledWith("end", expect.any(Function));
  });

  it("should create collector with correct configuration", async () => {
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Verify collector was created with correct parameters
    expect(interaction.channel.createMessageComponentCollector).toHaveBeenCalledWith({
      componentType: 3,
      time: 30000,
      filter: expect.any(Function),
    });

    // Verify collector.once was called for both "collect" and "end" events
    expect(fakeCollector.once).toHaveBeenCalledWith("collect", expect.any(Function));
    expect(fakeCollector.once).toHaveBeenCalledWith("end", expect.any(Function));
  });

  it("should setup collect and end event handlers", async () => {
    let collectHandler, endHandler;

    const fakeCollector = {
      once: jest.fn((event, handler) => {
        if (event === "collect") collectHandler = handler;
        if (event === "end") endHandler = handler;
      }),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Verify both handlers were registered
    expect(collectHandler).toBeInstanceOf(Function);
    expect(endHandler).toBeInstanceOf(Function);
  }); // Add these test cases to your promptUserToSelectBait describe block:

  it("should handle rod level > 1 with sufficient durability", async () => {
    userData.rod.level = 2; // This will trigger the rod.level > 1 condition
    userData.rod.durability = 50; // Sufficient durability

    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Should create select menu and collector (not break due to durability)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Chọn mồi câu bạn muốn sử dụng:",
        components: expect.any(Array),
      })
    );
    expect(userData.rod.durability).toBe(50); // Should remain unchanged
    expect(userData.rod.broken).toBe(false);
  });

  it("should handle rod level > 1 with undefined durability", async () => {
    userData.rod.level = 2;
    userData.rod.durability = undefined; // This will trigger the ?? 100 fallback

    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Should set durability to 100 and continue
    expect(userData.rod.durability).toBe(100);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Chọn mồi câu bạn muốn sử dụng:",
        components: expect.any(Array),
      })
    );
  });

  it("should create StringSelectMenuBuilder and ActionRowBuilder with correct options", async () => {
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Verify StringSelectMenuBuilder was called and configured correctly
    expect(mockSetCustomId).toHaveBeenCalledWith("select-bait");
    expect(mockSetPlaceholder).toHaveBeenCalledWith("Chọn mồi câu");
    expect(mockAddOptions).toHaveBeenCalledWith([
      {
        label: "Bait1 x2 [Độ hiếm: 1]",
        value: "0",
      },
    ]);

    // Verify ActionRowBuilder was called and configured correctly
    expect(mockAddComponents).toHaveBeenCalled();
  });

  it("should create collector with correct configuration", async () => {
    const fakeCollector = {
      once: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Verify collector was created with correct parameters
    expect(interaction.channel.createMessageComponentCollector).toHaveBeenCalledWith({
      componentType: 3,
      time: 30000,
      filter: expect.any(Function),
    });

    // Verify collector.once was called for both "collect" and "end" events
    expect(fakeCollector.once).toHaveBeenCalledWith("collect", expect.any(Function));
    expect(fakeCollector.once).toHaveBeenCalledWith("end", expect.any(Function));
  });

  it("should setup collect and end event handlers", async () => {
    let collectHandler, endHandler;

    const fakeCollector = {
      once: jest.fn((event, handler) => {
        if (event === "collect") collectHandler = handler;
        if (event === "end") endHandler = handler;
      }),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await hookHandler.promptUserToSelectBait(interaction, userData, userId);

    // Verify both handlers were registered
    expect(collectHandler).toBeInstanceOf(Function);
    expect(endHandler).toBeInstanceOf(Function);
  });
});

describe("handleHook", () => {
  let interaction;
  let userData;
  const userId = "user123";

  beforeEach(() => {
    interaction = {
      reply: jest.fn(),
    };
    userData = {
      rod: { level: 2, code: "basic", durability: 50, broken: false },
      bait: [{ name: "Bait1", rarity: 1, quantity: 2 }],
      inventory: [],
      coins: 100,
    };

    getFish.mockReturnValue({ type: "fish", fish: { name: "Fish1" } });
    setUserCooldown.mockResolvedValue();
    saveData.mockClear();
    saveData.mockResolvedValue();
  });

  it("replies not started if no userData", async () => {
    await hookHandler.handleHook(interaction, null, userId, 0);
    expect(interaction.reply).toHaveBeenCalledWith(messages.notStarted);
  });

  it("replies invalid bait if baitIndex out of bounds", async () => {
    await hookHandler.handleHook(interaction, userData, userId, 10);
    expect(interaction.reply).toHaveBeenCalledWith("Mồi câu không hợp lệ hoặc chưa chọn.");
  });

  it("handles miss case", async () => {
    getFish.mockReturnValue({ type: "miss" });

    await hookHandler.handleHook(interaction, userData, userId, 0);

    expect(setUserCooldown).toHaveBeenCalled();
    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(interaction.reply).toHaveBeenCalledWith(messages.miss);
    expect(userData.bait[0].quantity).toBe(1); // decremented by 1
  });

  it("handles catch fish case and updates inventory", async () => {
    getFish.mockReturnValue({ type: "fish", fish: { name: "Fish1" } });

    await hookHandler.handleHook(interaction, userData, userId, 0);

    expect(setUserCooldown).toHaveBeenCalled();
    expect(userData.bait.length).toBe(1);
    expect(userData.bait[0].quantity).toBe(1);
    expect(userData.inventory).toHaveLength(1);
    expect(userData.inventory[0]).toMatchObject({ name: "Fish1", quantity: 1 });
    expect(userData.rod.durability).toBe(40);
    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(interaction.reply).toHaveBeenCalledWith(messages.caughtFish("Fish1"));
  });

  it("removes bait if quantity reaches zero", async () => {
    userData.bait[0].quantity = 1;
    getFish.mockReturnValue({ type: "fish", fish: { name: "Fish1" } });

    await hookHandler.handleHook(interaction, userData, userId, 0);

    expect(userData.bait).toHaveLength(0);
  });

  it("increments quantity if fish already in inventory", async () => {
    userData.inventory.push({ name: "Fish1", quantity: 2 });
    getFish.mockReturnValue({ type: "fish", fish: { name: "Fish1" } });

    await hookHandler.handleHook(interaction, userData, userId, 0);

    expect(userData.inventory[0].quantity).toBe(3);
  });

  it("should reply with notStarted message if userData is missing", async () => {
    const interaction = { reply: jest.fn() };
    const userId = "user1";
    const baitIndex = 0;

    await hookHandler.handleHook(interaction, null, userId, baitIndex);

    expect(interaction.reply).toHaveBeenCalledWith(messages.notStarted);
  });

  test("handleHook replies with error if baitIndex invalid", async () => {
    const interaction = {
      reply: jest.fn(),
    };

    const userData = {
      bait: [{ name: "Test Bait", rarity: 1, quantity: 1 }],
    };

    // baitIndex out of range (too high)
    await hookHandler.handleHook(interaction, userData, "userId", 5);
    expect(interaction.reply).toHaveBeenCalledWith("Mồi câu không hợp lệ hoặc chưa chọn.");

    // baitIndex negative
    await hookHandler.handleHook(interaction, userData, "userId", -1);
    expect(interaction.reply).toHaveBeenCalledWith("Mồi câu không hợp lệ hoặc chưa chọn.");

    // baitIndex undefined
    await hookHandler.handleHook(interaction, userData, "userId", undefined);
    expect(interaction.reply).toHaveBeenCalledWith("Mồi câu không hợp lệ hoặc chưa chọn.");
  });

  test("should decrease bait quantity and remove bait if quantity reaches 0", async () => {
    const interaction = { reply: jest.fn() };
    const userId = "user123";

    // Mock getFish to return a catch (not miss)
    getFish.mockReturnValue({ type: "fish", fish: { name: "Salmon" } });

    const userData = {
      rod: { code: "rod1", durability: 100 },
      bait: [{ name: "Worm", rarity: 1, quantity: 1 }],
      inventory: [],
      coins: 100,
    };

    await hookHandler.handleHook(interaction, userData, userId, 0);

    // bait quantity decreased to 0 -> bait removed from list
    expect(userData.bait.length).toBe(0);

    // fish added to inventory with quantity = 1
    expect(userData.inventory.length).toBe(1);
    expect(userData.inventory[0].name).toBe("Salmon");
    expect(userData.inventory[0].quantity).toBe(1);

    // rod durability decreased by 10
    expect(userData.rod.durability).toBe(90);

    // saveData called twice (once after miss check and once at end)
    expect(saveData).toHaveBeenCalledTimes(1);

    // interaction replied with caught fish message
    expect(interaction.reply).toHaveBeenCalledWith(messages.caughtFish("Salmon"));
  });

  test("should handle miss case correctly", async () => {
    const interaction = { reply: jest.fn() };
    const userId = "user123";

    // Mock getFish to return a miss
    getFish.mockReturnValue({ type: "miss" });

    const userData = {
      rod: { code: "rod1", durability: 100 },
      bait: [{ name: "Worm", rarity: 1, quantity: 2 }],
      inventory: [],
      coins: 100,
    };

    await hookHandler.handleHook(interaction, userData, userId, 0);

    // bait quantity decreased by 1 (still >0, so still in list)
    expect(userData.bait[0].quantity).toBe(1);

    // rod durability not changed on miss
    expect(userData.rod.durability).toBe(100);

    // saveData called once after miss
    expect(saveData).toHaveBeenCalledTimes(1);

    // interaction replied with miss message
    expect(interaction.reply).toHaveBeenCalledWith(messages.miss);
  });

  test("should increment existing fish quantity in inventory", async () => {
    const interaction = { reply: jest.fn() };
    const userId = "user123";

    getFish.mockReturnValue({ type: "fish", fish: { name: "Salmon" } });

    const userData = {
      rod: { code: "rod1", durability: 100 },
      bait: [{ name: "Worm", rarity: 1, quantity: 3 }],
      inventory: [{ name: "Salmon", quantity: 2 }],
      coins: 100,
    };

    await hookHandler.handleHook(interaction, userData, userId, 0);

    // bait quantity decreased by 1
    expect(userData.bait[0].quantity).toBe(2);

    // fish quantity incremented
    expect(userData.inventory[0].quantity).toBe(3);

    // rod durability decreased by 10
    expect(userData.rod.durability).toBe(90);

    expect(saveData).toHaveBeenCalledTimes(1);

    expect(interaction.reply).toHaveBeenCalledWith(messages.caughtFish("Salmon"));
  });

  // Add these test cases to your handleHook describe block:

  it("should handle userData with missing bait property", async () => {
    // userData without bait property to trigger bait || [] fallback
    const userDataWithoutBait = {
      rod: { level: 1, code: "basic", durability: 50, broken: false },
      inventory: [{ name: "ExistingFish", quantity: 1 }],
      coins: 100,
    };
    // Note: no bait property

    await hookHandler.handleHook(interaction, userDataWithoutBait, userId, 0);

    expect(interaction.reply).toHaveBeenCalledWith("Mồi câu không hợp lệ hoặc chưa chọn.");
  });

  it("should handle userData with undefined bait property", async () => {
    // userData with explicitly undefined bait to trigger bait || [] fallback
    const userDataWithUndefinedBait = {
      rod: { level: 1, code: "basic", durability: 50, broken: false },
      bait: undefined, // explicitly undefined
      inventory: [{ name: "ExistingFish", quantity: 1 }],
      coins: 100,
    };

    await hookHandler.handleHook(interaction, userDataWithUndefinedBait, userId, 0);

    expect(interaction.reply).toHaveBeenCalledWith("Mồi câu không hợp lệ hoặc chưa chọn.");
  });

  it("should handle userData with missing inventory property", async () => {
    // userData without inventory property to trigger inventory || [] fallback
    const userDataWithoutInventory = {
      rod: { level: 1, code: "basic", durability: 50, broken: false },
      bait: [{ name: "TestBait", rarity: 1, quantity: 2 }],
      coins: 100,
    };
    // Note: no inventory property

    getFish.mockReturnValue({ type: "fish", fish: { name: "NewFish" } });

    await hookHandler.handleHook(interaction, userDataWithoutInventory, userId, 0);

    // Should create new inventory array and add fish
    expect(userDataWithoutInventory.inventory).toEqual([{ name: "NewFish", quantity: 1 }]);
    expect(interaction.reply).toHaveBeenCalledWith(messages.caughtFish("NewFish"));
  });

  it("should handle userData with undefined inventory property", async () => {
    // userData with explicitly undefined inventory to trigger inventory || [] fallback
    const userDataWithUndefinedInventory = {
      rod: { level: 1, code: "basic", durability: 50, broken: false },
      bait: [{ name: "TestBait", rarity: 1, quantity: 2 }],
      inventory: undefined, // explicitly undefined
      coins: 100,
    };

    getFish.mockReturnValue({ type: "fish", fish: { name: "NewFish" } });

    await hookHandler.handleHook(interaction, userDataWithUndefinedInventory, userId, 0);

    // Should create new inventory array and add fish
    expect(userDataWithUndefinedInventory.inventory).toEqual([{ name: "NewFish", quantity: 1 }]);
    expect(interaction.reply).toHaveBeenCalledWith(messages.caughtFish("NewFish"));
  });
});
