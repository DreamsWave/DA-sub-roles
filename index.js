import Centrifuge from "centrifuge";
import { config } from "dotenv";
import WebSocket from "ws";
import { XMLHttpRequest } from "xmlhttprequest";
global.XMLHttpRequest = XMLHttpRequest;

config();

const { ACCESS_TOKEN } = process.env;
const SUBSCRIPTION_CONFIG = {
  currency: "RUB",
  amount: 3,
  code: "subscribe",
};

const centrifuge = new Centrifuge(
  "wss://centrifugo.donationalerts.com/connection/websocket",
  {
    websocket: WebSocket,
    subscribeEndpoint:
      "https://www.donationalerts.com/api/v1/centrifuge/subscribe",
    subscribeHeaders: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  }
);

async function main() {
  try {
    const { data: user } = await getUser(ACCESS_TOKEN);
    centrifuge.setToken(user.socket_connection_token);
    centrifuge.connect();

    console.log("Listening to new donations");

    centrifuge.subscribe(`$alerts:donation_${user.id}`, handleDonation);
  } catch (error) {
    console.error("Error in main:", error);
  }
}

async function handleDonation(message) {
  const { data: donation } = message;

  const isDonationValid = await isDonationValidForSubscription(donation);
  if (!isDonationValid) return;

  try {
    await addSubscriptionToDb(donation);
    await addSubscriptionRole(donation.username);
    console.log("Subscription added successfully");
  } catch (error) {
    console.error("Error handling donation:", error);
  }
}

async function getUser(accessToken) {
  const url = "https://www.donationalerts.com/api/v1/user/oauth";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return await response.json();
}

async function isDonationValidForSubscription(donation) {
  const { amount, currency, message, username } = donation;

  if (currency !== SUBSCRIPTION_CONFIG.currency) return false;
  if (amount < SUBSCRIPTION_CONFIG.amount) return false;
  if (!containsWord(message, SUBSCRIPTION_CONFIG.code)) return false;
  const isSubscriptionActive = await checkForActiveSubscription(username);
  if (isSubscriptionActive) return false;

  return true;
}

function containsWord(str, word) {
  return new RegExp(`\\b${word}\\b`).test(str);
}

async function checkForActiveSubscription(username) {
  // Implement database check for active subscription
  // and check if user has subscription role in Discord
  return false;
}

async function addSubscriptionToDb(donation) {
  const { username, amount, currency, id, created_at } = donation;
  // Implement database call to add subscription
}

async function addSubscriptionRole(username) {
  // Implement Discord API call to add subscription role
}

main().catch(console.error);
