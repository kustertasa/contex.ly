const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 48, 128];

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw green background
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, size, size);

  // Draw white 'C' text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', size/2, size/2);

  return canvas.toBuffer();
}

// Create icons directory if it doesn't exist
if (!fs.existsSync('dist/icons')) {
  fs.mkdirSync('dist/icons', { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
  const buffer = createIcon(size);
  fs.writeFileSync(`dist/icons/icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
}); 