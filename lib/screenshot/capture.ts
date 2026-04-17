import chromium from "@sparticuz/chromium";
import { existsSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import sharp from "sharp";

const VIEWPORT = { width: 1280, height: 720, deviceScaleFactor: 1 };

function brandBarSvg(width: number): string {
  const label = process.env.BRAND_BAR_TEXT ?? "Social Proof";
  const sub = process.env.BRAND_BAR_SUBTEXT ?? "screenshot";
  return `
<svg width="${width}" height="56" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0f172a"/>
  <text x="20" y="34" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700" fill="#e2e8f0">${escapeXml(
    label
  )}</text>
  <text x="20" y="50" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="11" fill="#94a3b8">${escapeXml(
    sub
  )}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function applyPostLikeTweaks(page: Page, targetUrl: URL) {
  // Reduce motion / stabilize rendering.
  await page.emulateMediaType("screen");
  await page.addStyleTag({
    content: `
      * { animation: none !important; transition: none !important; caret-color: transparent !important; }
      ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
    `
  });

  const host = targetUrl.hostname.toLowerCase();

  if (host === "x.com" || host.endsWith(".x.com") || host.includes("twitter.com")) {
    await page.addStyleTag({
      content: `
        header, nav, aside { display: none !important; }
        [data-testid="BottomBar"], [data-testid="TopNavBar"] { display: none !important; }
        [role="dialog"] { display: none !important; }
        div[aria-label="Sign up"], div[aria-label="Log in"], div[aria-label="Login"] { display: none !important; }
      `
    });
  }

  if (host === "www.linkedin.com" || host === "linkedin.com") {
    await page.addStyleTag({
      content: `
        header, nav, aside, footer { display: none !important; }
        .authwall, .authwall-join-form, .authentication-outlet { display: none !important; }
        [role="dialog"] { display: none !important; }
      `
    });
  }
}

async function findPrimaryPostElement(page: Page, targetUrl: URL) {
  const host = targetUrl.hostname.toLowerCase();

  if (host === "x.com" || host.endsWith(".x.com") || host.includes("twitter.com")) {
    // On tweet pages, the primary post is typically an <article>.
    // We prefer an article within <main>.
    const handle =
      (await page.$("main article")) ??
      (await page.$('article[role="article"]')) ??
      (await page.$("article"));
    return handle;
  }

  if (host === "www.linkedin.com" || host === "linkedin.com") {
    // LinkedIn: try common post containers (varies by layout).
    const handle =
      (await page.$(".feed-shared-update-v2")) ??
      (await page.$('div[data-urn*="urn:li:activity"]')) ??
      (await page.$('div[data-test-id="post-content"]')) ??
      (await page.$("main"));
    return handle;
  }

  return null;
}

function detectWindowsChromeExecutablePath(): string | null {
  if (process.platform !== "win32") return null;

  const localAppData = process.env.LOCALAPPDATA;
  const programFiles = process.env.ProgramFiles;
  const programFilesX86 = process.env["ProgramFiles(x86)"];

  const candidates = [
    localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : null,
    programFiles ? `${programFiles}\\Google\\Chrome\\Application\\chrome.exe` : null,
    programFilesX86 ? `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe` : null,
    localAppData ? `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe` : null,
    programFiles ? `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe` : null,
    programFilesX86 ? `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe` : null
  ].filter((p): p is string => Boolean(p));

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

export async function captureBrandedScreenshot(pageUrl: string): Promise<Buffer> {
  const localExe = process.env.CHROMIUM_EXECUTABLE_PATH?.trim() || detectWindowsChromeExecutablePath();
  const executablePath = localExe || (await chromium.executablePath());
  const launchArgs = localExe
    ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    : chromium.args;

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath,
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    const targetUrl = new URL(pageUrl);
    await page.goto(pageUrl, {
      waitUntil: "networkidle2",
      timeout: 45_000
    });

    let shot: Buffer;
    try {
      await applyPostLikeTweaks(page, targetUrl);
      // Give the page a beat after style injection (avoid Puppeteer version differences).
      await new Promise((r) => setTimeout(r, 750));

      const el = await findPrimaryPostElement(page, targetUrl);
      if (el) {
        // Some sites/layouts can throw on element screenshot; if so, fall back to page screenshot.
        try {
          await el.evaluate((node) => {
            node.scrollIntoView({ block: "nearest", inline: "nearest" });
          });
          shot = (await el.screenshot({ type: "png" })) as Buffer;
        } catch {
          shot = (await page.screenshot({ type: "png", fullPage: false })) as Buffer;
        }
      } else {
        shot = (await page.screenshot({ type: "png", fullPage: false })) as Buffer;
      }
    } catch {
      // Fail-open: return a standard screenshot if any "post-like" logic fails.
      shot = (await page.screenshot({ type: "png", fullPage: false })) as Buffer;
    }

    const meta = await sharp(shot).metadata();
    const w = meta.width ?? VIEWPORT.width;
    const bar = Buffer.from(brandBarSvg(w), "utf8");

    return await sharp(shot)
      .extend({
        bottom: 56,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .composite([{ input: bar, gravity: "south" }])
      .png()
      .toBuffer();
  } finally {
    await browser.close();
  }
}
