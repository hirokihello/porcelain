#### gitの再実装

# hirokihelloに名前を全て置換すること

ここではgitがどのように動いているのか、コマンドを使って確認したのちにコアの部分を再実装します。
主に`https://git-scm.com/book/ja/v2`に記述されていることを再実装・簡略化しています。

テスト用のgitをinitializeします。
```
⋊> ~/g/g/hirokihello git init porcelain
⋊> ~/g/g/hirokihello cd porcelain/.git

⋊> ~/g/g/h/p/.git on master  ls -la 22:57:47
total 24
drwxr-xr-x   9 inoue_h  staff  288  9  9 22:57 ./
drwxr-xr-x   3 inoue_h  staff   96  9  9 22:57 ../
-rw-r--r--   1 inoue_h  staff   23  9  9 22:57 HEAD
-rw-r--r--   1 inoue_h  staff  340  9  9 22:57 config
-rw-r--r--   1 inoue_h  staff   73  9  9 22:57 description
drwxr-xr-x  13 inoue_h  staff  416  9  9 22:57 hooks/
drwxr-xr-x   3 inoue_h  staff   96  9  9 22:57 info/
drwxr-xr-x   4 inoue_h  staff  128  9  9 22:57 objects/
drwxr-xr-x   4 inoue_h  staff  128  9  9 22:57 refs/
```

gitのhash-objectコマンドを使ってみます。

```

⋊> ~/g/g/h/porcelain on master ⨯ echo 'test content' | git hash-object -w --stdin
d670460b4b4aece5915caf5c68d12f560a9fe3e4
```
d6というprefixをもつ70460b4b4aece5915caf5c68d12f560a9fe3e4が生成されました。これは.git/objects/d6ディレクトリにあります。
確認してみます。

```
⋊> ~/g/g/h/porcelain on master ⨯ ls .git/objects/d6
70460b4b4aece5915caf5c68d12f560a9fe3e4
```
確かにあります。中身はどうなっているでしょうか。
```
⋊> ~/g/g/h/porcelain on master ⨯ cat .git/objects/d6/70460b4b4aece5915caf5c68d12f560a9fe3e4
xK��OR04f(I-.QH��+I�+�K�
```

読み込めません。これはzlibという方法で圧縮されているためです。

コンテンツ1つごとに1ファイルで、ファイル名はコンテンツとそのヘッダーに対するSHA-1チェックサムで決まります。 SHA-1ハッシュのはじめの2文字がサブディレクトリの名前になり、残りの38文字がファイル名になります。

中身をみたい場合
```
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p d670460b4b4aece5915caf5c68d12f560a9fe3e4
test content
```

別のファイルも作成してみましょう。

```
⋊> ~/g/g/h/porcelain on master ⨯ echo 'version 1' > test.txt
⋊> ~/g/g/h/porcelain on master ⨯ git hash-object -w test.txt
83baae61804e65cc73a7201a7252750c76066a30
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/
total 0
drwxr-xr-x  6 inoue_h  staff  192  9  9 23:32 ./
drwxr-xr-x  9 inoue_h  staff  288  9  9 23:32 ../
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:32 83/
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:01 d6/
drwxr-xr-x  2 inoue_h  staff   64  9  9 22:57 info/
drwxr-xr-x  2 inoue_h  staff   64  9  9 22:57 pack/
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/83/
total 8
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:32 ./
drwxr-xr-x  6 inoue_h  staff  192  9  9 23:32 ../
-r--r--r--  1 inoue_h  staff   26  9  9 23:32 baae61804e65cc73a7201a7252750c76066a30
```

83baae61804e65cc73a7201a7252750c76066a30というファイルが作成されました。これは、.git/bjects以下に、83/baae61804e65cc73a7201a7252750c76066a30という形で作成されていることがわかります。

先ほどのtest.txtを更新してみましょう。
```
⋊> ~/g/g/h/porcelain on master ⨯ echo 'version 2' > test.txt
⋊> ~/g/g/h/porcelain on master ⨯ cat test.txt
version 2
```

これをhash化するとどうなるでしょうか
```
⋊> ~/g/g/h/porcelain on master ⨯ git hash-object -w test.txt
1f7a7a472abf3dd9643fd615f6da379c4acb3e3a
```

