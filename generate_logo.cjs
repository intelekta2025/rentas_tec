const fs = require('fs');
try {
    const b64 = fs.readFileSync('logo_temp.png').toString('base64');
    fs.writeFileSync('src/services/logoData.js', `export const logoBase64 = 'data:image/png;base64,${b64}';`);
    console.log('Success');
} catch (e) {
    console.error(e);
}
