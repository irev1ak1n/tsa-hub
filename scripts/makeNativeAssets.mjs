// Builds the 1024px App Store icon and the splash source from the app icon.
// Run `npm run native:assets` to regenerate resources/, then the iOS asset set.
import sharp from 'sharp';

const SRC = 'src/assets/img/icon.png';
const BG = { r: 5, g: 5, b: 8 };

await sharp(SRC)
    .resize(1024, 1024)
    .flatten({ background: BG })
    .removeAlpha()
    .png()
    .toFile('resources/icon.png');

const logo = await sharp(SRC).resize(1000, 1000).toBuffer();
await sharp({ create: { width: 2732, height: 2732, channels: 3, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile('resources/splash.png');
await sharp('resources/splash.png').toFile('resources/splash-dark.png');
console.log('resources/ written');
