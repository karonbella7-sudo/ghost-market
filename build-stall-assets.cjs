// Generate an offline texture bundle; WebGL cannot reliably read file:// image textures.
const fs=require('fs'),path=require('path');
const files=['assets/stall-one-wave.png','assets/stall-two-noise.png','assets/stall-three-poster.png'];
const assets=Object.fromEntries(files.map(file=>[file,'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,file)).toString('base64')]));
fs.writeFileSync(path.join(__dirname,'stall-assets.js'),'Object.assign(LOCAL_ASSETS,'+JSON.stringify(assets)+');\n');
