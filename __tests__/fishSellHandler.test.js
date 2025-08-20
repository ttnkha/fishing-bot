jest.mock("discord.js");
jest.mock("@services/data", () => ({
  saveData: jest.fn(),
  loadData: jest.fn(),
}));
jest.mock("@root/items.json", () => ({
  fishes: [{ name: "Salmon", price: 15 }, { name: "Tuna" }],
}));

jest.mock("@services/strings", () => ({
  messages: {
    notStarted: "Not started message",
    notFoundFish: (name) => `Fish not found: ${name}`,
    sellSuccess: (name, price, qty, total) =>
      `Sold ${qty} ${name} at ${price} each, earned ${total}`,
    noFishToSell: "No fish to sell",
    selectFishToSell: "Select fish to sell",
  },
}));

const {
  handleSellFish,
  handleSellFishInteraction,
  promptUserToSellFish,
  removeFishFromInventory,
  findFishItemByName,
} = require("@handlers/fishSellHandler");
const { saveData, loadData } = require("@services/data");
const { messages } = require("@services/strings");
const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  MessageFlags,
} = require("discord.js");

describe("handleSellFish", () => {
  const userId = "user1";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("replies with notStarted if no userData", async () => {
    const message = { reply: jest.fn() };
    await handleSellFish(message, null, userId, "AnyFish", 1);
    expect(message.reply).toHaveBeenCalledWith(messages.notStarted);
  });

  it("replies ephemeral if quantity invalid", async () => {
    const message = { reply: jest.fn() };
    await handleSellFish(message, {}, userId, "AnyFish", 0);
    expect(message.reply).toHaveBeenCalledWith({
      content: "Không bán thì đừng có phá!!!",
      flags: 64,
    });
  });

  it("replies ephemeral if not enough fish quantity", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      inventory: [{ name: "Salmon", quantity: 2 }],
    };
    await handleSellFish(message, userData, userId, "Salmon", 3);
    expect(message.reply).toHaveBeenCalledWith({
      content: "Bạn không có đủ số lượng cá để bán.",
      flags: 64,
    });
  });

  it("replies with notFoundFish if fish not in items", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      inventory: [{ name: "MysteryFish", quantity: 5 }],
    };
    await handleSellFish(message, userData, userId, "MysteryFish", 2);
    expect(message.reply).toHaveBeenCalledWith(messages.notFoundFish("MysteryFish"));
  });

  it("sells fish, updates coins and saves data", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      coins: 10,
      inventory: [{ name: "Salmon", quantity: 5 }],
    };

    await handleSellFish(message, userData, userId, "Salmon", 4);

    // coins should be updated: 10 + 15*4 = 70
    expect(userData.coins).toBe(70);

    // inventory should remove 4 salmon across entries
    const totalSalmonLeft = userData.inventory.reduce(
      (acc, f) => acc + (f.name.toLowerCase() === "salmon" ? f.quantity : 0),
      0
    );
    expect(totalSalmonLeft).toBe(1);

    expect(saveData).toHaveBeenCalledWith(userId, userData);
    expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Sold 4 Salmon"));
  });

  it("handles userData with no inventory defined", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      coins: 10,
      // no inventory property
    };

    await handleSellFish(message, userData, "userId", "Salmon", 1);

    expect(message.reply).not.toHaveBeenCalledWith(
      expect.stringContaining("Bạn không có đủ số lượng cá để bán.")
    );
    // Additional assertions depending on your code flow,
    // e.g. it might reply with not enough fish or not found fish if inventory empty
  });

  it("calculates totalEarned as 0 if fish price is missing or falsy", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      coins: 10,
      inventory: [{ name: "Tuna", quantity: 5 }],
    };

    await handleSellFish(message, userData, "userId", "Tuna", 2);

    // totalEarned = 0 * 2 = 0, coins stay the same
    expect(userData.coins).toBe(10);

    expect(message.reply).toHaveBeenCalledWith(
      expect.stringContaining("Sold 2 Tuna") // adjust depending on your message template
    );
  });
});

