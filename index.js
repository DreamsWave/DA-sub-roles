import config from "./config.js";
import {
  startCleaningService,
  stopCleaningService,
} from "./libs/cleaning-service.js";
import * as discord from "./libs/discord.js";
import * as donationAlerts from "./libs/donation-alerts.js";
import * as sheets from "./libs/sheets.js";
import * as utils from "./libs/utils.js";

/* MAIN LOGIC */
async function main() {
  try {
    await startCleaningService();

    await donationAlerts.connectToDonationAlerts(handleDonation);
  } catch (error) {
    console.error("Error in main:", error);
    stopCleaningService();
    process.exit(1);
  }
}
main().catch((error) => {
  console.error("Unhandled error:", error);
  stopCleaningService();
  process.exit(1);
});

// Checking if donation is valid and adding subscription to db and discord
async function handleDonation(message) {
  const { data: donation } = message;

  const isDonationValid = await isDonationValidForSubscription(donation);
  if (!isDonationValid) return;

  try {
    const addedRoleUser = await discord.addSubscriptionRole(donation.username);
    const addedSubscription = await sheets.addSubscriptionToDb({
      ...donation,
      discordId: addedRoleUser.user.id,
    });
    console.log(`Added subscription for ${donation.username}`);
  } catch (error) {
    console.error("Error handling donation:", error);
  }
}

async function isDonationValidForSubscription(donation) {
  const { amount, currency, message, username } = donation;

  if (currency !== config.subscription.currency) return false;
  if (amount < config.subscription.amount) return false;
  if (!utils.containsWord(message, config.subscription.code)) return false;
  const discordUser = await discord.getDiscordUser(username);
  if (!discordUser) return false;
  const user = await sheets.getSubscriberRowByUsername(username);
  if (user) return false;

  return true;
}
