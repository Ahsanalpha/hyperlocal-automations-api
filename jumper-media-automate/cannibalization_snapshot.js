const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const getChromeExecutablePath = require('./utils/detectChromePath')

async function cannibalizationSnapshot(url, customFolder = 'screenshots') {
  let browser;
  let outputPath;
  let chromePath=getChromeExecutablePath();


  try {

    const screenshotsDir = path.join(process.cwd(), customFolder);
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log(`📁 Created directory: ${screenshotsDir}`);
    }

    // Generate timestamp for filename
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const filename = `cannibalization_${timestamp}.png`;
    outputPath = path.join(screenshotsDir, filename)
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

     // Wait for 2 seconds manually (instead of waitForTimeout)
  await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for the specific grid container
    await page.waitForSelector('.goog-inline-block.grid4-inner-container', { 
        visible: true, 
        timeout: 30000 
      });
  
      // Add slight delay for rendering completion
      await new Promise(resolve => setTimeout(resolve, 2000));
  


      // Capture with 10px padding around the element
      const padding = 10;
      await page.screenshot({
        path: outputPath,
        clip: {
          x: 40,
          y: 165,
          width:1400,
          height: 800 // Adjust height to fit the viewport
        },

        type: 'png'
      });
  
    // console.log(`Screenshot saved to ${outputPath}`);

    

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    if (browser) {
        
      await browser.close();
      return outputPath
    }
  }
}

module.exports = { cannibalizationSnapshot };