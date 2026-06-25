const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  const sizes = [192, 512];
  for (const size of sizes) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.21)}" fill="#f59e0b"/>
      <text x="${size/2}" y="${size * 0.68}" font-size="${size * 0.625}" text-anchor="middle" fill="white" font-family="Arial, sans-serif">&#9875;</text>
    </svg>`;
    
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    
    console.log(`Generated icon-${size}.png`);
  }
  
  // Apple touch icon (180x180)
  const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <rect width="180" height="180" rx="40" fill="#f59e0b"/>
    <text x="90" y="122" font-size="112" text-anchor="middle" fill="white" font-family="Arial, sans-serif">&#9875;</text>
  </svg>`;
  
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  
  console.log('Generated apple-touch-icon.png');

  // Favicon (32x32)
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#f59e0b"/>
    <text x="16" y="24" font-size="22" text-anchor="middle" fill="white" font-family="Arial, sans-serif">&#9875;</text>
  </svg>`;
  
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, 'favicon-32.png'));
  
  console.log('Generated favicon-32.png');
}

generateIcons().catch(console.error);
