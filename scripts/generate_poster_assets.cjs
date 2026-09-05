const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    
    const htmlPath = path.resolve(__dirname, '../public/poster.html').replace(/\\/g, '/');
    await page.goto(`file:///${htmlPath}`, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfPath = path.resolve(__dirname, '../public/Roonaki_Citizen_Poster_A4.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    // Hide toolbar for screenshot
    await page.evaluate(() => {
      const tb = document.querySelector('.toolbar');
      if (tb) tb.style.display = 'none';
    });

    const posterElement = await page.$('.page-a4');
    const screenshotPath = path.resolve(__dirname, '../public/poster_preview.png');
    await posterElement.screenshot({ path: screenshotPath });

    const artifactDir = 'C:\\Users\\LEDS GAMING\\.gemini\\antigravity-ide\\brain\\f6b09c9c-5715-4586-b7d4-c22f71f8d4e5';
    fs.copyFileSync(screenshotPath, path.join(artifactDir, 'poster_preview.png'));
    fs.copyFileSync(pdfPath, path.join(artifactDir, 'Roonaki_Citizen_Poster_A4.pdf'));

    await browser.close();
    console.log('SUCCESS: Poster PDF and PNG Preview generated!');
  } catch (err) {
    console.error('Error generating assets:', err);
  }
})();
