import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import tinify from "tinify";
import {
  assignFilenames,
  getCharacterGenderSuffix,
  sanitizeFilename,
  toPascalCase,
} from "./naming.js";
import { createCategoryProgress, STATUS } from "./progress.js";

const IMAGE_ROOT = path.resolve("images");

export const CATEGORIES = {
  characters: {
    label: "Characters",
    outputDir: IMAGE_ROOT,
    extension: "png",
    compress: true,
    getItems: (fetchCharacters) => fetchCharacters(),
    resolveFilenames: (items) => {
      const nameCounts = new Map();
      for (const item of items) {
        nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
      }

      return items.map((item) => {
        let filename = toPascalCase(item.name);
        if ((nameCounts.get(item.name) ?? 0) > 1) {
          const gender = getCharacterGenderSuffix(item.iconUrl);
          if (gender) {
            filename = `${filename}${gender}`;
          } else {
            filename = `${filename}${item.id}`;
          }
        }
        return { ...item, filename: sanitizeFilename(filename) };
      });
    },
  },
  weapons: {
    label: "Weapons",
    outputDir: path.join(IMAGE_ROOT, "weapons"),
    extension: "png",
    compress: true,
    getItems: (fetchWeapons) => fetchWeapons(),
    resolveFilenames: (items) =>
      assignFilenames(items, (item) => toPascalCase(item.name)),
  },
  echoes: {
    label: "Echoes",
    outputDir: path.join(IMAGE_ROOT, "echoes"),
    extension: "webp",
    compress: false,
    getItems: (fetchEchoes) => fetchEchoes(),
    resolveFilenames: (items) =>
      assignFilenames(items, (item) => toPascalCase(item.name)),
  },
  enemies: {
    label: "Enemies",
    outputDir: path.join(IMAGE_ROOT, "enemies"),
    extension: "webp",
    compress: false,
    getItems: (fetchEnemies) => fetchEnemies(),
    resolveFilenames: (items) =>
      items.map((item) => ({ ...item, filename: String(item.id) })),
  },
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function compressPng(buffer, apiKey, warnedRef) {
  if (!apiKey) {
    if (!warnedRef.value) {
      console.warn("\nWarning: TINYPNG_API_KEY not set, skipping compression");
      warnedRef.value = true;
    }
    return buffer;
  }

  tinify.key = apiKey;
  const source = tinify.fromBuffer(buffer);
  return source.toBuffer();
}

async function processImage(buffer, extension, compress, apiKey, warnedRef) {
  if (extension === "png") {
    let pngBuffer = await sharp(buffer).png().toBuffer();
    if (compress) {
      pngBuffer = await compressPng(pngBuffer, apiKey, warnedRef);
    }
    return pngBuffer;
  }

  if (extension === "webp") {
    const metadata = await sharp(buffer).metadata();
    if (metadata.format === "webp") {
      return buffer;
    }
    return sharp(buffer).webp().toBuffer();
  }

  throw new Error(`Unsupported extension: ${extension}`);
}

function formatSummary(label, stats, { dryRun = false } = {}) {
  const prefix = dryRun ? "[dry-run] " : "";
  const downloadLabel = dryRun ? "would download" : "downloaded";
  const forceLabel = dryRun ? "would overwrite" : "overwritten";

  const parts = [
    `${stats.downloaded} ${downloadLabel}`,
    `${stats.skipped} skipped`,
  ];

  if (stats.forced > 0) {
    parts.push(`${stats.forced} ${forceLabel}`);
  }

  if (stats.failed > 0) {
    parts.push(`${stats.failed} failed`);
  }

  return `${prefix}${label}: ${parts.join(", ")}`;
}

export async function downloadCategory(categoryKey, fetchFn, options = {}) {
  const category = CATEGORIES[categoryKey];
  const apiKey = options.apiKey ?? process.env.TINYPNG_API_KEY;
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;
  const compressWarned = { value: false };

  if (!dryRun) {
    await fs.mkdir(category.outputDir, { recursive: true });
  }

  console.log(`\nFetching ${category.label.toLowerCase()} list...`);
  const items = await category.getItems(fetchFn);
  const resolved = category.resolveFilenames(items);

  const progress = createCategoryProgress(category.label, resolved.length, {
    dryRun,
  });

  const stats = { downloaded: 0, skipped: 0, forced: 0, failed: 0 };
  const failures = [];

  for (let index = 0; index < resolved.length; index++) {
    const item = resolved[index];
    const filename = `${item.filename}.${category.extension}`;
    const outputPath = path.join(category.outputDir, filename);
    const exists = await fileExists(outputPath);

    if (exists && !force) {
      stats.skipped++;
      progress.update(index + 1, STATUS.skip, filename);
      continue;
    }

    if (dryRun) {
      if (exists && force) {
        stats.forced++;
        progress.update(index + 1, STATUS.force, filename);
      } else {
        stats.downloaded++;
        progress.update(index + 1, STATUS.dryRun, filename);
      }
      continue;
    }

    try {
      progress.update(index + 1, STATUS.fetch, filename);
      const buffer = await downloadBuffer(item.iconUrl);

      progress.update(index + 1, STATUS.convert, filename);
      const output = await processImage(
        buffer,
        category.extension,
        category.compress,
        apiKey,
        compressWarned,
      );

      if (category.compress && category.extension === "png" && apiKey) {
        progress.update(index + 1, STATUS.compress, filename);
      }

      progress.update(index + 1, STATUS.save, filename);
      await fs.writeFile(outputPath, output);

      if (exists && force) {
        stats.forced++;
        progress.update(index + 1, STATUS.force, filename);
      } else {
        stats.downloaded++;
        progress.update(index + 1, STATUS.save, filename);
      }
    } catch (error) {
      stats.failed++;
      const message =
        error instanceof Error ? error.message : String(error);
      failures.push({ filename, message });
      progress.update(index + 1, STATUS.fail, filename);
    }
  }

  progress.stop();

  console.log(formatSummary(category.label, stats, { dryRun }));

  if (failures.length > 0) {
    console.log("Failures:");
    for (const { filename, message } of failures) {
      console.log(`  ! ${filename}: ${message}`);
    }
  }

  return stats;
}
