import sharp from 'sharp';

await sharp('pwa-192x192.svg').resize(192,192).png().toFile('pwa-192x192.png');
await sharp('pwa-512x512.svg').resize(512,512).png().toFile('pwa-512x512.png');
console.log('PNG icons created!');
