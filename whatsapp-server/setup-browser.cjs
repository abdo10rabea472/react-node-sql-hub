/**
 * تنزيل Chromium تلقائياً عند أول تشغيل
 * يتم استدعاؤه من Electron قبل بدء سيرفر الواتساب
 */
const { install, resolveBuildId, detectBrowserPlatform, Browser, Cache } = require('@puppeteer/browsers');
const path = require('path');
const fs = require('fs');

async function setupBrowser(cacheDir) {
  console.log('[Browser Setup] Cache dir:', cacheDir);
  
  // Check if Chrome already exists
  const cache = new Cache(cacheDir);
  const installedBrowsers = cache.getInstalledBrowsers();
  
  if (installedBrowsers.length > 0) {
    const execPath = installedBrowsers[0].executablePath;
    console.log('[Browser Setup] Chrome already installed:', execPath);
    return execPath;
  }

  console.log('[Browser Setup] Chrome not found, downloading...');
  
  const platform = detectBrowserPlatform();
  const buildId = await resolveBuildId(Browser.CHROME, platform, 'stable');
  
  console.log('[Browser Setup] Platform:', platform, 'BuildId:', buildId);
  
  const result = await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir,
    downloadProgressCallback: (downloadedBytes, totalBytes) => {
      const pct = Math.round((downloadedBytes / totalBytes) * 100);
      if (pct % 10 === 0) {
        process.stdout.write(`\r[Browser Setup] Downloading Chrome... ${pct}%`);
      }
    }
  });

  console.log('\n[Browser Setup] Chrome installed at:', result.executablePath);
  return result.executablePath;
}

// If run directly (from Electron)
if (require.main === module) {
  const cacheDir = process.argv[2] || path.join(__dirname, '.chrome-cache');
  setupBrowser(cacheDir)
    .then(execPath => {
      // Output the path for the parent process to read
      console.log('CHROME_PATH=' + execPath);
      process.exit(0);
    })
    .catch(err => {
      console.error('[Browser Setup] FAILED:', err.message);
      process.exit(1);
    });
}

module.exports = { setupBrowser };
