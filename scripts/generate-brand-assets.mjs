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

async function createLogoBuffers() {
  const trimmedLogo = await sharp(sourceLogoPath)
    .trim()
    .png()
    .toBuffer();

  const metadata = await sharp(trimmedLogo).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(
      "Could not determine the ReliefBridge logo dimensions.",
    );
  }

  let emblem = trimmedLogo;

  /*
   * If the source is a horizontal logo lockup, use its left square
   * section for the favicon and Apple icon. The complete logo remains
   * available for the social-sharing image.
   */
  if (metadata.width / metadata.height > 1.45) {
    const squareSize = Math.min(
      metadata.height,
      metadata.width,
    );

    emblem = await sharp(trimmedLogo)
      .extract({
        left: 0,
        top: 0,
        width: squareSize,
        height: metadata.height,
      })
      .trim()
      .png()
      .toBuffer();
  }

  return {
    completeLogo: trimmedLogo,
    emblem,
  };
}

function squareBackgroundSvg(size, cornerRadius) {
  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#082A4A"/>
          <stop offset="100%" stop-color="#0B4F82"/>
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

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    },
  })
    .composite([
      {
        input: squareBackgroundSvg(
          size,
          cornerRadius,
        ),
        top: 0,
        left: 0,
      },
      {
        input: resizedEmblem,
        gravity: "center",
      },
    ])
    .png()
    .toFile(outputPath);
}

async function createSocialImage({
  completeLogo,
  outputPath,
}) {
  const logo = await sharp(completeLogo)
    .resize({
      width: 610,
      height: 150,
      fit: "contain",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const background = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#061D35"/>
          <stop offset="58%" stop-color="#0A345B"/>
          <stop offset="100%" stop-color="#0B5A86"/>
        </linearGradient>

        <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#FFFFFF" opacity="0.08"/>
        </pattern>
      </defs>

      <rect width="1200" height="630" fill="url(#hero)"/>
      <rect width="1200" height="630" fill="url(#dots)"/>

      <rect
        x="54"
        y="48"
        width="700"
        height="190"
        rx="22"
        fill="#FFFFFF"
      />

      <rect
        x="54"
        y="267"
        width="88"
        height="7"
        rx="3.5"
        fill="#FFBF2F"
      />

      <text
        x="54"
        y="350"
        fill="#FFFFFF"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        font-weight="800"
      >
        Recovery coordination
      </text>

      <text
        x="54"
        y="420"
        fill="#FFBF2F"
        font-family="Arial, Helvetica, sans-serif"
        font-size="58"
        font-weight="800"
      >
        that closes the loop.
      </text>

      <text
        x="58"
        y="493"
        fill="#DCE9F4"
        font-family="Arial, Helvetica, sans-serif"
        font-size="27"
        font-weight="400"
      >
        Survivors · Cases · Unmet needs · Partner referrals · Reporting
      </text>

      <text
        x="58"
        y="564"
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

  await sharp(background)
    .composite([
      {
        input: logo,
        left: 96,
        top: 68,
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

  const { completeLogo, emblem } =
    await createLogoBuffers();

  await createSquareIcon({
    emblem,
    size: 512,
    padding: 54,
    outputPath: iconPath,
    cornerRadius: 96,
  });

  await createSquareIcon({
    emblem,
    size: 180,
    padding: 20,
    outputPath: appleIconPath,
    cornerRadius: 34,
  });

  await createSocialImage({
    completeLogo,
    outputPath: openGraphPath,
  });

  await fs.copyFile(
    openGraphPath,
    twitterImagePath,
  );

  console.log("");
  console.log(
    "ReliefBridge brand assets created successfully:",
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