describe("handleSellFishInteraction", () => {
  it("replies ephemeral if selected fish invalid", async () => {
    const interaction = {
      user: { id: "user1" },
      customId: "sell-quantity-99",
      fields: { getTextInputValue: jest.fn(() => "2") },
      editReply: jest.fn(),
    };
    const loadDataMock = loadData;
    loadDataMock.mockResolvedValue({
      inventory: [{ name: "Salmon", quantity: 1 }],
    });

    await handleSellFishInteraction(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Cá đã chọn không hợp lệ.",
      flags: 64,
    });
  });

  it("calls handleSellFish with correct parameters", async () => {
    const interaction = {
      user: { id: "user1" },
      customId: "sell-quantity-0",
      fields: { getTextInputValue: jest.fn(() => "2") },
      reply: jest.fn(),
    };
    const data = {
      inventory: [{ name: "Salmon", quantity: 10 }],
    };
    loadData.mockResolvedValue(data);

    const handleSellFishSpy = jest.spyOn(require("@handlers/fishSellHandler"), "handleSellFish");

    await handleSellFishInteraction(interaction);

    expect(handleSellFishSpy).toHaveBeenCalledWith(interaction, data, "user1", "Salmon", 2);
  });

  it("uses data.inventory or empty array", async () => {
    // Setup mock data with inventory array
    const dataWithInventory = {
      inventory: [{ name: "Salmon", quantity: 5 }],
    };
    loadData.mockResolvedValue(dataWithInventory);

    const interaction = {
      user: { id: "user1" },
      customId: "sell-quantity-0",
      fields: {
        getTextInputValue: jest.fn(() => "2"),
      },
      reply: jest.fn(),
    };

    await handleSellFishInteraction(interaction);

    expect(loadData).toHaveBeenCalledWith("user1");
    expect(interaction.reply).not.toHaveBeenCalledWith(
      expect.objectContaining({ content: "Cá đã chọn không hợp lệ." })
    );

    // Now test with no inventory (empty or missing)
    loadData.mockResolvedValue({});

    const interaction2 = {
      user: { id: "user2" },
      customId: "sell-quantity-0",
      fields: {
        getTextInputValue: jest.fn(() => "1"),
      },
      editReply: jest.fn(),
    };

    await handleSellFishInteraction(interaction2);

    expect(loadData).toHaveBeenCalledWith("user2");
    // It should reply with invalid fish if no inventory at index 0
    expect(interaction2.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Cá đã chọn không hợp lệ." })
    );
  });
});