```
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/
total 0
drwxr-xr-x  7 inoue_h  staff  224  9  9 23:40 ./
drwxr-xr-x  9 inoue_h  staff  288  9  9 23:40 ../
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:40 1f/
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:32 83/
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:01 d6/
drwxr-xr-x  2 inoue_h  staff   64  9  9 22:57 info/
drwxr-xr-x  2 inoue_h  staff   64  9  9 22:57 pack/

⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/1f/
total 8
drwxr-xr-x  3 inoue_h  staff   96  9  9 23:40 ./
drwxr-xr-x  7 inoue_h  staff  224  9  9 23:40 ../
-r--r--r--  1 inoue_h  staff   26  9  9 23:40 7a7a472abf3dd9643fd615f6da379c4acb3e3a
```

7a7a472abf3dd9643fd615f6da379c4acb3e3aが作成されたことがわかります。

このようにファイルの上書きをすると、既存のファイルを破棄するのではなく新しいファイルが作成されます。


### ファイルシステムについて
gitにおいて、すべてのコンテンツはツリーオブジェクトまたはブロブオブジェクトとして格納されます。
ツリーオブジェクトとは、ディレクトリのようなものでその中にブロブオブジェクトが入っています。

gitにはupdate-indexというコマンドがある。

### treeについて

master^{tree} のシンタックスは、master ブランチ上での最後のコミットが指しているツリーオブジェクトを示します。

```
⋊> ~/g/g/h/porcelain on master ◦ git cat-file -p master^{tree}
100644 blob 6ae66b94005e40c0a0b9c90d73193b80cd252e14    README.md
```

write-treeコマンドを打つと、treeファイルを作成することができる。これは現在のtreeの最新の情報から新しいtreeを作成してくれている？？
```
⋊> ~/g/g/h/porcelain on master ⨯ git write-tree
8f091284ec7afc2625cda0384c28c78ea2dc140e

⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p 8f091284ec7afc2625cda0384c28c78ea2dc140e                                                                                                                 02:19:36
100644 blob 0fd7035d91896c94a037a962846d5599e63bedbb    README.md

⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/                                                                                                                                                     02:22:06
total 0
drwxr-xr-x   7 inoue_h  staff  224  9 10 02:20 ./
drwxr-xr-x  10 inoue_h  staff  320  9 10 02:22 ../
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:16 0f/
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:20 73/
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:17 8f/
drwxr-xr-x   2 inoue_h  staff   64  9 10 02:15 info/
drwxr-xr-x   2 inoue_h  staff   64  9 10 02:15 pack/

⋊> ~/g/g/h/porcelain on master ⨯ git write-tree                                                                                                                                                           02:22:22
40017f1bde4f2add068688a2086bd7014b34579a

⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/                                                                                                                                                     02:22:22
total 0
drwxr-xr-x   8 inoue_h  staff  256  9 10 02:22 ./
drwxr-xr-x  10 inoue_h  staff  320  9 10 02:22 ../
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:16 0f/
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:22 40/
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:20 73/
drwxr-xr-x   3 inoue_h  staff   96  9 10 02:17 8f/
drwxr-xr-x   2 inoue_h  staff   64  9 10 02:15 info/
drwxr-xr-x   2 inoue_h  staff   64  9 10 02:15 pack/
```

write-treeをするたびに、最新のファイル一覧のオブジェクトを子要素にもつものが生まれる。どうやって区別してるのかは不明。

```
git update-index test.txt
```
既存のtext.txtはこのコマンドを打たれることによって、indexにある最新のtest.txtが更新されたことを検知する。、

indexは.git/indexにある。

### 独自まとめ
結局git add コマンドは何をしているのか。

まず既存のファイル全体のhash化した物を作っている。

変更点が一個でもあると、それをつどhash化して変更前と別のファイルを.git/objectsに作成する。

同じものがあれば無視をして、新しいhashが生まれればそれを作成する。

