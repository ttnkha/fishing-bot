# 🎣 Fishing Bot

A simple Discord bot for fishing game mechanics. Built using Node.js and Discord.js with slash and message commands support.

## 📁 Project Structure

```bash
fishing-bot/
│
├── commands/           # Slash command definitions
│
├── data/               # Persistent JSON data
│
├── src/                # Source code
│   ├── handlers/       # Message & interaction handlers
│   ├── logic/          # Game logic (drop rates, rarity, etc.)
│   ├── services/       # Config, strings, and data storage
│
├── tests/              # Unit tests
│
├── items.json          # Static item definitions (fishes, rods, baits)
├── index.js            # Entry point
├── deployCommands.js   # Register slash commands
└── README.md
```

---

## 🚀 Setup

1. **Clone the repo**

```bash
git clone https://github.com/yourusername/fishing-bot.git
cd fishing-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

Create a `.env` file:

```bash
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
```

4. **Register slash commands**

```bash
node ./src/deployCommands.js
```

5. **Run the bot**

```bash
node index.js
```

---

## ✅ Features

- `!batdau` — Start your fishing journey
- `!dao` — Dig for bait or trash
- `!cau` — Fish with your current rod and bait
- `!tui` — View your inventory
- `!ban` — Slash command to sell fish via select menu
- `!nangcapcan` — Upgrade your fishing rod
- `!suacancau` — Fix your fishing rod
- Rod shop display and upgrade logic
- Modular game logic and data structure
- Unit-tested core functionality

---

## 🧪 Testing

Run all tests:

```bash
npm test
```

Test files are in the `tests/` directory.

---

## 📄 License

MIT

© 2025 [Kha Tran] & [ChatGPT (OpenAI)]  
Built with ❤️ by human + AI collaboration.
