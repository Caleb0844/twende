import fs from 'fs';

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size*0.2}" fill="#1e293b"/>
  <text x="50%" y="55%" font-size="${size*0.5}" text-anchor="middle" dominant-baseline="middle" font-family="serif">🗺️</text>
</svg>`;

fs.writeFileSync('pwa-192x192.svg', svg(192));
fs.writeFileSync('pwa-512x512.svg', svg(512));
console.log('Icons created!');