```
⋊> ~/g/g/h/porcelain git init                                                                                                                                                                             03:41:20
Initialized empty Git repository in /Users/inoue_h/ghq/github.com/hirokihello/porcelain/.git/
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/                                                                                                                                                     03:41:25
total 0
drwxr-xr-x  4 inoue_h  staff  128  9 10 03:41 ./
drwxr-xr-x  9 inoue_h  staff  288  9 10 03:41 ../
drwxr-xr-x  2 inoue_h  staff   64  9 10 03:41 info/
drwxr-xr-x  2 inoue_h  staff   64  9 10 03:41 pack/
⋊> ~/g/g/h/porcelain on master ⨯ git add .                                                                                                                                                                03:41:29
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/                                                                                                                                                     03:41:34
total 0
drwxr-xr-x   8 inoue_h  staff  256  9 10 03:41 ./
drwxr-xr-x  10 inoue_h  staff  320  9 10 03:41 ../
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 51/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 72/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 f0/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 f9/
drwxr-xr-x   2 inoue_h  staff   64  9 10 03:41 info/
drwxr-xr-x   2 inoue_h  staff   64  9 10 03:41 pack/
⋊> ~/g/g/h/porcelain on master ⨯ git add .                                                                                                                                                                03:41:36
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/                                                                                                                                                     03:41:50
total 0
drwxr-xr-x   9 inoue_h  staff  288  9 10 03:41 ./
drwxr-xr-x  10 inoue_h  staff  320  9 10 03:41 ../
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 51/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 53/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 72/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 f0/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 f9/
drwxr-xr-x   2 inoue_h  staff   64  9 10 03:41 info/
drwxr-xr-x   2 inoue_h  staff   64  9 10 03:41 pack/
⋊> ~/g/g/h/porcelain on master ⨯ git commit -m 'first commit'                                                                                                                                             03:41:51
[master (root-commit) 95a94f3] first commit
 4 files changed, 207 insertions(+)
 create mode 100644 .porcelain/index
 create mode 100644 README.md
 create mode 100644 add.js
 create mode 100644 main.js

⋊> ~/g/g/h/porcelain on master  ls -la .git/objects/                                                                                                                                                      03:42:46
total 0
drwxr-xr-x  12 inoue_h  staff  384  9 10 03:42 ./
drwxr-xr-x  12 inoue_h  staff  384  9 10 03:42 ../
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 51/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 53/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:42 61/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 72/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:42 95/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:42 d9/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 f0/
drwxr-xr-x   3 inoue_h  staff   96  9 10 03:41 f9/
drwxr-xr-x   2 inoue_h  staff   64  9 10 03:41 info/
drwxr-xr-x   2 inoue_h  staff   64  9 10 03:41 pack/

⋊> ~/g/g/h/porcelain on master  ls -la .git/objects/95/a94f3b7f5bcbb6d58727778f2061bf15cbfa23                                                                                                             03:43:14
-r--r--r--  1 inoue_h  staff  127  9 10 03:42 .git/objects/95/a94f3b7f5bcbb6d58727778f2061bf15cbfa23
⋊> ~/g/g/h/porcelain on master  git cat-file -p 95a94f3b7f5bcbb6d58727778f2061bf15cbfa23                                                                                                                  03:43:32
tree d9c9503b9f3651ce937e48d6603252573aaf18ed
author hirokihello <iammyeye1@gmail.com> 1599676966 +0900
committer hirokihello <iammyeye1@gmail.com> 1599676966 +0900

first commit

⋊> ~/g/g/h/porcelain on master  ls -la .git/objects/61/920632308d6d22a1112a5263afeb67c4ae75f5                                                                                                             03:44:37
-r--r--r--  1 inoue_h  staff  50  9 10 03:42 .git/objects/61/920632308d6d22a1112a5263afeb67c4ae75f5

⋊> ~/g/g/h/porcelain on master  git cat-file -p 61920632308d6d22a1112a5263afeb67c4ae75f5
100644 blob 72fc46ca77d5291c942f580b4a77763413d69c97    index
⋊> ~/g/g/h/porcelain on master  git cat-file -p 72fc46ca77d5291c942f580b4a77763413d69c97
Hello content!
```

addの時点で毎回スナップショットがオブジェクトの中に正じる。
addの時点ではファイル構造は反映されない。

commit時にindexの中身のtree構造がオブジェクトになりコピーされる。

