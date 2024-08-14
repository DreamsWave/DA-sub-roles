import config from "../config.js";
import * as discord from "./discord.js";
import * as sheets from "./sheets.js";
import * as utils from "./utils.js";

let cleaningServiceId;

export default async function cleaningService() {
  const sheet = await sheets.getSpreadsheet();
  const rows = await sheet.getRows();
  for (const row of rows) {
    if (utils.isExpired(row.get("expires_at"))) {
      await discord.removeRoleFromUser(
        row.get("discord_id"),
        config.discord.subRoleId
      );
      await row.delete();
      console.log(`Removed subscription for ${row.get("username")}`);
    }
  }
  // console.log("Cleaning done");
}

export async function startCleaningService() {
  console.log("Starting cleaning service");
  try {
    await cleaningService();
    cleaningServiceId = setInterval(
      cleaningService,
      config.cleanSubsTimeInMinutes * 60 * 1000
    );
  } catch (error) {
    console.error("Error starting cleaning service:", error);
  }
  return cleaningServiceId;
}

export async function stopCleaningService() {
  clearInterval(cleaningServiceId);
  console.log("Cleaning service stopped");
}
