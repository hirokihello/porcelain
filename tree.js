const crypto = require('crypto');
const fs = require('fs').promises;
const zlib = require('zlib');

async function genTree (fileContents=[]) {
  const content = calcContents(fileContents)
  const header= Buffer.from(`tree ${content.length}\0`)
  const store = Buffer.concat([header, content], header.length + content.length);
  const shasum = crypto.createHash('sha1');
  shasum.update(store);
  const sha1 = shasum.digest('hex')
  zlib.deflate(store, async function (err, result) { // bufferを引数で取れる！！　https://nodejs.org/api/zlib.html#zlib_class_zlib_deflate 便利！
    dirPath = __dirname + '/.git/objects/' + sha1.substring(0,2)
    filePath = dirPath + '/' + sha1.substring(2, 40)
    await fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) throw err;
    });
    fs.writeFile(filePath, result, function (err) {
      if (err) throw err;
      console.log('Saved!');
    })
  });
  return sha1;
}

function calcContents (fileContents=[]) {
  return fileContents.reduce((acc, file) => {
    const content = calcContent(file)
    return Buffer.concat([acc, content], acc.length + content.length)
  }, Buffer.alloc(0))
}

function calcContent (fileContent) {
  const fileMode = fileContent.mode //100644
  const fileName = fileContent.name // sample.js
  const fileHash = fileContent.sha1 // 52679e5d3d185546a06f54ac40c1c652e33d7842
  const hash = Buffer.from(fileHash, "hex")
  const content = Buffer.from(`${fileMode} ${fileName}\0`) // modeとnameの間に半角スペースを開ける。

  const buffer = Buffer.concat([content, hash], hash.length + content.length)
  return buffer
}

module.exports = {
  genTree
}
