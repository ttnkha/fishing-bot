jest.mock("discord.js");
const { EmbedBuilder } = require("discord.js");
const { createCooldownEmbed, msToTime, createProgressBar } = require("@services/cooldownEmbed");

describe("msToTime", () => {
  test("converts milliseconds to minutes and seconds", () => {
    expect(msToTime(65000)).toBe("1 phút 5 giây");
    expect(msToTime(0)).toBe("0 phút 0 giây");
    expect(msToTime(60000)).toBe("1 phút 0 giây");
    expect(msToTime(59000)).toBe("0 phút 59 giây");
  });
});

describe("createProgressBar", () => {
  test("generates correct progress bar", () => {
    expect(createProgressBar(10000, 0, 10)).toBe("[░░░░░░░░░░]");
    expect(createProgressBar(10000, 5000, 10)).toBe("[█████░░░░░]");
    expect(createProgressBar(10000, 10000, 10)).toBe("[██████████]");
    expect(createProgressBar(10000, 7500, 10)).toBe("[███████░░░]");
  });

  test("handles size parameter", () => {
    expect(createProgressBar(100, 50, 5)).toBe("[██░░░]");
    expect(createProgressBar(100, 100, 5)).toBe("[█████]");
    expect(createProgressBar(100, 0, 5)).toBe("[░░░░░]");
  });
});

describe("createCooldownEmbed", () => {
  let mockSetColor;
  let mockSetTitle;
  let mockSetDescription;
  let mockSetTimestamp;
  let mockToJSON;

  beforeEach(() => {
    mockSetColor = jest.fn().mockReturnThis();
    mockSetTitle = jest.fn().mockReturnThis();
    mockSetDescription = jest.fn().mockReturnThis();
    mockSetTimestamp = jest.fn().mockReturnThis();
    mockToJSON = jest.fn().mockReturnValue({
      title: "⏳ Lệnh đang cooldown",
      color: 0xffa500,
      description:
        "Vui lòng đợi trước khi sử dụng lại lệnh.\n\n[█████░░░░░]\nThời gian còn lại: **0 phút 30 giây**",
      timestamp: new Date().toISOString(),
    });

    EmbedBuilder.mockImplementation(() => ({
      setColor: mockSetColor,
      setTitle: mockSetTitle,
      setDescription: mockSetDescription,
      setTimestamp: mockSetTimestamp,
      toJSON: mockToJSON,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns a properly formatted embed", () => {
    const cooldownMs = 60000;
    const cooldownRemaining = 30000;
    const embed = createCooldownEmbed(cooldownMs, cooldownRemaining);

    expect(embed.setColor).toHaveBeenCalledWith("#FFA500");
    expect(embed.setTitle).toHaveBeenCalledWith("⏳ Lệnh đang cooldown");
    expect(embed.setDescription).toHaveBeenCalledWith(expect.stringContaining("Thời gian còn lại"));
    expect(embed.setTimestamp).toHaveBeenCalled();
  });
});
