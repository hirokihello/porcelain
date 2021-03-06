const { genTree } = require('./tree.js')
const fs = require('fs').promises;
const crypto = require('crypto');

async function porcelainCommit () {
  const message = process.argv[2]
  const indexFile = await fs.readFile(".git/index")
  const header = indexFile.slice(0, 12)
  let body = indexFile.slice(12)
  const fileNum = parseInt(header.slice(8, 12).toString("hex"))
  const fileInfo = []
  console.log(fileNum)
  for (let i = 0; i < fileNum; i++) {
    const mode = parseInt(body.slice(24, 28).toString('hex'), 16).toString(8)

    const sha1 = body.slice(40, 60).toString('hex')

    const flag = body.slice(60, 62)
    const fileLength =parseInt(flag.toString("hex"), 16) & 0b0011111111111111

    const name = body.slice(62, 62+fileLength).toString()
    const zeroPadding = 8 - ((62+fileLength) % 8)
    fileInfo.push({mode, sha1, name})
    body = body.slice(62+fileLength+zeroPadding)
  }
  const treeHash = await genTree(fileInfo)
  genCommitObject(treeHash, message)
}

async function genCommitObject (treeSha1, commitMessage) {
  const commitTime = (Date.now() / 1000).toFixed(0)
  const content = `tree ${treeSha1}\n` +
    `author hirokihello <iammyeye1@gmail.com> ${commitTime} +0900\n` +
    `committer hirokihello <iammyeye1@gmail.com> ${commitTime} +0900\n` +
    "\n" +
    `${commitMessage}\n`

  const header= `commit ${content.length}\0`
  const store = header + content
  const shasum = crypto.createHash('sha1');
  shasum.update(store);
  const commitSha1 = shasum.digest('hex')

  zlib.deflate(store, async function (err, result) {
    dirPath = __dirname + '/.git/objects/' + commitSha1.substring(0,2)
    filePath = dirPath + '/' + commitSha1.substring(2, 40)
    await fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) throw err;
    });
    fs.writeFile(filePath, result, function (err) {
      if (err) throw err;
      console.log('Saved!');
    })
  });

  const refsPath = ".git/refs/heads/master"
  fs.writeFile(refsPath, commitSha1, function (err) {
    if (err) throw err;
    console.log('Saved!');
  })
}

porcelainCommit()
