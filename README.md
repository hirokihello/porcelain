こんにちは〜！！
インターンの[@hirokihello](https://twitter.com/maxyasuda)です！！！

季節は早いものでuuumで働き出して、そしてエンジニアとして1年半が経とうとしています。早いですね〜〜〜。

開発していると当たり前に使っているgitですが、みなさんgitについてきちんと理解していますでしょうか？

先日自分のtwitterのTLにgitを実装してみたとのツイートが流れてきて、そういえば使い方はわかるけどどんな仕組みかちゃんと知らないなあと気づきました。

そんなわけで今日はgitのaddコマンドって？仕様は？実装は？などまとめてみます！

最終的にはjavascriptでaddコマンド(正確にはコアの部分)を実装します。

gitの使い方の記事ではないのでご注意を！

今回は下記の環境で実装・検証を行っていきます。

```zsh
$ git version
git version 2.21.1 (Apple Git-122.3)
$ node -v
v14.5.0
```

## addコマンドって何してるの？
### docを読んでみる
まずaddコマンドは実際なにを行うコマンドなのでしょうか。

c言語のgit本体の実装を読むのが早いのですが、 ~~めんどくさいので~~ 今回は公式のサイトを取り上げてみましょう。

>This command updates the index using the current content found in the working tree, to prepare the content staged for the next commit. It typically adds the current content of existing paths as a whole, but with some options it can also be used to add content with only part of the changes made to the working tree files applied, or remove paths that do not exist in the working tree anymore.

>The "index" holds a snapshot of the content of the working tree, and it is this snapshot that is taken as the contents of the next commit. Thus after making any changes to the working tree, and before running the commit command, you must use the add command to add any new or modified files to the index.

>This command can be performed multiple times before a commit. It only adds the content of the specified file(s) at the time the add command is run; if you want subsequent changes included in the next commit, then you must run git add again to add the new content to the index.

引用
[https://git-scm.com/docs/git-add:embed:cite]


ふーむなるほど。(~~わからん~~)

注目して欲しいのは、以下の２点です。

> - This command updates the index using the current content found in the working tree
> - The "index" holds a snapshot of the content of the working tree, and it is this snapshot that is taken as the contents of the next commit

addコマンドがindexファイルを更新するコマンドであること、indexファイルが次のコミット用のファイルのスナップショットであることが述べられています。

### 挙動を確認する
実際にどんな風にファイルが書き換わっているのかみてみましょう。
```zsh
$ mkdir test_git
$ cd test_git
$ git init
$ ls -la .git/
total 24
drwxr-xr-x   9 hirokihello  staff  288  9 15 20:45 ./
drwxr-xr-x  10 hirokihello  staff  320  9 15 20:45 ../
-rw-r--r--   1 hirokihello  staff   23  9 15 20:45 HEAD
-rw-r--r--   1 hirokihello  staff  137  9 15 20:45 config
-rw-r--r--   1 hirokihello  staff   73  9 15 20:45 description
drwxr-xr-x  13 hirokihello  staff  416  9 15 20:45 hooks/
drwxr-xr-x   3 hirokihello  staff   96  9 15 20:45 info/
drwxr-xr-x   4 hirokihello  staff  128  9 15 20:45 objects/
drwxr-xr-x   4 hirokihello  staff  128  9 15 20:45 refs/
```

indexというファイルはここでは見当たりませんね。

適当なファイルを作成してみます。

```zsh
$ cat <<EOF > sample.js
console.log("hoge");
console.log("fuga");
EOF
$ node sample.js
hoge
fuga
```

この時点では何も追加されませんし更新は行われません。
```zsh
$ ls -la .git/
total 24
drwxr-xr-x   9 hirokihello  staff  288  9 15 20:45 ./
drwxr-xr-x  10 hirokihello  staff  320  9 15 20:45 ../
-rw-r--r--   1 hirokihello  staff   23  9 15 20:45 HEAD
-rw-r--r--   1 hirokihello  staff  137  9 15 20:45 config
-rw-r--r--   1 hirokihello  staff   73  9 15 20:45 description
drwxr-xr-x  13 hirokihello  staff  416  9 15 20:45 hooks/
drwxr-xr-x   3 hirokihello  staff   96  9 15 20:45 info/
drwxr-xr-x   4 hirokihello  staff  128  9 15 20:45 objects/
drwxr-xr-x   4 hirokihello  staff  128  9 15 20:45 refs/
```

addコマンドを打ってみます。
```zsh
$ git add sample.js
```

先ほどの.gitディレクトリをみてみましょう。

```zsh
$ ls -la ./.git
total 32
drwxr-xr-x  10 hirokihello  staff  320  9 15 20:57 .
drwxr-xr-x  11 hirokihello  staff  352  9 15 20:55 ..
-rw-r--r--   1 hirokihello  staff   23  9 15 20:45 HEAD
-rw-r--r--   1 hirokihello  staff  137  9 15 20:45 config
-rw-r--r--   1 hirokihello  staff   73  9 15 20:45 description
drwxr-xr-x  13 hirokihello  staff  416  9 15 20:45 hooks
-rw-r--r--   1 hirokihello  staff  104  9 15 20:57 index
drwxr-xr-x   3 hirokihello  staff   96  9 15 20:45 info
drwxr-xr-x   5 hirokihello  staff  160  9 15 20:57 objects
drwxr-xr-x   4 hirokihello  staff  128  9 15 20:45 refs
```

indexファイルができました！またobjectsディレクトリも更新されていますね。
中身をみてみましょう。

```zsh
$ cat ./.git/index
DIRC_`��#�_`��#���;���*{���
```

読み込めませんね。
このファイルを読み込む、 ls-filesというgitコマンドが公式で用意されているので使ってみます。

```zsh
$ git ls-files --stage
100644 7b96e6fb0a0744f5d01bb735f1622f275b440d85 0       sample.js
```

謎の文字列100644,  7b96e6fb0a0744f5d01bb735f1622f275b440d85,そして数値の0、そして先ほど作成してaddしたsample.jsが見えます。

更新のあった.git/objectsディレクトリもみてみしょう。

```zsh
$ ls -la .git/objects/
total 0
drwxr-xr-x   5 hirokihello  staff  160  9 15 20:57 .
drwxr-xr-x  10 hirokihello  staff  320  9 15 20:57 ..
drwxr-xr-x   3 hirokihello  staff   96  9 15 20:57 7b
drwxr-xr-x   2 hirokihello  staff   64  9 15 20:45 info
drwxr-xr-x   2 hirokihello  staff   64  9 15 20:45 pack
```

20:57(git addを行った時間)に7bが追加されていますね。7bの中身をみてみましょう。

```zsh
bash-3.2$ ls -la .git/objects/7b/
total 8
drwxr-xr-x  3 hirokihello  staff   96  9 15 20:57 .
drwxr-xr-x  5 hirokihello  staff  160  9 15 20:57 ..
-r--r--r--  1 hirokihello  staff   45  9 15 20:57 96e6fb0a0744f5d01bb735f1622f275b440d85
```

むむ。ディレクトリ名の`7b`と中身の`96e6fb0a0744f5d01bb735f1622f275b440d85`を足すと、先ほどのgit ls-filesで出た結果の文字列と一致します。

```zsh
$ git ls-files --stage
100644 7b96e6fb0a0744f5d01bb735f1622f275b440d85 0       sample.js
```

それでは`.git/objects/7b/96e6fb0a0744f5d01bb735f1622f275b440d85`をみてみましょう。

```zsh
$ cat .git/objects/7b/96e6fb0a0744f5d01bb735f1622f275b440d85
xK��OR01bH��+��I���O�P��OOUҴ�BL+MO      ��
```

文字化けしていますね。

これを見るコマンドがgitには用意されています。

```zsh
$ git cat-file -p 7b96e6fb0a0744f5d01bb735f1622f275b440d85
console.log("hoge");
console.log("fuga");
```

先ほど追加した、sample.jsがこの`7b96e6fb0a0744f5d01bb735f1622f275b440d85`に格納されているということがわかりました。

ここでsample.jsを変更してaddするとどうなるでしょうか。

```zsh
$ echo 'console.log("hogefuga");' >> sample.js
$ git add sample.js
$ git ls-files --stage
100644 a9e94074dc086aec661591147de3e821fa87fb36 0       sample.js
```

hashが変わっていますね。

```zsh
$ ls -la .git/objects/
total 0
drwxr-xr-x   6 hirokihello  staff  192  9 16 00:20 ./
drwxr-xr-x  10 hirokihello  staff  320  9 16 00:20 ../
drwxr-xr-x   3 hirokihello  staff   96  9 15 20:57 7b/
drwxr-xr-x   3 hirokihello  staff   96  9 16 00:20 ed/
drwxr-xr-x   2 hirokihello  staff   64  9 15 20:45 info/
drwxr-xr-x   2 hirokihello  staff   64  9 15 20:45 pack/

$ ls -la .git/objects/a9
-r--r--r--  1 hirokihello  staff  45  9 15 20:57 .git/objects/7b/96e6fb0a0744f5d01bb735f1622f275b440d85

$ git cat-file -p 7b96e6fb0a0744f5d01bb735f1622f275b440d85
console.log("hoge");
console.log("fuga");

$ ls -la .git/objects/a9/e94074dc086aec661591147de3e821fa87fb36
-r--r--r--  1 hirokihello  staff  51  9 16 00:20 .git/objects/a9/e94074dc086aec661591147de3e821fa87fb36

$ git cat-file -p a9e94074dc086aec661591147de3e821fa87fb36
console.log("hoge");
console.log("fuga");
console.log("hogefuga");
```

先ほど作られたhashはそのままで、新しくaddした時点のファイル情報を持ったobjectが作られました。

このようにgitでは、addコマンドを打つごとにobjectsにそのファイルのコピーが作られ、indexがそのobjects以下に作られたものを示すように更新されることがわかりました。

今回はこのobjectsの生成とindexの作成・更新部分のコアを実装することにします。(treeなどディレクトリ構造の保存については範囲外とします)

## addコマンドを実装してみる

それでは具体的にどのように実装すればいいのでしょうか。

具体的なindexとobjectsに作られるファイルの仕様は下記に具体的に記述されています。


[https://git-scm.com/book/ja/v2/Git%E3%81%AE%E5%86%85%E5%81%B4-Git%E3%82%AA%E3%83%96%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88:embed:cite]

[https://github.com/git/git/blob/v2.12.0/Documentation/technical/index-format.txt:embed:cite]

今回は通常のファイル(blobと呼ばれています)で考えます。blobではないものは、シンボリックリンクファイルなどが該当しますが、これをgitに保存するのは通常のweb開発に置いてあまり多くないと思われますので今回はblob一本でいきます。

### objects作成部分の実装

まずはじめに、objectsを作成できるようにadd.jsを作成します。
完成形のコードをのっけます。

add.js

```javascript
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

async function porcelainAdd () {
  if (process.argv.length <= 2) return console.log("error no file was added")
  await files.forEach(file => add(file))
}

porcelainAdd()
```

add.jsのporcelainAdd()では、引数のファイルのオブジェクトをadd関数を使って作成することができます。

使い方としては、
```zsh
$ node add.js test.js
```
のように使います。

ここからは具体的なコードの解説をします。

まずobjectの仕様についてですが、

1. ヘッダとファイルの中身からsha-1チェックサムの生成
2. zlibを用いてこの新しいコンテンツを圧縮
3. 1で求めたSHA-1ハッシュ値の最初の2文字をディレクトリ名で、残りの38文字はそのディレクトリ内のファイル名として2で求めた圧縮したコンテンツを保存

のようになっています。

#### ヘッダとファイルの中身からsha-1チェックサムの生成

まずヘッダは、
1. オブジェクトのタイプを表す文字列(blob)
2. スペースに続いてコンテンツのサイズ
3. 最後にヌルバイト

の三つからなっています。

sample.jsで考えてみます。sample.jsはこのようになっています。

```javascript
console.log("hoge");
console.log("fuga");
console.log("hogefuga");
```

このファイルのコンテンツのサイズは
```javascript
const fs = require('fs').promises;
async function add () {
  const file = await fs.readFile("sample.js")
  const content = file.toString()
  return content.length
}
```

で求めることができます。
よってheader部分の作成コードは

```javascript
const fs = require('fs').promises;

async function add () {
  const file = await fs.readFile("sample.js")
  const content = file.toString()
  const header=`blob ${content.length}\0`
}
```

となります。

ここまできたら、ヘッダーとファイルの中身を結合させます。ファイルの中身は先ほど読み込んだ` const content = file.toString()`にあるので、足すだけで大丈夫です。

```javascript
  const store = header + content;
```

sha-1ハッシュを求めるには下記のようにします。

```javascript
  const crypto = require('crypto');

  const shasum = crypto.createHash('sha1');
  shasum.update(VARIABLE_YOU_NEED_TO_HASH);
  const sha1 = shasum.digest('hex')
```

よってここまでの最終的なコードは下記のようになります。

```javascript
const crypto = require('crypto');
const fs = require('fs').promises;

async function add () {
  const file = await fs.readFile("sample.js")
  const content = file.toString()
  const header=`blob ${content.length}\0`
  const store = header + content;

  const shasum = crypto.createHash('sha1');
  shasum.update(store);
  const sha1 = shasum.digest('hex')
}
```


#### 圧縮
圧縮ですが、zlibを用いてヘッダーとファイルの中身を足したものを圧縮します。
nodejsではzlibライブラリが標準で提供されています。

このように使います。
```javascript
const zlib = require('zlib');

zlib.deflate(VARIABLE_YOU_NEED_DEFLATE, function (err, result) {})
```

よってこのようになります。

```javascript
const crypto = require('crypto');
const fs = require('fs').promises;
const zlib = require('zlib');

async function add () {
  const file = await fs.readFile("sample.js")
  const content = file.toString()
  const header=`blob ${content.length}\0`
  const store = header + content;
  const shasum = crypto.createHash('sha1');
  shasum.update(store);
  const sha1 = shasum.digest('hex')

  zlib.deflate(store, async function (err, result) {
    // 具体的な処理
});
}
```

#### .git/objectsへの書き込み

ここでは先ほどdeflateした結果を、最初に求めたsha-1hash値の最初の2文字をディレクトリ名、残りの38文字をファイル名にして保存するだけです。

zlibの処理から書きます。

```javascript
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
```

簡単ですね。

最終的にはsample.jsの固定の部分を受け取るようにします。

```javascript
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

async function porcelainAdd () {
  if (process.argv.length <= 2) return console.log("error no file was added")
  await files.forEach(file => add(file))
}

porcelainAdd()
```

実際に同じものができているか検証してみましょう。add.jsを呼び出す時に、内部に関数の実行を忘れずに。

先ほどaddした時に作られたobjectsのhash値は`a9e94074dc086aec661591147de3e821fa87fb36`でした。同じhashになれば同じheader, contentsとして保存されており、cat-fileで中身が見れればきちんとdeflateができているということになります。

```zsh
$ rm -rf .git
$ git init
$ node add.js sample.js
$ ls -la .git/objects/a9
-rw-r--r--  1 hirokihello  staff  50  9 16 02:02 .git/objects/a9/e94074dc086aec661591147de3e821fa87fb36
$ git cat-file -p a9e94074dc086aec661591147de3e821fa87fb36
console.log("hoge");
console.log("fuga");
console.log("hogefuga");
```

うまくいきましたね。これでobjectsを保存することができました。

### index更新部分の実装
さて最後にして今回の山場です。

まずこいつらがどのようになっているのかについてみてみましょう。

#### .git/indexの中身
 先ほど.git/indexを確認した時はバイナリファイルだったので、hexdumpしてみることにします。

```zsh
$ hexdump -C .git/index | head -n 50
00000000  44 49 52 43 00 00 00 02  00 00 00 01 5f 61 c1 fd  |DIRC........_a..|
00000010  08 f1   c6 d9  5f  61  c1 fd   08 f1 c6 d9 01 00 00 04  |...._a..........|
00000020  05 d5 ea 3b 00 00 81  a4  00 00 01 f5 00 00 00 14  |...;............|
00000030  00 00 00 43 a9 e9 40 74  dc 08 6a ec 66 15 91 14  |...C..@t..j.f...|
00000040  7d e3 e8 21   fa 87  fb  36 00 09 73 61 6d 70 6c 65  |}..!...6..sample|
00000050  2e 6a 73 00 79 e5 e8 a6   c3 81 2e 7f 61 20 cc 5a  |.js.y.......a .Z|
00000060  0f 15 b4 ae 37 ec 52 ec                           |....7.R.|
00000068
```

DIRCという文字列、sample.jsという文字列があることがわかります。

このindexについての仕様はgit公式のgithubにあります。

[https://github.com/git/git/blob/v2.12.0/Documentation/technical/index-format.txt:embed:cite]

indexは大きく三つに分かれます。

1. ヘッダー(12byte)
2. エントリー(可変)
3. sha-1チェックサム(20byte)

今回の例でいうと、
ヘッダー
```zsh
44 49 52 43 00 00 00 02  00 00 00 01
```

エントリー
```zsh
                                     5f 61 c1 fd
08 f1 c6 d9 5f 61 c1 fd  08 f1 c6 d9 01 00 00 04
05 d5 ea 3b 00 00 81 a4  00 00 01 f5 00 00 00 14
00 00 00 43 a9 e9 40 74  dc 08 6a ec 66 15 91 14
7d e3 e8 21 fa 87 fb 36  00 09 73 61 6d 70 6c 65
2e 6a 73 00
```

sha-1チェックサム
```zsh
             a6  c3 81 2e 7f 61 20 cc 5a
0f 15 b4 ae 37 ec 52 ec
```

となります。

この最終的な実装は先ほど実装したobjectsの実装と合わせて下記となります。

add.js

```javascript
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
```

#### ヘッダー

ヘッダー部分の仕様は下記のようになっています。

1. 4-byte DIRCの文字列
2. 4-byte バージョン(今回は2)
3. 32-bit entriesの数

これだけです。

node標準のbufferクラスはhexバイナリを扱うことができるので、今回はbufferクラスで実装していきます。

実装はこのようになります。
```javascript
async function updateIndex (files) {
  const header = Buffer.alloc(12);
  const fileNum = files.length

  header.write('DIRC', 0);
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(fileNum, 8);
}
```

ヘッダー用の12byteをBuffer.allocで確保します。fileNumは今回は一つとしますが、可変にしても構いません。

```javascript
  const header = Buffer.alloc(12);
  const fileNum = files.length
```

bufferクラスのインスタンスのwriteメソッドとwriteUInt32BEで、それぞれ1バイト目から4byte, 4byte目からバージョンの2を4byte分(32bit=4byte)、8バイト目からファイル数を書き込みます。
```javascript
  header.write('DIRC', 0);
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(fileNum, 8);
```

先ほど見たヘッダー部分のバイナリと一致するか確認しましょう。

先ほど見たヘッダー
```zsh
44 49 52 43 00 00 00 02  00 00 00 01
```

ここまでのコード
```javascript
async function updateIndex (files) {
  const header = Buffer.alloc(12);
  const fileNum = files.length

  header.write('DIRC', 0);
  header.writeUInt32BE(2, 4);
  header.writeUInt32BE(fileNum, 8);
}

updateIndex(process.argv[2])
```

```
$ node add.js sample.js
<Buffer 44 49 52 43 00 00 00 02 00 00 00 01>
```

一致することがわかります。

#### エントリー部分。

エントリー部分は下記のようになっています。
```
  - 32-bit ctime(stat(2) data)
  - 32-bit ctime nanosecond fractions(stat(2) data)
  - 32-bit mtime seconds(stat(2) data)
  - 32-bit mtime nanosecond fractions(stat(2) data)
  - 32-bit dev(stat(2) data)
  - 32-bit ino(stat(2) data)
  - 32-bit mode, split into (high to low bits)
    - 4-bit object type valid values in binary are 1000 (regular file), 1010 (symbolic link) and 1110 (gitlink)
    - 3-bit unused
    - 9-bit unix permission.
  - 32-bit uid(stat(2) data)
  - 32-bit gid(stat(2) data)
  - 32-bit file size(stat(2) data)
  - 160-bit SHA-1 for the represented object
  - A 16-bit 'flags' field split into (high to low bits)
    - 1-bit assume-valid flag
    - 1-bit extended flag (must be zero in version 2)
    - 2-bit stage (during merge)
    - 12-bit name length
  -   Entry path name
  -  1-8 nul bytes
```

基本的には、c言語で用意されているstatという構造体の通りに実装すれば大丈夫です。

nodeでは標準で、fsライブラリが提供されており、fs.statでファイル情報を参照することができます。

気になるのは、色々書いているmodeですが通常ファイルを今回は考えるのでfs.stat.modeをそのままstatの結果を入力すれば大丈夫です。

実装はこのようになります。

ファイルpathが複数渡されても良いように、arrayを受け取るようにしています。
```javascript
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
  shasum.update(store);
  const sha1 = shasum.digest('hex')

  return sha1
}
```


ここではbigintオプションを渡しctimeなどのnano sec fractionsを取得できるようにします。

```javascript
    const statInfo = await fs.stat(filePath, {bigint: true})
