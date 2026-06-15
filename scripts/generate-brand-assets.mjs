import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();

const sourceLogoPath = path.join(
  projectRoot,
  "public",
  "reliefbridge-logo.png",
);

const appDirectory = path.join(
  projectRoot,
  "src",
  "app",
);

const iconPath = path.join(appDirectory, "icon.png");
const appleIconPath = path.join(appDirectory, "apple-icon.png");
const openGraphPath = path.join(
  appDirectory,
  "opengraph-image.png",
);
const twitterImagePath = path.join(
  appDirectory,
  "twitter-image.png",
);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function squareBackgroundSvg(size, cornerRadius) {
  return Buffer.from(`
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="background"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stop-color="#062747"/>
          <stop offset="100%" stop-color="#0B5688"/>
        </linearGradient>
      </defs>

      <rect
        width="${size}"
        height="${size}"
        rx="${cornerRadius}"
        fill="url(#background)"
      />
    </svg>
  `);
}

async function loadShieldEmblem() {
  const source = sharp(sourceLogoPath).ensureAlpha();
  const metadata = await source.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(
      "Could not determine the ReliefBridge logo dimensions.",
    );
  }

  /*
   * The source file is a horizontal ReliefBridge lockup.
   * This proportional crop isolates the shield emblem and
   * removes the wordmark and unwanted edge blocks.
   */
  const left = Math.round(metadata.width * 0.11);
  const top = Math.round(metadata.height * 0.05);
  const width = Math.round(metadata.width * 0.3);
  const height = Math.round(metadata.height * 0.9);

  const safeWidth = Math.min(
    width,
    metadata.width - left,
  );

  const safeHeight = Math.min(
    height,
    metadata.height - top,
  );

  return sharp(sourceLogoPath)
    .ensureAlpha()
    .extract({
      left,
      top,
      width: safeWidth,
      height: safeHeight,
    })
    .trim({
      threshold: 12,
    })
    .png()
    .toBuffer();
}

async function createSquareIcon({
  emblem,
  size,
  padding,
  outputPath,
  cornerRadius,
}) {
  const innerSize = size - padding * 2;

  const resizedEmblem = await sharp(emblem)
    .resize({
      width: innerSize,
      height: innerSize,
      fit: "contain",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  await sharp(squareBackgroundSvg(size, cornerRadius))
    .composite([
      {
        input: resizedEmblem,
        gravity: "center",
      },
    ])
    .png()
    .toFile(outputPath);
}

function socialBackgroundSvg() {
  return Buffer.from(`
    <svg
      width="1200"
      height="630"
      viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="hero"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stop-color="#061D35"/>
          <stop offset="58%" stop-color="#0A345B"/>
          <stop offset="100%" stop-color="#0B5A86"/>
        </linearGradient>

        <pattern
          id="dots"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="2"
            cy="2"
            r="1.4"
            fill="#FFFFFF"
            opacity="0.08"
          />
        </pattern>
      </defs>

      <rect width="1200" height="630" fill="url(#hero)"/>
      <rect width="1200" height="630" fill="url(#dots)"/>

      <rect
        x="54"
        y="42"
        width="720"
        height="180"
        rx="24"
        fill="#FFFFFF"
      />

      <text
        x="226"
        y="122"
        fill="#082A4A"
        font-family="Arial, Helvetica, sans-serif"
        font-size="52"
        font-weight="800"
      >
        ReliefBridge
      </text>

      <text
        x="229"
        y="164"
        fill="#46576A"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="700"
        letter-spacing="3"
      >
        DISASTER RECOVERY COORDINATION
      </text>

      <rect
        x="54"
        y="260"
        width="88"
        height="7"
        rx="3.5"
        fill="#FFBF2F"
      />

      <text
        x="54"
        y="348"
        fill="#FFFFFF"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        font-weight="800"
      >
        Recovery coordination
      </text>

      <text
        x="54"
        y="418"
        fill="#FFBF2F"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        font-weight="800"
      >
        that closes the loop.
      </text>

      <text
        x="58"
        y="491"
        fill="#DCE9F4"
        font-family="Arial, Helvetica, sans-serif"
        font-size="27"
      >
        Survivors · Cases · Unmet needs · Partner referrals · Reporting
      </text>

      <text
        x="58"
        y="565"
        fill="#FFFFFF"
        font-family="Arial, Helvetica, sans-serif"
        font-size="24"
        font-weight="700"
      >
        reliefbridge.net
      </text>

      <path
        d="M920 102 L1127 102 L1127 309"
        fill="none"
        stroke="#FFBF2F"
        stroke-width="14"
        stroke-linecap="round"
      />

      <path
        d="M856 166 L1063 166 L1063 373"
        fill="none"
        stroke="#FFFFFF"
        stroke-opacity="0.17"
        stroke-width="14"
        stroke-linecap="round"
      />
    </svg>
  `);
}

async function createSocialImage({
  emblem,
  outputPath,
}) {
  const socialEmblem = await sharp(emblem)
    .resize({
      width: 138,
      height: 138,
      fit: "contain",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  await sharp(socialBackgroundSvg())
    .composite([
      {
        input: socialEmblem,
        left: 72,
        top: 62,
      },
    ])
    .png()
    .toFile(outputPath);
}

async function main() {
  if (!(await fileExists(sourceLogoPath))) {
    throw new Error(
      `ReliefBridge logo not found: ${sourceLogoPath}`,
    );
  }

  await fs.mkdir(appDirectory, {
    recursive: true,
  });

  const emblem = await loadShieldEmblem();

  await createSquareIcon({
    emblem,
    size: 512,
    padding: 30,
    outputPath: iconPath,
    cornerRadius: 96,
  });

  await createSquareIcon({
    emblem,
    size: 180,
    padding: 11,
    outputPath: appleIconPath,
    cornerRadius: 34,
  });

  await createSocialImage({
    emblem,
    outputPath: openGraphPath,
  });

  await fs.copyFile(
    openGraphPath,
    twitterImagePath,
  );

  console.log("");
  console.log(
    "ReliefBridge shield assets created successfully:",
  );
  console.log(iconPath);
  console.log(appleIconPath);
  console.log(openGraphPath);
  console.log(twitterImagePath);
}

main().catch((error) => {
  console.error("");
  console.error(
    "Could not generate ReliefBridge brand assets.",
  );
  console.error(error);
  process.exit(1);
});