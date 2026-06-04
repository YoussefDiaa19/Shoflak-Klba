const fs = require('fs');
const { Jimp } = require('jimp');

async function go() {
  const originalIconPath = 'public/Copy of Shoflak Klba (1) (1).png';
  
  // Base icon
  const iconOriginal = await Jimp.read(originalIconPath);
  const baseIcon = iconOriginal.clone().resize({ w: 1024, h: 1024 });
  await baseIcon.write('resources/icon.png');
  
  // Icon background
  const bg = new Jimp({ width: 1024, height: 1024, color: 0xffffffff });
  await bg.write('resources/icon-background.png');
  
  // Icon foreground
  const fg = new Jimp({ width: 1024, height: 1024, color: 0x00000000 });
  const rawLogo = await Jimp.read(originalIconPath);
  const logoResized = rawLogo.resize({ w: 700, h: 700 });
  const fgX = Math.floor((1024 - 700) / 2);
  const fgY = Math.floor((1024 - 700) / 2);
  fg.composite(logoResized, fgX, fgY);
  await fg.write('resources/icon-foreground.png');
  
  // Splash screen
  const splashBg = new Jimp({ width: 2732, height: 2732, color: 0xe2a05eff }); // #e2a05e is the orange
  const splashLogo = (await Jimp.read(originalIconPath)).resize({ w: 1000, h: 1000 });
  const splashX = Math.floor((2732 - 1000) / 2);
  const splashY = Math.floor((2732 - 1000) / 2);
  splashBg.composite(splashLogo, splashX, splashY);
  await splashBg.write('resources/splash.png');
  
  console.log('Done generating resources from user image!');
}
go();
