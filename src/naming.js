/**
 * Strip non-alphanumeric characters from a filename.
 */
export function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Convert an API display name to a PascalCase, alphanumeric-only filename.
 * "Xiangli Yao" -> "XiangliYao"
 * "Firstlight's Herald" -> "FirstlightsHerald"
 * "Phantom: Mourning Aix" -> "PhantomMourningAix"
 * "Jué" -> "Jue"
 */
export function toPascalCase(name) {
  const normalized = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/'/g, "");

  const words = normalized.match(/[a-zA-Z0-9]+/g) ?? [];

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Derive a gender suffix for duplicate character names based on icon URL.
 * Rover variants use _4 (Male) and _5 (Female) icon suffixes.
 */
export function getCharacterGenderSuffix(iconUrl) {
  const match = iconUrl.match(/T_IconRoleHead150_(\d+)\.webp$/i);
  if (!match) return "";
  if (match[1] === "4") return "Male";
  if (match[1] === "5") return "Female";
  return "";
}

/**
 * Assign unique filenames within a batch, appending disambiguators when needed.
 */
export function assignFilenames(items, getBaseName) {
  const used = new Map();
  return items.map((item) => {
    let baseName = getBaseName(item);
    const count = used.get(baseName) ?? 0;
    used.set(baseName, count + 1);

    if (count > 0) {
      baseName = sanitizeFilename(`${baseName}${item.id}`);
    }

    return { ...item, filename: sanitizeFilename(baseName) };
  });
}
