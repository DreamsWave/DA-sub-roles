import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import moment from "moment";
import config from "../config.js";
import * as utils from "./utils.js";

export async function getSpreadsheet() {
  const serviceAccountAuth = new JWT({
    email: config.google.email,
    key: config.google.key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(config.google.sheetId, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  return sheet;
}

export async function getSubscriberRowByUsername(username) {
  const sheet = await getSpreadsheet();
  const rows = await sheet.getRows();
  return rows.find(
    (row) => row.get("username") === String(username).toLowerCase()
  );
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

export async function addSubscriptionToDb(donation) {
  const { username, amount, currency, id, created_at, discordId } = donation;
  const newSubscriber = {
    username: String(username).toLowerCase(),
    amount,
    currency,
    donation_id: id,
    // donation_created_at: created_at,
    donation_created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    expires_at: utils.getExpirationDate(),
    discord_id: discordId,
  };
  const createdSubscriber = await createSubscriberRow(newSubscriber);
  return createdSubscriber.toObject();
}
