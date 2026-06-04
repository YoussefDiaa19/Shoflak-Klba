const { Jimp } = require('jimp');
const fs = require('fs');

async function check() {
  try {
    const fg = await Jimp.read('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png');
    const splash = await Jimp.read('android/app/src/main/res/drawable-port-xxxhdpi/splash.png');
    console.log('foreground center pixel:', fg.getPixelColor(fg.width/2, Math.floor(fg.height/2)).toString(16));
    console.log('foreground top left pixel:', fg.getPixelColor(10, 10).toString(16));
    
    console.log('splash center pixel:', splash.getPixelColor(splash.width/2, Math.floor(splash.height/2)).toString(16));
    console.log('splash top left pixel:', splash.getPixelColor(10, 10).toString(16));
  } catch (e) {
    console.error(e);
  }
}
check();