```

ここでstatのデータを取得し、加工しています。注意として、ctimeなどはm秒以下を切り捨て、それぞれ4byteに収める必要がある部分です。(デフォルトだとm秒以下もfs.stat.ctimeで取得されますが4byteに収まらないので切り捨て、m秒以下はnano sec fractionsで表現します)

```javascript
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
```

statで取得したデータを4byteづつ書き込んでいきます。

```javascript
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
```


その後先ほどobjectsを生成するときの方法と同じで算出したsha1 hashをそのままhexにします。
例えば、先ほど作成したsample.jsのobjectsの`.git/objects/a9/e94074dc086aec661591147de3e821fa87fb36`ですが、

エントリーのhexdumpに
```
                                     5f 60 db b7
08 f1 c6 d9  5f  61  c1 fd   08 f1 c6 d9 01 00 00 04
05 d5 ea 3b 00 00 81 a4  00 00 01 f5 00 00 00 14
00 00 00 43 a9 e9 40 74  dc 08 6a ec 66 15 91 14
7d e3 e8 21  fa  87  fb  36  00 09 73 61 6d 70 6c 65
2e 6a 73 00
```

hash名がそのままhexに変換されているのがわかると思います。
```
a6  c3 81 2e 7f 61 20 cc 5a
0f 15 b4 ae 37 ec 52 ec
```

コードはこのようになります。先ほどとほとんど同じなので解説はほとんどいらないでしょう。

```javascript

