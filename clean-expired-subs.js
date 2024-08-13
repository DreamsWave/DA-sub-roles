import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import moment from "moment";
dotenv.config();

const loop = process.argv.slice(2).includes("--loop");

const config = {
  donationAlertsAccessToken: process.env.DONATION_ALERTS_ACCESS_TOKEN,
  google: {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  discord: {
    baseUrl: "https://discord.com/api/v10",
    guildId: process.env.DISCORD_GUILD_ID,
    botToken: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    subRoleId: process.env.DISCORD_SUB_ROLE_ID,
  },
  subscription: {
    currency: "RUB",
    amount: 3,
    code: "subscribe",
  },
};

async function main() {
  const sheet = await getSpreadsheet();
  const rows = await sheet.getRows();
  for (const row of rows) {
    if (isExpired(row.get("expires_at"))) {
      await removeRoleFromUser(row.get("discord_id"), config.discord.subRoleId);
      await row.delete();
      console.log(`Removed subscription for ${row.get("username")}`);
    }
  }
}

if (loop) {
  setInterval(
    () =>
      main()
        .then(() => {
          // process.exit(0);
        })
        .catch((error) => {
          console.error(error);
          process.exit(1);
        }),
    1000 * 60
  );
} else {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

/* Discord API */
export async function removeRoleFromUser(userId, roleId) {
  const url = new URL(
    `${config.discord.baseUrl}/guilds/${config.discord.guildId}/members/${userId}/roles/${roleId}`
  );

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: config.discord.botToken,
      },
    });
    if (response.ok) {
      return true;
    }
    throw { status: response.status, statusText: response.statusText };
  } catch (error) {
    console.error("Error removing role from user:", error);
    throw error;
  }
}

/* Google Sheets API */
async function getSpreadsheet() {
  const serviceAccountAuth = new JWT({
    email: config.google.email,
    key: config.google.key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID,
    serviceAccountAuth
  );
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  return sheet;
}

function isExpired(expiresAt) {
  const expired = moment(expiresAt).isBefore(moment());
  return expired;
}