```
⋊> ~/g/g/h/porcelain on master  rm -rf .git

⋊> ~/g/g/h/porcelain git init
Initialized empty Git repository in /Users/inoue_h/ghq/github.com/hirokihello/porcelain/.git/

⋊> ~/g/g/h/porcelain on master ⨯ git add .

⋊> ~/g/g/h/porcelain on master ⨯ git ls-files --stage
100644 72fc46ca77d5291c942f580b4a77763413d69c97 0       .porcelain/index
100644 5670ec5065dfcaaf20cd5b71bf30f8d899f75e28 0       README.md
100644 53a105ea5f5e52ea1d23fe4be6cec07a78f2257c 0       add.js
100644 517e43fb2247ff13b802adde2c302b0f624c387d 0       main.js
```

addした時は、ディレクトリは無視される。treeとして作成されるのは、commit時


refファイルはデフォルトで存在せず、最初のcommit時に作成されます。

```
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/refs/heads/                                                                                                                                                  21:31:54
total 0
drwxr-xr-x  2 inoue_h  staff   64  9 10 03:58 ./
drwxr-xr-x  4 inoue_h  staff  128  9 10 03:58 ../
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/refs/tags/                                                                                                                                                   21:32:09
total 0
drwxr-xr-x  2 inoue_h  staff   64  9 10 03:58 ./
drwxr-xr-x  4 inoue_h  staff  128  9 10 03:58 ../
⋊> ~/g/g/h/porcelain on master ⨯ git commit -m 'first commit'                                                                                                                                             21:32:14
[master (root-commit) e3bfe1c] first commit
 4 files changed, 284 insertions(+)
 create mode 100644 .porcelain/index
 create mode 100644 README.md
 create mode 100644 add.js
 create mode 100644 main.js
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/refs/heads/                                                                                                                                                  21:32:26
total 8
drwxr-xr-x  3 inoue_h  staff   96  9 10 21:32 ./
drwxr-xr-x  4 inoue_h  staff  128  9 10 03:58 ../
-rw-r--r--  1 inoue_h  staff   41  9 10 21:32 master
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/refs/tags/                                                                                                                                                   21:32:29
total 0
drwxr-xr-x  2 inoue_h  staff   64  9 10 03:58 ./
drwxr-xr-x  4 inoue_h  staff  128  9 10 03:58 ../
```

refのファイルには何がはいっているのだろうか。
```
⋊> ~/g/g/h/porcelain on master ⨯ cat .git/refs/heads/master
e3bfe1c290db82d424afec42e55e5b877d631237
```

ただのhashが平文で入っている。

```
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p e3bfe1c290db82d424afec42e55e5b877d631237                                                                                                                 21:34:49
tree 1dde203992d94fedc277337bcdeef00fa01e2508
author hirokihello <iammyeye1@gmail.com> 1599741146 +0900
committer hirokihello <iammyeye1@gmail.com> 1599741146 +0900

first commit
```

このようにREADME.mdに何かを追記してcommitしてみる。

```
⋊> ~/g/g/h/porcelain on master ⨯ git add .
⋊> ~/g/g/h/porcelain on master ⨯ git commit -m 'second commit'
[master d8b6f2d] second commit
 1 file changed, 71 insertions(+), 6 deletions(-)
⋊> ~/g/g/h/porcelain on master  cat .git/refs/heads/master
d8b6f2ddb6a2b5d5481359f8f04c4ce69b65ec0b
```

hashの値が変更されている。

```
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p d8b6f2ddb6a2b5d5481359f8f04c4ce69b65ec0b
tree b0ee3c6743a73b08ff0f283c7e1b76b1f7808e60
parent e3bfe1c290db82d424afec42e55e5b877d631237
author hirokihello <iammyeye1@gmail.com> 1599741318 +0900
committer hirokihello <iammyeye1@gmail.com> 1599741318 +0900

second commit
```

このような中身のファイルが作成された。
treeの中身が最新のファイル一覧である。

```
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p b0ee3c6743a73b08ff0f283c7e1b76b1f7808e60
040000 tree 61920632308d6d22a1112a5263afeb67c4ae75f5    .porcelain
100644 blob a5ff93b12587d406d44ccb6f92c4ee1b0d07bdec    README.md
100644 blob 53a105ea5f5e52ea1d23fe4be6cec07a78f2257c    add.js
100644 blob 517e43fb2247ff13b802adde2c302b0f624c387d    main.js
```