const sha1String = await genBlobSha1(filePath)
const sha1 = Buffer.from(sha1String, 'hex')

async function genBlobSha1 (filePath) {
  const file = await fs.readFile(filePath)
  const content = file.toString()
  const header=`blob ${content.length}\0`
  const store = header + content;
  shasum.update(store);
  const sha1 = shasum.digest('hex')

  return sha1
}
```

Buffer.fromにhexオプションを渡すことで、文字列をそのままhexにしています。(ex. "aa" => <buffer aa>)

```javascript
Buffer.from(sha1String, 'hex')
```

あと少しです。

フラグを実装します。フラグはbit単位で指定がありbit演算が必要です。

```javascript
    const assumeValid = 0b0 // 1 or 0 default is 0
    const extendedFlag = 0b0 // 1 or 0 default is 0
    const optionalFlag = (((0b0 | assumeValid) << 1) |　extendedFlag) << 14

    const flagRes = optionalFlag | filePath.length
    const flag = Buffer.alloc(2)
    flag.writeUInt16BE(flagRes)
```

これで最後です。


file名をbufferにして、今まで作ったバッファーと合わせた全体のエントリーの長さを計算します。
8の倍数になるように、null byteでパディングを行います。(8の倍数の場合、8byteのnull byteを足す。)

```javascript
    const fileName = Buffer.from(filePath)
    const length = stat.length + sha1.length + flag.length + fileName.length
    const paddingCount = 8 - (length % 8)
    const padding = Buffer.alloc(paddingCount, '\0');
    const entry = Buffer.concat([stat, sha1, flag, fileName, padding], length + paddingCount)
    return entry
