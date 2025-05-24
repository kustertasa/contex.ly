const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, size, size);

  // Letter "C"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', size / 2, size / 2);

  return canvas.toBuffer();
}

const sizes = [16, 48, 128];

// Ensure icons directory exists
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

// Generate icons for each size
sizes.forEach(size => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join('icons', `icon${size}.png`), buffer);
  console.log(`Generated ${size}x${size} icon`);
}); 