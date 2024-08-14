import moment from "moment";
import config from "../config.js";

export function getExpirationDate() {
  return moment()
    .add(config.subscription.days, "days")
    .format("YYYY-MM-DD HH:mm:ss");
}

export function containsWord(str, word, options = { caseSensitive: false }) {
  const { caseSensitive } = options;
  const flags = caseSensitive ? "g" : "gi";
  const pattern = `\\b${word}\\b`;
  const regex = new RegExp(pattern, flags);
  return regex.test(str);
}

export function isExpired(expiresAt) {
  const expired = moment(expiresAt).isBefore(moment());
  return expired;
}