parentとなっているのは、一個前のcommitのtreeのhashである。

なるほど。

ここでaddの実装をしてみる、

確認だが、addを行うと現在のファイルの全ての状態をhash化して./.git/objectsに保存する。
また最新のファイル一覧に./.git/indexの値を置き換える。

これだけである。

どのようにhash化しているのだろうか。

```app.js
const crypto = require('crypto');
const fs = require('fs');

const shasum = crypto.createHash('sha1');

async function add () {
  fs.readFile("add.js", function(err, content) {
    console.log();
    header=`blob ${content.toString().length}\u0000`

    store = header + content.toString()
    shasum.update(store);
    console.log(shasum.digest('hex'));
  })

}

add()
```

app.jsにこのようなコードを書いてみる。
このコードでやっているのは、ファイルを読み込み、その文字列を取得し、そこからhash化する元を作成してSHA1関数で計算した結果を取得しています。

```
⋊> ~/g/g/h/porcelain on master ⨯ node add.js

c5228752eaab36716fae26f218d0fbae09e0e003
```
`c5228752eaab36716fae26f218d0fbae09e0e003`が返ってきました。これをgit addしたfileにあるか見てみましょう。


```
⋊> ~/g/g/h/porcelain on master ⨯ git add .
⋊> ~/g/g/h/porcelain on master ⨯ ls -la .git/objects/c5/228752eaab36716fae26f218d0fbae09e0e003
-r--r--r--  1 inoue_h  staff  238  9 10 22:32 .git/objects/c5/228752eaab36716fae26f218d0fbae09e0e003
```

objects以下に、今作成したファイル名で存在することがわかります。

```
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p c5228752eaab36716fae26f218d0fbae09e0e003
const crypto = require('crypto');
const fs = require('fs');

const shasum = crypto.createHash('sha1');

async function add () {
  fs.readFile("add.js", function(err, content) {
    console.log();
    header=`blob ${content.toString().length}\u0000`

    store = header + content.toString()
    shasum.update(store);
    console.log(shasum.digest('hex'));
  })

}

add()
```

これは先ほどまで見てきたファイル名と同じです。

中身が取得できたことがわかりました。gitはこのようにファイルを作成します。

https://nodejs.org/api/zlib.html#zlib_class_zlib_deflate
https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback

それでは中身はどのようになっているのでしょうか。

```add.js

const crypto = require('crypto');
const fs = require('fs');
var zlib = require('zlib');

const shasum = crypto.createHash('sha1');

async function add () {
  fs.readFile("add.js", function(err, content) {
    console.log();
    header=`blob ${content.toString().length}\u0000`

    store = header + content.toString()

    shasum.update(store);
    const sha1 = shasum.digest('hex')
    console.log(sha1);

    zlib.deflate(store, function (err, result) {
      dirPath = __dirname + '/.git/objects/' + sha1.substring(0,2)
      filePath = dirPath + '/' + sha1.substring(2, 38)
      console.log({dirPath})
      console.log({filePath})
      console.log(filePath.length)
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) throw err;

        fs.writeFile(filePath, result, function (err) {
          if (err) throw err;
          console.log('Saved!');
        })
      });

    });
  })
}

add()
```

addjsをこのよう書き換えます。

```
⋊> ~/g/g/h/porcelain on master ⨯ node add.js                                                                                                                                                              23:25:40

f976655aa02ee66371a137a5125b73e5e6908ab0
{
  dirPath: '/Users/inoue_h/ghq/github.com/hirokihello/porcelain/.git/objects/f9'
}
Saved!
```

