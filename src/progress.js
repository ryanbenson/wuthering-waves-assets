import cliProgress from "cli-progress";

const STATUS = {
  skip: "skip",
  fetch: "fetch",
  convert: "convert",
  compress: "compress",
  save: "save",
  fail: "fail",
  dryRun: "dry-run",
  force: "force",
};

const STATUS_LABEL = {
  [STATUS.skip]: "SKIP",
  [STATUS.fetch]: "FETCH",
  [STATUS.convert]: "CONVERT",
  [STATUS.compress]: "COMPRESS",
  [STATUS.save]: "SAVE",
  [STATUS.fail]: "FAIL",
  [STATUS.dryRun]: "DRY-RUN",
  [STATUS.force]: "FORCE",
};

function formatStatus(status, detail = "") {
  const tag = STATUS_LABEL[status] ?? status.toUpperCase();
  return detail ? `${tag} ${detail}` : tag;
}

export function createCategoryProgress(label, total, { dryRun = false } = {}) {
  const isInteractive = process.stdout.isTTY;
  const prefix = dryRun ? "[dry-run] " : "";

  if (!isInteractive) {
    let lastStatus = "";
    return {
      update(current, status, detail = "") {
        const line = formatStatus(status, detail);
        if (line !== lastStatus || current === total || current % 25 === 0) {
          console.log(
            `${prefix}${label} [${current}/${total}] ${line}`,
          );
          lastStatus = line;
        }
      },
      stop() {},
    };
  }

  const bar = new cliProgress.SingleBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: `{category} |{bar}| {percentage}% | {value}/{total} | ${prefix}{status}`,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
    },
    cliProgress.Presets.shades_classic,
  );

  bar.start(total, 0, { category: label.padEnd(11), status: "starting..." });

  return {
    update(current, status, detail = "") {
      bar.update(current, { status: formatStatus(status, detail) });
    },
    stop() {
      bar.stop();
      console.log("");
    },
  };
}

export { STATUS };
