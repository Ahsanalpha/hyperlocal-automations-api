/**
 * rich-results-script.js
 *
 * Automates Google's Rich Results Test:
 * 1. Navigates to https://search.google.com/test/rich-results
 * 2. Moves cursor → clicks URL input → types URL → presses Enter
 * 3. Waits until results finish loading (with retry logic)
 * 4. Draws a red bounding box (for visualization) at the specified region
 * 5. Takes a clipped screenshot of that region
 *
 * Usage:
 *   node rich-results-script.js \
 *     --url="https://example.com" \
 *     --x=100 --y=200 --width=800 --height=600 \
 *     --output="result.png"
 *
 * Flags:
 *   --url       (required) The webpage URL to test
 *   --x         (optional, default=0)   X coordinate of the clip region
 *   --y         (optional, default=0)   Y coordinate of the clip region
 *   --width     (optional, default=1024)  Width of the clip region
 *   --height    (optional, default=768)   Height of the clip region
 *   --output    (optional, default="rich-results.png") Output screenshot filename
 *   --retries   (optional, default=3)    Number of times to retry on failure
 *   --timeout   (optional, default=60000) Timeout per step in milliseconds
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {appendToLogReport} = require("./processing_report/process_report")

// Helper function to replace waitForTimeout
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function parseArgs(inputUrl) {
  const config = {
    url: inputUrl,
    x: 470,
    y: 230,
    width: 970,
    height: 560,
    output: "rich-results.png",
    retries: 3,
    timeout: 60000,
  };

  if (!config.url) {
    console.error("ERROR: --url is required");
    process.exit(1);
  }

  return config;
}

async function handleRetryOnFailure(page, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 1) Check if "Something went wrong" modal is visible
    const errorModalVisible = await page.evaluate(() =>
      Array.from(document.querySelectorAll("div, span")).some((el) =>
        /something went wrong/i.test(el.innerText)
      )
    );

    if (!errorModalVisible) {
      // No error → nothing to retry
      return;
    }

    console.warn(
      `⚠️ 'Something went wrong' detected. Attempt ${attempt}/${maxRetries}...`
    );

    // 2) Click "Dismiss" if it's there
   if (typeof page.$x === 'function') {
  const [dismissButton] = await page.$x(
    "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'dismiss')]"
  );
  if (dismissButton) {
    await dismissButton.click();
    await delay(1000);
  }
} else {
  throw new Error("page.$x is not available – page might not be initialized properly.");
}
    if (dismissButton) {
      await dismissButton.click();
      // Give the modal a moment to close
      await delay(1000);
    }

    // 3) Re‐submit by pressing Enter on the already‐filled input
    //    First ensure the input is still visible, then press Enter.
    const inputSelector = 'input[type="url"], input[type="text"], input#url';
    await page.waitForSelector(inputSelector, { visible: true });
    await page.focus(inputSelector);
    await page.keyboard.press("Enter");
    console.log("🔁 Retrying test by pressing Enter on the URL input...");
    // Wait a little for the test to restart
    await delay(3000);
  }

  // 4) After all retries, check if the modal is still visible—if so, throw.
  const stillFailing = await page.evaluate(() =>
    Array.from(document.querySelectorAll("div, span")).some((el) =>
      /something went wrong/i.test(el.innerText)
    )
  );

  if (stillFailing) {
    throw new Error(
      "❌ Repeated 'Something went wrong' errors after max retries."
    );
  }
}

// Helper to retry an async operation with exponential backoff
async function retryOperation(fn, retries = 3, delayMs = 1000) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      const backoff = delayMs * 2 ** (attempt - 1);
      console.warn(
        `Operation failed (attempt ${attempt}/${retries}). Retrying in ${backoff}ms...`
      );
      await delay(backoff);
    }
  }
}

// Wait until the Rich Results Test is complete by polling for a known DOM change.
async function waitForTestCompletion(page, timeout) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const hasLoadingSpinner = await page.evaluate(() => {
      // Look for a spinner or "Testing…" label
      const spinner = document.querySelector(
        'div[class*="LoadingSpinner"], div[aria-label*="Testing"]'
      );
      return !!spinner;
    });
    if (hasLoadingSpinner) {
      // Still loading
      await delay(1000);
      continue;
    }

    // Check for a known indicator that results are shown
    const resultsVisible = await page.evaluate(() => {
      // 1) "View details" button
      if (document.querySelector('button[aria-label*="View details"]'))
        return true;
      // 2) A <pre> block (JSON‐LD)
      if (document.querySelector("pre")) return true;
      // 3) "TEST COMPLETE" text in a <span>
      const completeTag = Array.from(document.querySelectorAll("span")).find(
        (el) => /\bTEST COMPLETE\b/i.test(el.innerText)
      );
      return !!completeTag;
    });

    if (resultsVisible) {
      return;
    }

    // Otherwise, wait another second and poll again
    await delay(1000);
  }

  throw new Error("Timed out waiting for Rich Results Test to complete");
}

// Function to detect Chrome executable path
function getChromeExecutablePath() {
  const platform = os.platform();
  
  if (platform === 'linux') {
    // Try different possible Chrome locations on Linux
    const possiblePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/usr/bin/google-chrome-unstable',
      '/usr/bin/google-chrome-beta'
    ];
    
    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`Found Chrome at: ${chromePath}`);
        return chromePath;
      }
    }
    
    // If no Chrome found, return null to use bundled Chromium
    console.log('No Chrome installation found, using bundled Chromium');
    return null;
  } else if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  
  return null;
}

// Function to get user data directory
function getUserDataDirectory() {
  const platform = os.platform();
  
  if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'google-chrome');
  } else if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  }
  
  return path.join(os.homedir(), '.config', 'google-chrome');
}

async function InitializeRichResultsScript(inputUrl) {
try{
  const { url, x, y, width, height, output, retries, timeout } =
    await parseArgs(inputUrl);

  const chromeExecutablePath = getChromeExecutablePath();
  const userDataDir = getUserDataDirectory();
  const userProfile = "Default";

  // Chrome launch options
  const launchOptions = {
    executablePath: process.env.CHROME_PATH,
    headless: false,
    args: [
      "--start-maximized",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor"
    ]
  };

  // Add executable path if Chrome is found
  if (chromeExecutablePath) {
    launchOptions.executablePath = chromeExecutablePath;
  }

  // Add user data directory if it exists
  if (fs.existsSync(userDataDir)) {
    launchOptions.userDataDir = path.join(userDataDir, userProfile);
  }

  console.log('Launch options:', launchOptions);

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
    console.error('Failed to launch with custom Chrome, trying with bundled Chromium...');
    // Fallback to bundled Chromium
    const fallbackOptions = {
      headless: false,
      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    };
    browser = await puppeteer.launch(fallbackOptions);
  }

  const page = await browser.newPage();

  console.log('Browser launched successfully...');

  await page.setViewport({ width: 1920, height: 1200 });

  // Increase default timeout
  page.setDefaultTimeout(timeout);

  try {
    // 1) Navigate to the Rich Results Test page
    console.log('Navigating to Rich Results Test...');
    await retryOperation(
      () =>
        page.goto("https://search.google.com/test/rich-results", {
          waitUntil: "domcontentloaded",
        }),
      retries,
      1000
    );

    // 2) Wait for the URL input field to appear
    console.log('Waiting for URL input field...');
    const inputSelector = 'input[type="url"], input[type="text"], input#url';
    await retryOperation(
      () => page.waitForSelector(inputSelector, { visible: true }),
      retries,
      1000
    );

    // 3) Move cursor to the input, click it, type URL, and press Enter
    console.log('Interacting with URL input...');
    const inputHandle = await page.$(inputSelector);
    const box = await inputHandle.boundingBox();
    if (box) {
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height / 2;
      // Move the mouse in small steps to simulate a human
      await page.mouse.move(clickX, clickY, { steps: 20 });
      await delay(200);
      await page.mouse.click(clickX, clickY);
    } else {
      // Fallback to focusing if boundingBox() fails
      await page.focus(inputSelector);
    }

    // Clear input first, then type the URL
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.type(url, { delay: 100 });
    await page.keyboard.press("Enter");
    
    console.log(`Testing URL: ${url}`);
    
    // Wait a moment for the test to start
    await delay(3000);

    // 4) Handle "Something went wrong" modal (up to 5 retries)
    console.log('Checking for errors...');
    await handleRetryOnFailure(page);

    // 5) Wait for the test to actually complete
    console.log('Waiting for test completion...');
    await waitForTestCompletion(page, timeout);

    // 6) Draw a red bounding‐box overlay (for visualization)
    console.log('Drawing overlay and taking screenshot...');
    await page.evaluate(
      ({ x, y, width, height }) => {
        const existing = document.getElementById("__clipOverlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "__clipOverlay";
        overlay.style.position = "absolute";
        overlay.style.top = `${y}px`;
        overlay.style.left = `${x}px`;
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
        overlay.style.border = "2px solid red";
        overlay.style.zIndex = "999999";
        overlay.style.pointerEvents = "none";
        document.body.appendChild(overlay);
      },
      { x, y, width, height }
    );

    // Give the overlay a moment to render
    await delay(2500);

    // 7) Take a screenshot of the specified region
    const screenshotDir = path.join(process.cwd(), "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const outputPath = path.join(screenshotDir, output);
    await page.screenshot({
      path: outputPath,
      clip: { x, y, width, height },
    });

    console.log(`✅ Screenshot saved to ${outputPath}`);
    appendToLogReport({source:"Rich Result",success:true,error:''})
    return outputPath;
  } catch (err) {
    console.error("❌ Error during automation:", err);
    throw err; // Re-throw instead of process.exit to allow proper cleanup
  } finally {
    if (browser) {
      await browser.close();
    }
  }

}
catch(error){

  console.log("_________________________-----RICH SCRIPT ERROR----________________\n")
  console.log("error rich script:",error.message)
  appendToLogReport({source:"Rich Result",success:false,error:error.message})
}
}

module.exports = { InitializeRichResultsScript };

if (require.main === module) {
  InitializeRichResultsScript('https://squeegeedetail.com').catch((error) => {
    console.error("Script Error:", error);
    // process.exit(1);
  });
}