```
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p f976655aa02ee66371a137a5125b73e5e6908a                                                                                                                   23:27:32
fatal: Not a valid object name f976655aa02ee66371a137a5125b73e5e6908a
⋊> ~/g/g/h/porcelain on master ⨯ git add .                                                                                                                                                                23:27:35
⋊> ~/g/g/h/porcelain on master ⨯ ls .git/objects/                                                                                                                                                         23:28:01
3f/   51/   72/   f9/   info/ pack/
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p f976655aa02ee66371a137a5125b73e5e6908a2
const crypto = require('crypto');
const fs = require('fs');
var zlib = require('zlib');

const shasum = crypto.createHash('sha1');

async function add () {
  fs.readFile("add.js", function(err, content) {
    console.log();
    header=`blob ${content.toString().length}\u0000`

    store = header + content.toString()

    shasum.update(store);
    const sha1 = shasum.digest('hex')
    console.log(sha1);

    zlib.deflate(store, function (err, result) {
      dirPath = __dirname + '/.git/objects/' + sha1.substring(0,2)
      filePath = dirPath + '/' + sha1.substring(2, 38)
      console.log({dirPath})
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) throw err;

        fs.writeFile(filePath, result, function (err) {
          if (err) throw err;
          console.log('Saved!');
        })
      });

    });
  })
}

add()
```

ここからわかるのは、git cat-fileコマンドで指定できるhashは、一度でもaddしたものが見れるということです。逆に言えばaddしなければcat-fileコマンドは見ることができません。悲しい...

おそらくgitの実装だと思うのですが、

f976655aa02ee66371a137a5125b73e5e6908ab0

dadafaafafafa



よくわからんけどできるようになった！！！

```test.js
function test () {
  const a = "abcd"
  console.log(a.length)
  console.log(a.substring(0,2))
  console.log(a.substring(2,4))
}

test()
```


```add.js
const crypto = require('crypto');
const fs = require('fs');
var zlib = require('zlib');
const shasum = crypto.createHash('sha1');

async function add () {
  fs.readFile("test.js", function(err, res) {
    const content = res.toString()
    const header=`blob ${content.length}\0`

    const store = header + content;
    shasum.update(store);
    const sha1 = shasum.digest('hex')

    zlib.deflate(store, function (err, result) {
      dirPath = __dirname + '/.git/objects/' + sha1.substring(0,2)
      filePath = dirPath + '/' + sha1.substring(2, 41)
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) throw err;

        fs.writeFile(filePath, result, function (err) {
          if (err) throw err;
          console.log('Saved!');
        })
      });

    });
  })
}

add()

```

```
⋊> ~/g/g/h/porcelain on master ⨯ node add.js
{
  store: 'blob 136\x00function test () {\n' +
    '  const a = "abcd"\n' +
    '  console.log(a.length)\n' +
    '  console.log(a.substring(0,2))\n' +
    '  console.log(a.substring(2,4))\n' +
    '}\n' +
    '\n' +
    'test()\n'
}
{ sha1: '4c23634ac189b30cceb969f179bf89dd862bed47' }
Saved!
⋊> ~/g/g/h/porcelain on master ⨯ git cat-file -p 4c23634ac189b30cceb969f179bf89dd862bed47
function test () {
  const a = "abcd"
  console.log(a.length)
  console.log(a.substring(0,2))
  console.log(a.substring(2,4))
}

test()
```

git cat-file -pでファイルの中身がわかることから、きちんとgitの仕様に乗っ取りファイルの保存ができていることがわかる！！！



```add.js
async function add () {
  fs.readFile("test.js", function(err, res) {
    const content = res.toString()
    const header=`blob ${content.length}\0`
    const store = header + content;
    shasum.update(store);
    const sha1 = shasum.digest('hex')

    zlib.deflate(header, function (err, result) {
      zlib.inflate(result, function (err, res) {
        console.log(res)
        console.log(res.toString());
      });
    });
  }
}
```

hexdumpは二文字で1byte=8bit

```
⋊> ~/g/g/h/porcelain on master ⨯ node add.js
<Buffer 62 6c 6f 62 20 31 33 36 00>
blob 136
```

このような結果になったので、null byteは00が終点にくるとわかる。

#### indexの仕様について