describe("promptUserToSellFish", () => {
  let interaction;
  const userData = {
    inventory: [
      { name: "Salmon", quantity: 3 },
      { name: "Tuna", quantity: 2 },
    ],
  };
  const userId = "user1";

  let mockSetCustomId;
  let mockSetPlaceholder;
  let mockAddOptions;
  let mockAddComponents;
  let mockModalSetCustomId;
  let mockModalSetTitle;
  let mockModalAddComponents;
  let mockTextInputSetCustomId;
  let mockTextInputSetLabel;
  let mockTextInputSetStyle;
  let mockTextInputSetPlaceholder;
  let mockTextInputSetRequired;

  beforeEach(() => {
    // StringSelectMenuBuilder mocks
    mockSetCustomId = jest.fn().mockReturnThis();
    mockSetPlaceholder = jest.fn().mockReturnThis();
    mockAddOptions = jest.fn().mockReturnThis();
    StringSelectMenuBuilder.mockImplementation(() => ({
      setCustomId: mockSetCustomId,
      setPlaceholder: mockSetPlaceholder,
      addOptions: mockAddOptions,
    }));

    // ActionRowBuilder mocks
    mockAddComponents = jest.fn().mockReturnThis();
    ActionRowBuilder.mockImplementation(() => ({
      addComponents: mockAddComponents,
    }));

    // ModalBuilder mocks
    mockModalSetCustomId = jest.fn().mockReturnThis();
    mockModalSetTitle = jest.fn().mockReturnThis();
    mockModalAddComponents = jest.fn().mockReturnThis();
    ModalBuilder.mockImplementation(() => ({
      setCustomId: mockModalSetCustomId,
      setTitle: mockModalSetTitle,
      addComponents: mockModalAddComponents,
    }));

    // TextInputBuilder mocks
    mockTextInputSetCustomId = jest.fn().mockReturnThis();
    mockTextInputSetLabel = jest.fn().mockReturnThis();
    mockTextInputSetStyle = jest.fn().mockReturnThis();
    mockTextInputSetPlaceholder = jest.fn().mockReturnThis();
    mockTextInputSetRequired = jest.fn().mockReturnThis();
    TextInputBuilder.mockImplementation(() => ({
      setCustomId: mockTextInputSetCustomId,
      setLabel: mockTextInputSetLabel,
      setStyle: mockTextInputSetStyle,
      setPlaceholder: mockTextInputSetPlaceholder,
      setRequired: mockTextInputSetRequired,
    }));

    // interaction mock
    interaction = {
      editReply: jest.fn().mockResolvedValue(),
      editeditReply: jest.fn().mockResolvedValue(),
      channel: {
        createMessageComponentCollector: jest.fn(),
      },
    };

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  it("replies noFishToSell if inventory empty", async () => {
    await promptUserToSellFish(interaction, { inventory: [] }, userId);
    expect(interaction.editReply).toHaveBeenCalledWith(messages.noFishToSell);
  });

  it("builds and sends select menu, sets up collector, shows modal, and stops collector", async () => {
    const fakeCollector = {
      once: jest.fn((event, cb) => {
        if (event === "collect") {
          // simulate user selection
          setImmediate(() =>
            cb({
              values: ["0"],
              user: { id: userId },
              showModal: jest.fn(),
              editeditReply: jest.fn(),
              replied: false,
              deferred: false,
            })
          );
        }
        if (event === "end") {
          // do nothing for now
        }
      }),
      stop: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await promptUserToSellFish(interaction, userData, userId);

    expect(StringSelectMenuBuilder).toHaveBeenCalled();
    expect(ActionRowBuilder).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: messages.selectFishToSell,
        components: expect.any(Array),
        flags: 64,
      })
    );

    // Wait a tick to ensure collect callback ran
    await new Promise((r) => setTimeout(r, 0));

    expect(fakeCollector.once).toHaveBeenCalledWith("collect", expect.any(Function));
    expect(fakeCollector.once).toHaveBeenCalledWith("end", expect.any(Function));
  });

  it("edits reply when collector times out", async () => {
    const fakeCollector = {
      once: jest.fn((event, cb) => {
        if (event === "end") {
          setImmediate(() => cb(null, "time"));
        }
      }),
      stop: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await promptUserToSellFish(interaction, userData, userId);

    // Wait a tick to ensure end callback ran
    await new Promise((r) => setTimeout(r, 0));

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Hết thời gian chọn cá để bán.",
      components: [],
    });
  });

  test("promptUserToSellFish collector collects and shows modal", async () => {
    // Mock interaction with inventory of length 1
    const interaction = {
      editReply: jest.fn(),
      editeditReply: jest.fn().mockResolvedValue(),
      channel: {
        createMessageComponentCollector: jest.fn(),
      },
    };
    const userData = {
      inventory: [{ name: "Salmon", quantity: 5 }],
    };
    const id = "user123";

    // Set up collector mock to capture event listeners
    const listeners = {};
    const collector = {
      once: jest.fn((event, cb) => {
        listeners[event] = cb;
      }),
      stop: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(collector);

    // Call the function under test
    await promptUserToSellFish(interaction, userData, id);

    // Prepare fake interaction for the 'collect' event with values = ["0"]
    const fakeInteraction = {
      user: { id },
      values: ["0"], // this index must exist in inventory
      editeditReply: jest.fn().mockResolvedValue(),
      showModal: jest.fn().mockResolvedValue(),
      replied: false,
      deferred: false,
    };

    // Trigger 'collect' handler
    await listeners.collect(fakeInteraction);

    // Test if showModal was called
    expect(fakeInteraction.showModal).toHaveBeenCalled();
    // Test if collector.stop was called with "collected"
    expect(collector.stop).toHaveBeenCalledWith("collected");
  });

  it("does not call collect handler if user id does not match filter", async () => {
    const fakeCollector = {
      once: jest.fn(),
      stop: jest.fn(),
    };

    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await promptUserToSellFish(interaction, userData, userId);

    // Grab the filter function from collector options
    const collectorOptions = interaction.channel.createMessageComponentCollector.mock.calls[0][0];
    const fakeInteractionWrongUser = { user: { id: "wrongId" } };
    expect(collectorOptions.filter(fakeInteractionWrongUser)).toBe(false);

    const fakeInteractionCorrectUser = { user: { id: userId } };
    expect(collectorOptions.filter(fakeInteractionCorrectUser)).toBe(true);
  });

  it("replies with error if selected fish index is invalid", async () => {
    const fakeCollector = {
      once: jest.fn(),
      stop: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await promptUserToSellFish(interaction, userData, userId);

    // simulate 'collect' event with an invalid fish index
    const collectCallback = fakeCollector.once.mock.calls.find((call) => call[0] === "collect")[1];

    const fakeInteraction = {
      values: ["999"], // invalid index (out of bounds)
      editReply: jest.fn().mockResolvedValue(),
      user: { id: userId },
    };

    await collectCallback(fakeInteraction);

    expect(fakeInteraction.editReply).toHaveBeenCalledWith({
      content: "Không tìm thấy cá đã chọn.",
      components: [],
    });
    expect(fakeCollector.stop).not.toHaveBeenCalled(); // should not stop collector in this case
  });

  it("handles error in collect callback and replies with error message", async () => {
    const fakeCollector = {
      once: jest.fn(),
      stop: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await promptUserToSellFish(interaction, userData, userId);

    const collectCallback = fakeCollector.once.mock.calls.find((call) => call[0] === "collect")[1];

    // mock showModal to throw error
    const fakeInteraction = {
      values: ["0"],
      editeditReply: jest.fn().mockResolvedValue(),
      user: { id: userId },
      showModal: jest.fn(() => {
        throw new Error("modal error");
      }),
      replied: false,
      deferred: false,
      editReply: jest.fn().mockResolvedValue(),
    };

    await collectCallback(fakeInteraction);

    expect(console.error).toHaveBeenCalledWith("Error showing modal:", expect.any(Error));
    expect(fakeInteraction.editReply).toHaveBeenCalledWith({
      content: "Đã xảy ra lỗi khi hiển thị form bán cá.",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("covers inv = [] (no inventory)", async () => {
    const userData = {};

    await promptUserToSellFish(interaction, userData, userId);

    expect(interaction.editReply).toHaveBeenCalledWith(messages.noFishToSell);
  });

  it("collector collect handler catches error but does NOT reply if i.replied or i.deferred is true", async () => {
    const fakeCollector = {
      once: jest.fn(),
      stop: jest.fn(),
    };
    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    await promptUserToSellFish(
      interaction,
      { inventory: [{ name: "Salmon", quantity: 1 }] },
      userId
    );
    const collectCallback = fakeCollector.once.mock.calls.find((c) => c[0] === "collect")[1];

    const i = {
      user: { id: userId },
      values: ["0"],
      editeditReply: jest.fn(),
      showModal: jest.fn(() => {
        throw new Error("Modal error");
      }),
      editReply: jest.fn(),
      // Test with i.replied = true, i.deferred = false
      replied: true,
      deferred: false,
    };

    await collectCallback(i);
    expect(i.editReply).not.toHaveBeenCalled();

    // Now test with i.replied = false, i.deferred = true
    i.replied = false;
    i.deferred = true;
    i.editReply.mockClear();

    await collectCallback(i);
    expect(i.editReply).not.toHaveBeenCalled();
  });

  it("collector end handler does nothing if reason is not 'time'", () => {
    const replyMock = jest.fn().mockResolvedValue();

    interaction.reply = replyMock;

    // Setup fake collector and handler
    const fakeCollector = {
      once: jest.fn((event, callback) => {
        if (event === "end") {
          // Call with reason other than "time"
          callback(null, "collected");
        }
        return fakeCollector;
      }),
    };

    interaction.channel.createMessageComponentCollector.mockReturnValue(fakeCollector);

    // Call your function which creates the collector
    promptUserToSellFish(interaction, { inventory: [{ name: "Salmon", quantity: 1 }] }, "user1");

    // Check editReply NOT called because reason !== "time"
    expect(replyMock).not.toHaveBeenCalled();
  });
});

describe("removeFishFromInventory", () => {
  test("removeFishFromInventory removes fish when quantity equals quantityToRemove", () => {
    const inventory = [
      { name: "Trout", quantity: 3 },
      { name: "Carp", quantity: 5 },
    ];
    const fishName = "Trout";
    const quantityToRemove = 3;

    const result = removeFishFromInventory(inventory, fishName, quantityToRemove);

    // The fish with quantity exactly equal to quantityToRemove should be removed (not present)
    expect(result).toEqual([{ name: "Carp", quantity: 5 }]);
  });

  test("removeFishFromInventory removes fish when quantity less than quantityToRemove", () => {
    const inventory = [
      { name: "Pike", quantity: 2 },
      { name: "Bass", quantity: 5 },
    ];
    const fishName = "Pike";
    const quantityToRemove = 5;

    const result = removeFishFromInventory(inventory, fishName, quantityToRemove);

    // Pike (2) is removed fully, quantityToRemove reduces to 3, so only Bass remains
    // since Bass is a different fish, it stays as is
    expect(result).toEqual([{ name: "Bass", quantity: 5 }]);
  });
  test("handleSellFish removes fish when quantity equals fish quantity", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      coins: 0,
      inventory: [{ name: "Salmon", quantity: 3 }],
    };

    await handleSellFish(message, userData, "userId", "Salmon", 3);

    // Salmon should be removed completely (empty inventory)
    expect(userData.inventory).toEqual([]);

    // Coins updated accordingly
    expect(userData.coins).toBeGreaterThan(0);
    expect(message.reply).toHaveBeenCalled();
  });

  test("handleSellFish removes fish partially when quantity more than some entries", async () => {
    const message = { reply: jest.fn() };
    const userData = {
      coins: 0,
      inventory: [
        { name: "Salmon", quantity: 2 },
        { name: "Salmon", quantity: 3 },
        { name: "Trout", quantity: 5 },
      ],
    };

    await handleSellFish(message, userData, "userId", "Salmon", 4);

    // Salmon left should be 1 (5 - 4 = 1) after removing 4 total across entries
    const salmonLeft = userData.inventory
      .filter((f) => f.name.toLowerCase() === "salmon")
      .reduce((sum, f) => sum + f.quantity, 0);
    expect(salmonLeft).toBe(1);

    expect(message.reply).toHaveBeenCalled();
  });
});
