const jestMock = require("jest-mock");

class StringSelectMenuBuilder {
  constructor() {
    this.setCustomId = jestMock.fn().mockReturnThis();
    this.setPlaceholder = jestMock.fn().mockReturnThis();
    this.addOptions = jestMock.fn().mockReturnThis();
  }
}

class ActionRowBuilder {
  constructor() {
    this.addComponents = jestMock.fn().mockReturnThis();
  }
}

class ModalBuilder {
  constructor() {
    this.setCustomId = jestMock.fn().mockReturnThis();
    this.setTitle = jestMock.fn().mockReturnThis();
    this.addComponents = jestMock.fn().mockReturnThis();
  }
}

class TextInputBuilder {
  constructor() {
    this.setCustomId = jestMock.fn().mockReturnThis();
    this.setLabel = jestMock.fn().mockReturnThis();
    this.setStyle = jestMock.fn().mockReturnThis();
    this.setPlaceholder = jestMock.fn().mockReturnThis();
    this.setRequired = jestMock.fn().mockReturnThis();
  }
}

class EmbedBuilder {
  constructor() {
    this.setColor = jestMock.fn().mockReturnThis();
    this.setTitle = jestMock.fn().mockReturnThis();
    this.setDescription = jestMock.fn().mockReturnThis();
    this.setTimestamp = jestMock.fn().mockReturnThis();
    this.toJSON = jestMock.fn().mockReturnValue({
      title: "⏳ Lệnh đang cooldown",
      color: 0xffa500,
      description:
        "Vui lòng đợi trước khi sử dụng lại lệnh.\n\n[█████░░░░░]\nThời gian còn lại: **0 phút 30 giây**",
      timestamp: new Date().toISOString(),
    });
  }
}

const TextInputStyle = {
  Short: 1,
  Paragraph: 2,
};

const MessageFlags = {
  Ephemeral: 1 << 6,
};

module.exports = {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  EmbedBuilder,
};
