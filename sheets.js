import { config } from "dotenv";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import moment from "moment";

config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

async function main() {
  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID,
    serviceAccountAuth
  );
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  // const newSubscriber = {
  //   username: "dreamswave",
  //   amount: 4,
  //   currency: "USD",
  //   donation_id: 123456,
  //   donation_created_at: "2019-09-29 10:00:00",
  //   expires_at: moment().add(1, "minute").format("YYYY-MM-DD HH:mm:ss"),
  // };
  // const subscriber = await createSubscriber(newSubscriber, sheet);
  // console.log(subscriber);

  // const deleted = await deleteSubscriber("ewrewrw", sheet);
  // console.log(deleted);

  // const isActive = await isSubscriberActive("qweryt", sheet);
  // console.log(isActive);
}

main();

async function getSubscriber(username, sheet) {
  const rows = await sheet.getRows();
  return rows.find((row) => row.get("username") === username);
}

async function createSubscriber(subscriber, sheet) {
  const createdRow = await sheet.addRow(subscriber);
  return createdRow;
}

async function deleteSubscriber(username, sheet) {
  const row = await getSubscriber(username, sheet);
  if (row) {
    await row.delete();
    return true;
  }
  return false;
}

async function isSubscriberActive(username, sheet) {
  const row = await getSubscriber(username, sheet);
  if (!row) return false;
  return moment(row.get("expires_at")).isAfter(moment());
}
