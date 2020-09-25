const crypto = require('crypto');
const fs = require('fs').promises;
const zlib = require('zlib');

async function add (file) {
  const fileObj = await fs.readFile(file)
  const content = fileObj.toString()
  const header=`blob ${content.length}\0`
  const store = header + content;
  const shasum = crypto.createHash('sha1');
  shasum.update(store);
  const sha1 = shasum.digest('hex')

  zlib.deflate(store, async function (err, result) {
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
}

async function updateIndex (files) {
  const header = Buffer.alloc(12);
  const fileNum = files.length

  header.write('DIRC', 0);
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(fileNum, 8);
  const entries = await Promise.all(entriesArray(files))

  const content = [header].concat(entries).reduce((accumulator, currentValue) =>{
    const length = currentValue.length + accumulator.length
    return Buffer.concat([accumulator, currentValue], length)
  })

  const hash = crypto.createHash('sha1')
  hash.update(content);
  const sha1 = Buffer.from(hash.digest('hex'), 'hex')

  const finalObj = Buffer.concat([content, sha1], content.length + sha1.length)

  fs.writeFile(".git/index", finalObj, function (err) {
    if (err) throw err;
    console.log('Saved!');
  })
}

function entriesArray(filePathArray) {
  return filePathArray.map(async filePath =>  {
    const statInfo = await fs.stat(filePath, {bigint: true})

    const ctime = parseInt((statInfo.ctime.getTime() / 1000 ).toFixed(0))
    const ctimeNs = parseInt(statInfo.ctimeNs  % 1000000000n) // 下9桁欲しい
    const mtime = parseInt((statInfo.mtime.getTime() / 1000 ).toFixed(0))
    const mtimeNs = parseInt(statInfo.mtimeNs % 1000000000n)
    const dev = parseInt(statInfo.dev)
    const ino = parseInt(statInfo.ino)
    const mode = parseInt(statInfo.mode)
    const uid = parseInt(statInfo.uid)
    const gid = parseInt(statInfo.gid)
    const size = parseInt(statInfo.size)

    const stat = Buffer.alloc(40);
    [
      ctime,
      ctimeNs,
      mtime,
      mtimeNs,
      dev,
      ino,
      mode,
      uid,
      gid,
      size,
    ].forEach((attr, idx) => stat.writeUInt32BE(attr, idx * 4))

    const sha1String = await genBlobSha1(filePath)
    const sha1 = Buffer.from(sha1String, 'hex')

    const assumeValid = 0b0 // 1 or 0 default is 0
    const extendedFlag = 0b0 // 1 or 0 default is 0
    const optionalFlag = (((0b0 | assumeValid) << 1) |　extendedFlag) << 14

    const flagRes = optionalFlag | filePath.length
    const flag = Buffer.alloc(2)
    // 16bitなのでこのメソッドを使う。writeIntメソッドもあるがrangeが-32768 < val< 32767で、assumeValid=1になった時flagは最低でも32769となり
    // エラーが出るのでwriteUInt16BEを使う。
    // ファイル名の制限は一旦なしで。
    flag.writeUInt16BE(flagRes)

    const fileName = Buffer.from(filePath)
    const length = stat.length + sha1.length + flag.length + fileName.length
    const paddingCount = 8 - (length % 8)
    const padding = Buffer.alloc(paddingCount, '\0');
    const entry = Buffer.concat([stat, sha1, flag, fileName, padding], length + paddingCount)
    return entry
  })
}


async function genBlobSha1 (filePath) {
  const file = await fs.readFile(filePath)
  const content = file.toString()
  const header=`blob ${content.length}\0`
  const store = header + content;
  const shasum = crypto.createHash('sha1');
  shasum.update(store);
  const sha1 = shasum.digest('hex')

  return sha1
}

async function porcelainAdd () {
  if (process.argv.length <= 2) return console.log("error no file was added")
  const files = process.argv.slice(2).map(file => file.replace(/^\.\//, ""))
  await files.forEach(file => add(file))
  await updateIndex(files)
}

porcelainAdd()