```
⋊> ~/g/g/h/porcelain on master ⨯ hexdump -C .git/index | head -n 25                                                                                                                                       16:02:23
00000000  44 49 52 43 00 00 00 02  00 00 00 01 5f 5b aa ed  |DIRC........_[..|
00000010  39 8f 33 d8 5f 5b aa ed  39 8f 33 d8 01 00 00 07  |9.3._[..9.3.....|
00000020  05 ca d1 f5 00 00 81 a4  00 00 01 f5 00 00 00 14  |................|
00000030  00 00 00 88 4c 23 63 4a  c1 89 b3 0c ce b9 69 f1  |....L#cJ......i.|
00000040  79 bf 89 dd 86 2b ed 47  00 07 74 65 73 74 2e 6a  |y....+.G..test.j|
00000050  73 00 00 00 2f 10 a5 42  41 46 41 6e 12 a3 6b da  |s.../..BAFAn..k.|
00000060  ab fb cd b7 13 0d 94 33                           |.......3|
00000068
⋊> ~/g/g/h/porcelain on master ⨯ git add main.js                                                                                                                                                          16:02:23
⋊> ~/g/g/h/porcelain on master ⨯ hexdump -C .git/index | head -n 25                                                                                                                                       16:02:48
00000000  44 49 52 43 00 00 00 02  00 00 00 02 5f 5a 5d 92  |DIRC........_Z].|
00000010  1d 9e 1a cb 5f 5a 5d 92  1d 9e 1a cb 01 00 00 07  |...._Z].........|
00000020  05 c6 67 17 00 00 81 a4  00 00 01 f5 00 00 00 14  |..g.............|
00000030  00 00 01 7f 51 7e 43 fb  22 47 ff 13 b8 02 ad de  |....Q~C."G......|
00000040  2c 30 2b 0f 62 4c 38 7d  00 07 6d 61 69 6e 2e 6a  |,0+.bL8}..main.j|
00000050  73 00 00 00 5f 5b aa ed  39 8f 33 d8 5f 5b aa ed  |s..._[..9.3._[..|
00000060  39 8f 33 d8 01 00 00 07  05 ca d1 f5 00 00 81 a4  |9.3.............|
00000070  00 00 01 f5 00 00 00 14  00 00 00 88 4c 23 63 4a  |............L#cJ|
00000080  c1 89 b3 0c ce b9 69 f1  79 bf 89 dd 86 2b ed 47  |......i.y....+.G|
00000090  00 07 74 65 73 74 2e 6a  73 00 00 00 61 02 57 10  |..test.js...a.W.|
000000a0  89 9f b0 e6 7e dd 9b 36  a4 09 1b 8f 3e bb 94 ea  |....~..6....>...|
000000b0
```

このようになっている。

`https://github.com/git/git/blob/v2.12.0/Documentation/technical/index-format.txt`

gitの仕様書に寄れば、最初の12バイトはヘッダー部分である。
```
   - A 12-byte header consisting of

     4-byte signature:
       The signature is { 'D', 'I', 'R', 'C' } (stands for "dircache")

     4-byte version number:
       The current supported versions are 2, 3 and 4.

     32-bit number of index entries.
```

今回の例でいうと、下記のようになる。

DIRCを表す
```
44 49 52 43
```

バージョン
```
00 00 00 02
```

ファイル数
```
00 00 00 02
```


この記事がgitのindexファイルについて、詳しかった。
`https://mincong.io/2018/04/28/git-index/`

ここではgitの仕様に加えて自分なりの補足をつけた。

```
0xFFF = 4095

# A 16-bit 'flags' field split into (high to low bits)

1-bit assume-valid flag
# The resource has the "assume unchanged" flag.　gitの管理対象にしないかのフラグ。true場合更新は無視される(デフォルトはfalse)

1-bit extended flag (must be zero in version 2)
# とりあえずバージョン２なので0にしておく

2-bit stage (during merge)
# マージ機能は今回扱わないので00にしておく。

12-bit name length if the length is less than 0xFFF; otherwise 0xFFF
# is stored in this field.
```

事実dumpしたhexこのようになっているので、今回の場合はファイル名のながさをぶち込めば良いだろう。
```
00 07
```

ここにステージング
`http://alblue.bandlem.com/2011/10/git-tip-of-week-index-revisited.html`

indexのupdate機能を実装していく。

まずはindexが存在しなかった時に作成し、また書き込む動作である。

```
function updateIndex () {
  fs.writeFile(".git/index", "", function (err) {
    if (err) throw err;
    console.log('Saved!');
  })
}
```

次にheaderの実装である。headerの要件は下記の通りである。

```
   - A 12-byte header consisting of

     4-byte signature:
       The signature is { 'D', 'I', 'R', 'C' } (stands for "dircache")

     4-byte version number:
       The current supported versions are 2, 3 and 4.

     32-bit number of index entries.
```

