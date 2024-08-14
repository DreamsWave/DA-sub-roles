import dotenv from "dotenv";
dotenv.config();

const config = {
  donationAlertsAccessToken: process.env.DONATION_ALERTS_ACCESS_TOKEN,
  google: {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    sheetId: process.env.GOOGLE_SHEET_ID,
  },
  discord: {
    baseUrl: "https://discord.com/api/v10",
    guildId: process.env.DISCORD_GUILD_ID,
    botToken: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    subRoleId: process.env.DISCORD_SUB_ROLE_ID,
  },
  subscription: {
    currency: process.env.SUB_CURRENCY ?? "USD",
    amount: process.env.SUB_AMOUNT ?? 5,
    code: process.env.SUB_CODE ?? "subscribe",
    days: process.env.SUB_DAYS ?? 31,
  },
  cleanSubsTimeInMinutes: process.env.CLEAN_SUBS_TIME_IN_MINUTES ?? 1,
};

export default config;
