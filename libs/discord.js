import config from "../config.js";

export async function getDiscordUser(username) {
  const users = await searchUsers(username);
  const fetchedUser = await fetchDiscordUser(users[0].user.id);
  if (fetchedUser.username === String(username).toLocaleLowerCase())
    return fetchedUser;
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

export async function addSubscriptionRole(username) {
  const users = await searchUsers(username);
  const user = users[0];
  const added = await addRoleToUser(user.user.id, config.discord.subRoleId);
  if (added) return user;
  return null;
}