```

最後に全てのbufferをくっつけてreturnすれば完了です。

#### sha-1チェックサム

ここでは、最終的にヘッダーと先ほど作ったエントリーを組み合わせてsha-1hashを作ります。そのhashをそのままhexにして、それを保存すれば終了です。

ここでは全体としてconcatメソッドを使ってbufferを結合しています。

```javascript

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
```

### 完成
それでは実際に動かしてみましょう。

add.js
```javascript
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
  const fileNum = files.length /

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
```


コマンドを実行してみます。
```zsh
$ rm -rf .git
$ git init
$ node add.js sample.js 
$ git ls-files --stage
100644 a9e94074dc086aec661591147de3e821fa87fb36 0       sample.js
$ git cat-file -p a9e94074dc086aec661591147de3e821fa87fb36
console.log("hoge");
console.log("fuga");
console.log("hogefuga");
$ hexdump -C .git/index | head -n 50
00000000  44 49 52 43 00 00 00 02  00 00 00 01 5f 61 c1 fd  |DIRC........_a..|
00000010  08 f1 c6 d9 5f 61 c1 fd        08 f1 c6 d9 01 00 00 04  |...._a..........|
00000020  05 d5 ea 3b 00 00 81 a4    00 00 01 f5 00 00 00 14  |...;............|
00000030  00 00 00 43 a9 e9 40 74   dc 08 6a ec 66 15 91 14  |...C..@t..j.f...|
00000040  7d e3 e8 21 fa 87 fb 36      00 09 73 61 6d 70 6c 65  |}..!...6..sample|
00000050  2e 6a 73 00 79 e5 e8 a6    c3 81 2e 7f 61 20 cc 5a  |.js.y.......a .Z|
00000060  0f 15 b4 ae 37 ec 52 ec                           |....7.R.|
00000068
```

gitコマンドでaddするのと全く同じようにindex, objectsファイルを作れました！

これで終わりです！

今後はバリデーション部分やコミットの部分も作っていきたいですね！

ここまで読んでくださりありがとうございました！



reference

[https://github.com/git/git/blob/v2.12.0/Documentation/technical/index-format.txt:embed:cite]
