#!/usr/bin/env node

/**
 * PageSpeed Insights Automation Script (Node.js)
 * Analyzes a URL using Google PageSpeed Insights API and captures screenshots of the results.
 */

const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");
const {appendToLogReport} = require("../../processing_report/process_report");
const getChromeExecutablePath = require('../../utils/detectChromePath')

class PageSpeedAutomation {
  constructor() {
    this.baseUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
    this.outputDir = "pagespeed_screenshots";
    this.browser = null;
    this.page = null;
  }

  async withRetry(fn, { retries = 3, delay = 1000, label = "operation" } = {}) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(
          `⚠️ ${label} failed (attempt ${attempt}/${retries}): ${error.message}`
        );
        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt - 1); // exponential backoff
          console.log(`⏳ Retrying ${label} after ${waitTime}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
        } else {
          console.error(`❌ ${label} failed after ${retries} attempts`);
          throw error;
        }
      }
    }
  }

  /**
   * Setup Puppeteer browser with appropriate options
   */
  async setupBrowser(headless = false) {
    const chromePath = getChromeExecutablePath();
    console.log("🚀 Launching browser...");
    this.browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--start-fullscreen", // 👈 This forces full screen
        "--disable-blink-features=AutomationControlled",
      ],
    });

    this.page = await this.browser.newPage();

    // Optional: Get the screen dimensions dynamically (if needed for viewport)
    const { width, height } = await this.page.evaluate(() => ({
      width: window.screen.width,
      height: window.screen.height,
    }));

    await this.page.setViewport({ width, height });

    // Set user agent and remove automation flags
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📂 Created directory: ${dirPath}`);
    }
  }


  /**
   * Navigate to Google PageSpeed Insights and analyze the URL
   */
  async navigateToPageSpeed(url) {
    try {
      console.log("🌐 Opening Google PageSpeed Insights...");
      await this.page.goto("https://pagespeed.web.dev/", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for the analyze input to be present
      console.log("⏳ Waiting for input field...");
      await this.page.waitForSelector(
        'input[type="url"], input[placeholder*="Enter"], input[name="url"]',
        {
          timeout: 10000,
        }
      );

      console.log(`🔍 Entering URL: ${url}`);
      const inputSelector =
        'input[type="url"], input[placeholder*="Enter"], input[name="url"]';
      await this.page.click(inputSelector);
      await this.page.evaluate((selector) => {
        document.querySelector(selector).value = "";
      }, inputSelector);

      await this.page.type(inputSelector, url);
      await this.page.keyboard.press("Enter");

      // Wait for analysis to complete
      console.log("⏳ Waiting for analysis to complete...");

      // Wait for either the scores to appear or error message
      await this.page.waitForFunction(
        () => {
          // Check for scores
          const scoreElements = document.querySelectorAll(
            '[data-score], .lh-gauge__percentage, .gauge, [class*="score"]'
          );
          const errorElements = document.querySelectorAll(
            '[class*="error"], .error-message'
          );

          return scoreElements.length > 0 || errorElements.length > 0;
        },
        { timeout: 120000 }
      );

      // Additional wait to ensure all content is loaded
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log("✅ Analysis complete, page loaded");
      return true;
    } catch (error) {
      console.error(
        `❌ Error navigating to PageSpeed Insights: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Switch to desktop view if currently on mobile
   */
  async switchToDesktopView() {
    try {
      // Look for desktop tab/button with various possible selectors
      const desktopSelectors = [
        'button[aria-label*="Desktop"]',
        'button:has-text("Desktop")',
        '[data-tab="desktop"]',
        'button[data-device="desktop"]',
        ".desktop-tab",
        'button:contains("Desktop")',
      ];

      let switched = false;
      for (const selector of desktopSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            console.log("🖥️ Switched to desktop view");
            switched = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!switched) {
        // Try clicking on text containing "Desktop"
        await this.page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll('button, [role="tab"], .tab')
          );
          const desktopButton = buttons.find(
            (btn) =>
              btn.textContent &&
              btn.textContent.toLowerCase().includes("desktop")
          );
          if (desktopButton) {
            desktopButton.click();
            return true;
          }
          return false;
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log("🖥️ Attempted to switch to desktop view");
      }

      return true;
    } catch (error) {
      console.log(
        "ℹ️ Desktop view button not found or already in desktop view"
      );
      return false;
    }
  }

  /**
   * Capture screenshot of the PageSpeed results with bounding box and offset
   */
  async captureScreenshot(
    filenamePrefix,
    offsetHorizontal,
    offsetVertical,
    scrollTo,
    screenshotBounds
  ) {
    try {
      // Determine subdirectory based on filenamePrefix
      let subDir = filenamePrefix.startsWith("diagnostics")
        ? "diagnostics"
        : "pagespeed";
    filenamePrefix,
    offsetHorizontal,
    offsetVertical,
    scrollTo,
    screenshotBounds
   {
    try {
      // Determine subdirectory based on filenamePrefix
      let subDir = filenamePrefix.startsWith("diagnostics")
        ? "diagnostics"
        : "pagespeed";

      const baseDir = path.resolve(__dirname, "..", "pagespeed_screenshots", subDir);
      await this.ensureDirectoryExists(baseDir);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")
        .join("_")
        .split(".")[0];

      const fullFilename = `${filenamePrefix}_${timestamp}.png`;
      const fullPath = path.join(baseDir, fullFilename);

      // Scroll and wait before capture
      await this.page.evaluate(() =>
        window.scrollTo(scrollTo.x, scrollTo.y)
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      
      const clip = {
        x: offsetHorizontal,
        y: offsetVertical,
        width: screenshotBounds.width,
        height: screenshotBounds.height,
      };

      await this.page.screenshot({
        path: fullPath,
        type: "png",
        clip,
      });
      await this.page.screenshot({
        path: fullPath,
        type: "png",
        clip,
      });

      console.log(`📸 Screenshot saved: ${fullPath}`);
      return fullPath;
    } catch (error) {
      console.error(`❌ Error capturing screenshot: ${error.message}`);
      return null;
    }
  }
      console.log(`📸 Screenshot saved: ${fullPath}`);
      return fullPath;
    } catch (error) {
      console.error(`❌ Error capturing screenshot: ${error.message}`);
      return null;
    }
  }

  /**
   * Wait for view to fully load and scores to update
   */
  async waitForViewToLoad(viewType = "unknown") {
    console.log(`⏳ Waiting for ${viewType} view to fully load...`);

    // Wait for any loading indicators to disappear
    try {
      await this.page.waitForFunction(
        () => {
          // Check if there are any loading spinners or progress indicators
          const loadingElements = document.querySelectorAll(
            '.loading, .spinner, [class*="loading"], [class*="spinner"], [aria-label*="loading"]'
          );
          return loadingElements.length === 0;
        },
        { timeout: 15000 }
      );
    } catch (e) {
      console.log(
        `ℹ️ Timeout waiting for loading indicators to disappear for ${viewType} view`
      );
    }

    // Additional wait to ensure scores are updated
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`✅ ${viewType} view fully loaded`);
  }

  /**
   * Extract performance scores from the current page with view-aware logic
   */
  async extractScoresFromPage(viewType = "unknown") {
    try {
      // Wait a bit more to ensure scores are updated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const scores = await this.page.evaluate((vType) => {
        const extractedScores = {};

        // First, try to detect which view is currently active
        const isDesktopActive = () => {
          const desktopButtons = document.querySelectorAll(
            'button[aria-label*="Desktop"], button[data-device="desktop"], [data-tab="desktop"]'
          );
          return Array.from(desktopButtons).some(btn =>
            btn.getAttribute('aria-selected') === 'true' ||
            btn.classList.contains('active') ||
            btn.classList.contains('selected')
          );
        };

        const isMobileActive = () => {
          const mobileButtons = document.querySelectorAll(
            'button[aria-label*="Mobile"], button[data-device="mobile"], [data-tab="mobile"]'
          );
          return Array.from(mobileButtons).some(btn =>
            btn.getAttribute('aria-selected') === 'true' ||
            btn.classList.contains('active') ||
            btn.classList.contains('selected')
          );
        };

        // Determine current view
        let currentView = "unknown";
        if (isDesktopActive()) {
          currentView = "desktop";
        } else if (isMobileActive()) {
          currentView = "mobile";
        }

        console.log(
          `View detection: Expected ${vType}, Detected ${currentView}`
        );

        // Look for score elements with more specific targeting
        const scoreSelectors = [
          // Primary score gauge
          ".lh-gauge__percentage",
          // Alternative selectors
          "[data-score]",
          ".gauge .gauge-value",
          ".score-value",
          '[class*="score-"]',
          // More specific Lighthouse selectors
          ".lh-gauge .lh-gauge__percentage",
          ".lh-category .lh-gauge__percentage",
        ];

        const categories = ["Performance"];

        // Try to find the most recent/visible score elements
        for (const selector of scoreSelectors) {
          const elements = document.querySelectorAll(selector);


          if (elements.length > 0) {
            // Filter for visible elements
            const visibleElements = Array.from(elements).filter((el) => {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              return rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0';
            });

            if (visibleElements.length > 0) {
              // For desktop view, try to get the last visible score (most recently updated)
              const targetElements = vType === 'desktop' ?
                visibleElements.slice(-categories.length) :
                visibleElements.slice(0, categories.length);

              targetElements.forEach((element, index) => {
                if (index < categories.length) {
                  const scoreText = element.textContent.trim();
                  const scoreMatch = scoreText.match(/\d+/);
                  if (scoreMatch) {
                    extractedScores[categories[index]] = parseInt(
                      scoreMatch[0]
                    );
                  }
                }
              });

              if (Object.keys(extractedScores).length > 0) {
                break;
              }
            }
          }
        }

        return extractedScores;
      }, viewType);

      console.log(`📊 Extracted ${viewType} scores:`, scores);
      return scores;
    } catch (error) {
      console.warn(`⚠️ Could not extract ${viewType} scores: ${error.message}`);
      return {};
    }
  }

  /**
   * Run the complete automation workflow
   */
  async runFullAutomation(url, captureBothViews = true) {
    const results = {
      url: url,
      screenshots: [],
      extractedScores: {},
      timestamp: new Date().toISOString(),
    };

    try {
      // Setup browser
      await this.setupBrowser();

      // Navigate to PageSpeed Insights and analyze URL
      if (
        !(await this.withRetry(() => this.navigateToPageSpeed(url), {
          retries: 3,
          delay: 2000,
          label: "navigateToPageSpeed",
        }))
      ) {
        return results;
      }

      // Wait for mobile view to load completely
      await this.waitForViewToLoad("mobile");

      // Capture mobile view first (default)
      console.log("📱 Capturing mobile view...");
      const sanitizedUrl = url
        .replace(/https?:\/\//, "")
        .replace(/[^a-zA-Z0-9]/g, "_");
      const mobileScreenshotVitals = await this.withRetry(
        () =>
          this.captureScreenshot(
            `pagespeed_mobile_${sanitizedUrl}`,
            480,
            385,
            { x: 0, y: 0 },
            { width: 950, height: 500 }
          ),
        { retries: 2, label: "mobile vitals screenshot" }
      );
      const mobileScreenshotDiagnostics = await this.withRetry(
        () =>
          this.captureScreenshot(
            `diagnostics_mobile_${sanitizedUrl}`,
            480,
            1530,
            { x: 0, y: 1400 },
            { width: 950, height: 1000 }
          ),
        { retries: 2, label: "mobile diagnostics screenshot" }
      );
      if (mobileScreenshotDiagnostics) {
        results.screenshots.push({
          platform: "mobile",
          type: "vitals",
          path: mobileScreenshotVitals,
        });
        results.screenshots.push({
          platform: "mobile",
          type: "diagnostics",
          path: mobileScreenshotDiagnostics,
        });
      }

      // Extract mobile scores
      const mobileScores = await this.withRetry(
        () => this.extractScoresFromPage("mobile"),
        { retries: 2, label: "extract mobile scores" }
      );
      if (Object.keys(mobileScores).length > 0) {
        results.extractedScores.mobile = mobileScores;
      }

      // Switch to desktop view and capture
      if (captureBothViews) {
        console.log("🖥️ Switching to desktop view...");
        await this.switchToDesktopView();

        // Wait for desktop view to fully load and scores to update
        await this.waitForViewToLoad("desktop");

        const desktopScreenshotVitals = await this.withRetry(
          () =>
            this.captureScreenshot(
              `pagespeed_desktop_${sanitizedUrl}`,
              480,
              385,
              { x: 0, y: 0 },
              { width: 950, height: 500 }
            ),
          { retries: 2, label: "desktop vitals screenshot" }
        );
        const desktopScreenshotDiagnostics = await this.withRetry(
          () =>
            this.captureScreenshot(
              `diagnostics_desktop_${sanitizedUrl}`,
              480,
              1465,
              { x: 0, y: 1400 },
              { width: 950, height: 1000 }
            ),
          { retries: 2, label: "desktop diagnostics screenshot" }
        );
        if (desktopScreenshotDiagnostics) {
          results.screenshots.push({
            platform: "desktop",
            type: "vitals",
            path: desktopScreenshotVitals,
          });
          results.screenshots.push({
            platform: "desktop",
            type: "diagnostics",
            path: desktopScreenshotDiagnostics,
          });
        }

        // Extract scores from desktop view with improved logic
        const desktopScores = await this.withRetry(
          () => this.extractScoresFromPage("desktop"),
          { retries: 2, label: "extract desktop scores" }
        );
        if (Object.keys(desktopScores).length > 0) {
          results.extractedScores.desktop = desktopScores;
        }
      }

      return results;
    } catch (error) {
      console.error(`❌ Automation error: ${error.message}`);
      return results;
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }

  /**
   * Save results to a JSON report file
   */
  async saveResultsReport(results, filename = "pagespeed_report.json") {
    try {
      await fs.writeFile(filename, JSON.stringify(results, null, 2));
      console.log(`📄 Report saved: ${filename}`);
    } catch (error) {
      console.error(`❌ Error saving report: ${error.message}`);
    }
  }
}

/**
 * Utility function to get user input
 */
function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Main function to run the automation
 */
async function InitializePagespeedAutomation(url) {
  console.log("🚀 PageSpeed Insights Automation Tool (Node.js)");
  console.log("=".repeat(50));

  try {
    if (!url) {
      console.log("❌ No URL provided");
      return;
    }

    // Add protocol if missing
    const finalUrl = url.startsWith("http") ? url : `https://${url}`;

    // Initialize automation
    const automation = new PageSpeedAutomation();

    // Run automation
    console.log(`\n🔄 Starting analysis for: ${finalUrl}`);
    const results = await automation.runFullAutomation(finalUrl);

    // Save report
    await automation.saveResultsReport(results);

    // Print summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 AUTOMATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`URL Analyzed: ${results.url}`);
    console.log(`Screenshots Captured: ${results.screenshots.length}`);

    results.screenshots.forEach((screenshot) => {
      console.log(
        `  - ${screenshot.type.charAt(0).toUpperCase() + screenshot.type.slice(1)
        }: ${screenshot.path}`
      );
    });

    if (Object.keys(results.extractedScores).length > 0) {
      console.log("\nExtracted Scores:");
      Object.entries(results.extractedScores).forEach(([viewType, scores]) => {
        console.log(
          `  ${viewType.charAt(0).toUpperCase() + viewType.slice(1)}:`
        );
        Object.entries(scores).forEach(([category, score]) => {
          console.log(`    ${category}: ${score}`);
        });
      });
    }

    appendToLogReport({ source: "Page Speed", purpose: "getting Performance and Diagnose", success: true, error: '' })
    console.log("\n✅ Automation completed successfully!");
    return results;
  } catch (error) {

    appendToLogReport({ source: "Page Speed", purpose: "getting Performance and Diagnose", success: true, error: error.message })
    console.error(`❌ Main execution error: ${error.message}`);
  }
}

// Run the script if called directly
if (require.main === module) {
  InitializePagespeedAutomation("squeegeedetail.com").catch(console.error);
}

module.exports = { InitializePagespeedAutomation };
