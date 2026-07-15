# あやあみ / Ayaami

あやちゃん専用の編み物管理アプリです。
Mac で開発し、GitHub Pages で公開した URL を iPad のホーム画面に追加して使う PWA として育てます。
App Store 配布は前提にしません。

## フォルダ構成

```text
ayaami/
  あやあみ.command        Macで起動するためのダブルクリック用ファイル
  project/                アプリ本体
  docs/                   方針・要件資料
  reference/              ClaudeDesignの参照プロトタイプ・仕様
```

## 公開

`main` ブランチへ push すると、GitHub Actions が `project/` フォルダだけを GitHub Pages に公開します。

端末内データは IndexedDB に保存されるため、公開URLを変更したときは旧PWAでJSONバックアップを書き出し、新PWAでインポートします。

## 起動方法

### ダブルクリック

`あやあみ.command` を開くと、ローカルサーバーを起動してブラウザで表示します。
Mac に通常の `node` が入っていない場合でも、Codex の bundled Node がある環境ではそれを使います。

### ターミナル

```bash
cd /Users/satoru/developer/ayaami/project
node dev-server.mjs
```

ブラウザで以下を開きます。

```text
http://127.0.0.1:4173/
```

iPad から同じ Wi-Fi で確認するときは、Mac の IP アドレスで開きます。

```text
http://<MacのIPアドレス>:4173/
```

## 重要な方針

- iPadでは Safari からホーム画面に追加して使う。
- データは端末内の IndexedDB に保存する。
- iPad本番利用時のURLは GitHub Pages の固定URLにする。URLが変わると別アプリのように扱われ、保存データも別管理になる。
- PWAのオフライン対応やホーム画面利用を安定させるため、本番配布は HTTPS の固定URLを使う。
- バックアップJSONは個人データと写真/PDFを含むため、GitHubには置かない。
- デザインは勝手に変えない。
- UI追加は `project/island-theme.css` の変数・既存クラス・既存部品を使う。
- 画面構造は `project/island-app.js` の既存 `vXxx()` 関数のパターンに寄せる。
- 次の大きな作業は、今の ClaudeDesign UI を IndexedDB に接続して保存処理を本物にすること。

詳細は [docs/APP_TARGET.md](/Users/satoru/developer/ayaami/docs/APP_TARGET.md) を参照してください。