```
function updateIndex () {
  const header = Buffer.alloc(12);
  const fileNum = 111

  header.write('DIRC', 0);
  header.writeInt32BE(2, 4);
  header.writeInt32BE(fileNum, 8);
  fs.writeFile(".git/index", "", function (err) {
    if (err) throw err;
    console.log('Saved!');
  })
}
```

indexのheader情報は、全部で12byteなのでBufferクラスのallocで12バイト割り当てます。
またファイル数は可変ですが、今の段階では固定します。
```
  const header = Buffer.alloc(12);
  const fileNum = 1
```

DIRCの固定の文字列を記入します。
```
  header.write('DIRC', 0);
```

writeInt32BEは4byteを割り当てて、numberを書き込んでくれます。BEとあるのはbig endianです。第二引数の4で、4byte目からの割り当てということを明記します。
```
  header.writeInt32BE(2, 4);
```

バージョン情報と同様です。
```
header.writeInt32BE(fileNum, 8);
```

次にファイル本体の情報である、エントリーについてです。
エントリーの仕様はこのようになっています。

```
  32-bit ctime seconds, the last time a file's metadata changed
  32-bit ctime nanosecond fractions
  32-bit mtime seconds, the last time a file's data changed
  32-bit mtime nanosecond fractions
  32-bit dev
  32-bit ino
  32-bit mode, split into (high to low bits)
    4-bit object type
    3-bit unused
    9-bit unix permission
  32-bit uid
  32-bit gid
  32-bit file size
  160-bit SHA-1 for the represented object
  A 16-bit 'flags' field split into (high to low bits)
    1-bit assume-valid flag
    1-bit extended flag (must be zero in version 2)
    2-bit stage (during merge)
    12-bit name length
  Entry path name (variable length)
  1-8 nul bytes
```

基本的にはファイルstatの情報をそのまま入力していけばよさそうです。

今回は、fsモジュールのpromise版を使っていきます。再帰の処理などで考えることが減るので。


nodeの場合、nano secondをデフォルトのfs.statでは出してくれないので、bigintオプションをつけて取得します。
その場合bigintになるので注意が必要です。
```

  const statInfo = await fs.stat("test.js", {bigint: true})
  const ctime = parseInt((statInfo.ctime.getTime() / 1000 ).toFixed(0))
  // 下9桁欲しい
  const ctimeNs = parseInt(statInfo.ctimeNs  % 1000000000n)
  const mtime = parseInt((statInfo.mtime.getTime() / 1000 ).toFixed(0))
  const mtimeNs = parseInt(statInfo.mtimeNs % 1000000000n)
  const dev = parseInt(statInfo.dev)
  const ino = parseInt(statInfo.ino)
  const mode = parseInt(statInfo.mode)
  const uid = parseInt(statInfo.uid)
  const gid = parseInt(statInfo.gid)
  const size = parseInt(statInfo.size)
```

```
    const statInfo = await fs.stat("test.js", {bigint: true})

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

    let stat = Buffer.alloc(40);
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
    ].forEach((attr, idx) => stat.writeInt32BE(attr, idx * 4))
```

それをこんな感じでぐるぐる回していきます。

```
  160-bit SHA-1 for the represented object
```

これはaddObjectで実装していた関数を使いまわします。

flagの実装について。
gitのformatではこのようになっています。
```
  A 16-bit 'flags' field split into (high to low bits)

    1-bit assume-valid flag

    1-bit extended flag (must be zero in version 2)

    2-bit stage (during merge)

    12-bit name length if the length is less than 0xFFF; otherwise 0xFFF
    is stored in this field.
```

assume-valid flagですがデフォルトは0です。またextended flagもバージョン２では０となります。

bit演算についてはこのようにします。

```
    const assumeValid = 0b0 // 1 or 0 default is 0
    const extendedFlag = 0b0 // 1 or 0 default is 0
    const optinalFlag = (((0b0 | assumeValid) << 1) |　extendedFlag) << 14
    const flagRes = flag | "test.js".length //test.jsここは後で変数に置き換えます。
```

nodejsのbit演算では、2進数の物をbit演算しても10進数で帰ってくるのでそこに注意が必要です。bit演算自体は2進数と10進数で行うことができます(暗黙の型変換キモい)
