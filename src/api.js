const CHARACTER_LIST_URL =
  "https://api-v2.encore.moe/api/en/character?v=Beta";
const WEAPON_LIST_URL = "https://api-v2.encore.moe/api/en/weapon?v=Beta";
const ECHO_LIST_URL = "https://api-v2.encore.moe/api/en/echo?v=Beta";
const MONSTER_LIST_URL = "https://api-v2.encore.moe/api/en/monster?v=Beta";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${url}`);
  }
  return response.json();
}

export async function fetchCharacters() {
  const data = await fetchJson(CHARACTER_LIST_URL);
  return data.roleList.map((item) => ({
    id: item.Id,
    name: item.Name,
    iconUrl: item.RoleHeadIcon,
  }));
}

export async function fetchWeapons() {
  const data = await fetchJson(WEAPON_LIST_URL);
  return data.weapons.map((item) => ({
    id: item.Id,
    name: item.Name,
    iconUrl: item.Icon,
  }));
}

export async function fetchEchoes() {
  const data = await fetchJson(ECHO_LIST_URL);
  return data.Echo.map((item) => ({
    id: item.Id,
    name: item.Name,
    iconUrl: item.Icon,
  }));
}

export async function fetchEnemies() {
  const data = await fetchJson(MONSTER_LIST_URL);
  return data.monsterList.map((item) => ({
    id: item.Id,
    name: item.Name,
    iconUrl: item.Icon,
  }));
}
