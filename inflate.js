const fs = require('fs');
const zlib = require('zlib');

async function inflate () {
  const hash = process.argv[2]
  const dirPath = __dirname + '/.git/objects/' + hash.substring(0,2)
  const filePath = dirPath + '/' + hash.substring(2, 41)

  fs.readFile(filePath, function(err, res) {
    console.log(res.toString('latin1'));

    if(err) throw err
    zlib.inflate(res, function (err, result) {
      console.log(result)
      if(err) throw err
      console.log(result.toString());
      // 最初のnull byteを見つけてくれる。
      console.log(result.indexOf('\0'))
      console.log(result.slice(result.indexOf('\0') + 1).toString())

    });
  })
}

inflate()