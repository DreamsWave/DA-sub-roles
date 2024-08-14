import Centrifuge from "centrifuge";
import WebSocket from "ws";
import { XMLHttpRequest } from "xmlhttprequest";
import config from "../config.js";
global.XMLHttpRequest = XMLHttpRequest;

export const centrifuge = new Centrifuge(
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

export async function getDonationAlertsUser(accessToken) {
  const url = "https://www.donationalerts.com/api/v1/user/oauth";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return await response.json();
}

export async function connectToDonationAlerts(callback) {
  try {
    const { data: user } = await getDonationAlertsUser(
      config.donationAlertsAccessToken
    );
    centrifuge.setToken(user.socket_connection_token);
    centrifuge.connect();

    console.info("Listening to new donations");
    centrifuge.subscribe(`$alerts:donation_${user.id}`, callback);
  } catch (error) {
    console.error("Error connecting to DonationAlerts:", error);
    // Consider retrying or exiting the process
  }
}
