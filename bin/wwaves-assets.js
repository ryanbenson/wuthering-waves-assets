#!/usr/bin/env node

import { Command } from "commander";
import dotenv from "dotenv";
import {
  fetchCharacters,
  fetchEchoes,
  fetchEnemies,
  fetchWeapons,
} from "../src/api.js";
import { CATEGORIES, downloadCategory } from "../src/downloader.js";

dotenv.config();

const FETCHERS = {
  characters: fetchCharacters,
  weapons: fetchWeapons,
  echoes: fetchEchoes,
  enemies: fetchEnemies,
};

function getOptions(command) {
  return {
    dryRun: command.opts().dryRun ?? false,
    force: command.opts().force ?? false,
  };
}

function addCommonOptions(command) {
  return command
    .option("--dry-run", "preview actions without downloading or writing files")
    .option("--force", "re-download and overwrite existing files");
}

async function runCategory(categoryKey, options) {
  return downloadCategory(categoryKey, FETCHERS[categoryKey], options);
}

async function runAll(options) {
  const totals = { downloaded: 0, skipped: 0, forced: 0, failed: 0 };

  for (const key of Object.keys(CATEGORIES)) {
    const result = await runCategory(key, options);
    totals.downloaded += result.downloaded;
    totals.skipped += result.skipped;
    totals.forced += result.forced ?? 0;
    totals.failed += result.failed;
  }

  const prefix = options.dryRun ? "[dry-run] " : "";
  const downloadLabel = options.dryRun ? "would download" : "downloaded";
  const forceLabel = options.dryRun ? "would overwrite" : "overwritten";

  const parts = [
    `${totals.downloaded} ${downloadLabel}`,
    `${totals.skipped} skipped`,
  ];

  if (totals.forced > 0) {
    parts.push(`${totals.forced} ${forceLabel}`);
  }

  if (totals.failed > 0) {
    parts.push(`${totals.failed} failed`);
  }

  console.log(`\n${prefix}All: ${parts.join(", ")}`);

  if (totals.failed > 0) {
    process.exitCode = 1;
  }
}

const program = new Command();

program
  .name("wwaves-assets")
  .description("Download and convert Wuthering Waves asset images")
  .version("1.0.0");

addCommonOptions(
  program
    .command("characters")
    .description("Download character portraits (PNG → images/)"),
).action(async function () {
  const result = await runCategory("characters", getOptions(this));
  if (result.failed > 0) process.exitCode = 1;
});

addCommonOptions(
  program
    .command("weapons")
    .description("Download weapon icons (PNG → images/weapons/)"),
).action(async function () {
  const result = await runCategory("weapons", getOptions(this));
  if (result.failed > 0) process.exitCode = 1;
});

addCommonOptions(
  program
    .command("echoes")
    .description("Download echo icons (WebP → images/echoes/)"),
).action(async function () {
  const result = await runCategory("echoes", getOptions(this));
  if (result.failed > 0) process.exitCode = 1;
});

addCommonOptions(
  program
    .command("enemies")
    .description("Download enemy icons (WebP → images/enemies/)"),
).action(async function () {
  const result = await runCategory("enemies", getOptions(this));
  if (result.failed > 0) process.exitCode = 1;
});

addCommonOptions(
  program.command("all").description("Download all asset categories"),
).action(async function () {
  await runAll(getOptions(this));
});

program.parse();
