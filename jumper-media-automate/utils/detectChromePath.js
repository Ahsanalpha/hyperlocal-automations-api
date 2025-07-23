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

module.export = getChromeExecutablePath;