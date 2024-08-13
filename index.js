import Centrifuge from "centrifuge";
import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import moment from "moment";
import WebSocket from "ws";
import { XMLHttpRequest } from "xmlhttprequest";
global.XMLHttpRequest = XMLHttpRequest;

dotenv.config();

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

/* DonationAlerts API */
const centrifuge = new Centrifuge(
  "wss://centrifugo.donationalerts.com/connection/websocket",
  {
    websocket: WebSocket,
    subscribeEndpoint:
      "https://www.donationalerts.com/api/v1/centrifuge/subscribe",
    subscribeHeaders: {
      Authorization: `Bearer ${config.donationAlertsAccessToken}`,
    },
  }
);

async function getDonationAlertsUser(accessToken) {
  const url = "https://www.donationalerts.com/api/v1/user/oauth";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return await response.json();
}

/* MAIN LOGIC */
async function main() {
  try {
    const { data: user } = await getDonationAlertsUser(
      config.donationAlertsAccessToken
    );
    centrifuge.setToken(user.socket_connection_token);
    centrifuge.connect();

    console.log("Listening to new donations");

    centrifuge.subscribe(`$alerts:donation_${user.id}`, handleDonation);
  } catch (error) {
    console.error("Error in main:", error);
  }
}
main().catch(console.error);

async function handleDonation(message) {
  const { data: donation } = message;

  const isDonationValid = await isDonationValidForSubscription(donation);
  if (!isDonationValid) return;

  try {
    const addedRoleUser = await addSubscriptionRole(donation.username);
    const addedSubscription = await addSubscriptionToDb({
      ...donation,
      discordId: addedRoleUser.user.id,
    });
    console.log(`Subscription for ${donation.username} added successfully`);
  } catch (error) {
    console.error("Error handling donation:", error);
  }
}

async function isDonationValidForSubscription(donation) {
  const { amount, currency, message, username } = donation;

  if (currency !== config.subscription.currency) return false;
  if (amount < config.subscription.amount) return false;
  if (!containsWord(message, config.subscription.code)) return false;
  const discordUser = await getDiscordUser(username);
  if (!discordUser) return false;
  const user = await getSubscriberRowByUsername(username);
  if (user) return false;

  return true;
}

function containsWord(str, word) {
  return new RegExp(`\\b${word}\\b`).test(str);
}

async function addSubscriptionToDb(donation) {
  const { username, amount, currency, id, created_at, discordId } = donation;
  const newSubscriber = {
    username,
    amount,
    currency,
    donation_id: id,
    // donation_created_at: created_at,
    donation_created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    expires_at: getExpirationDate(),
    discord_id: discordId,
  };
  const createdSubscriber = await createSubscriberRow(newSubscriber);
  return createdSubscriber.toObject();
}

async function addSubscriptionRole(username) {
  const users = await searchUsers(username);
  const user = users[0];
  const added = await addRoleToUser(user.user.id, config.discord.subRoleId);
  if (added) return user;
  return null;
}

/* Discord API */
export async function getDiscordUser(username) {
  const users = await searchUsers(username);
  const fetchedUser = await fetchDiscordUser(users[0].user.id);
  if (fetchedUser.username === username) return fetchedUser;
  return null;
}

export async function fetchDiscordUser(userId) {
  const url = new URL(`${config.discord.baseUrl}/users/${userId}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: config.discord.botToken,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

export async function searchUsers(username) {
  if (!username) return null;
  const url = new URL(
    `${config.discord.baseUrl}/guilds/${config.discord.guildId}/members/search?limit=100&query=${username}`
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: config.discord.botToken,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
}

export async function addRoleToUser(userId, roleId) {
  const url = new URL(
    `${config.discord.baseUrl}/guilds/${config.discord.guildId}/members/${userId}/roles/${roleId}`
  );

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: config.discord.botToken,
      },
    });
    if (response.ok) {
      return true;
    }
    throw { status: response.status, statusText: response.statusText };
  } catch (error) {
    console.error("Error adding role to user:", error);
    throw error;
  }
}

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
function getExpirationDate() {
  return moment().add(1, "minute").format("YYYY-MM-DD HH:mm:ss");
}

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

export async function getSubscriberRowByUsername(username) {
  const sheet = await getSpreadsheet();
  const rows = await sheet.getRows();
  return rows.find((row) => row.get("username") === username);
}

export async function createSubscriberRow(subscriber) {
  const sheet = await getSpreadsheet();
  const createdRow = await sheet.addRow(subscriber);
  return createdRow;
}

export async function deleteSubscriberRow(username) {
  const row = await getSubscriberRowByUsername(username);
  if (row) {
    await row.delete();
    return true;
  }
  return false;
}
