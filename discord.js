import dotenv from "dotenv";
dotenv.config();

const baseUrl = "https://discord.com/api/v10";
const guildId = process.env.DISCORD_GUILD_ID;
const botToken = `Bot ${process.env.DISCORD_BOT_TOKEN}`;
const subRoleId = process.env.DISCORD_SUB_ROLE_ID;

async function main() {
  // const isSub = await isUserSubscribed("dreams");
  // console.log(isSub);
}

main();

async function isUserSubscribed(username) {
  const foundUsers = await findUser(username);
  const user = foundUsers.find((user) => hasUserRole(user, subRoleId));
  return !!user;
}

async function addSubRoleToUserId(userId) {
  const url = new URL(
    `${baseUrl}/guilds/${guildId}/members/${userId}/roles/${subRoleId}`
  );
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: botToken,
      },
    });
    if (response.ok) {
      return true;
    }
    throw { status: response.status, statusText: response.statusText };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function deleteSubRoleInUserId(userId) {
  const url = new URL(
    `${baseUrl}/guilds/${guildId}/members/${userId}/roles/${subRoleId}`
  );
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: botToken,
      },
    });
    if (response.ok) {
      return true;
    }
    throw { status: response.status, statusText: response.statusText };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

function hasUserRole(user, roleId) {
  return user.roles.includes(roleId);
}

async function findUser(username) {
  if (!username) return null;
  const url = new URL(
    `${baseUrl}/guilds/${guildId}/members/search?limit=100&query=${username}`
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: botToken,
      },
    });
    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
