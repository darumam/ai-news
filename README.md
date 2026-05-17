# AIシグナルボード

公式ソースだけを対象に、AI関連の重要アップデートを日本語で要約する個人用ダッシュボードです。

## ページ

- `index.html`: ニュースと過去ニュース
- `feature-news.html`: 機能追加ニュース
- `compare.html`: AI機能比較

## データ

- `data/news.json`: 要約済みニュース
- `data/features.json`: 機能比較
- `data/sources.json`: 公式確認先の候補

## GitHub Pages

GitHub Pagesでは、リポジトリのルートを公開対象にしてください。外部スクリプトや外部CDNは使っていません。

## 運用

GitHub Actions巡回は使いません。毎日4:00にWindowsのスリープを解除し、Codexが公式ソースを確認して、ニュースと機能比較を更新し、GitHubへpushする方針です。

登録:

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\register_codex_nightly_task.ps1 -Time "04:00"
```

終わったあと再スリープ:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\register_codex_nightly_task.ps1 -Time "04:00" -SleepAfter
```

## Codex更新ルール

- 公式サイト、公式ブログ、公式ドキュメント、公式チェンジログのみを扱う。
- 二次メディア、SNS、噂、リーク、個人ブログは使わない。
- ニュースは過去分を消さずに追加する。
- タイトル、要約、開発者メモは日本語にする。
- 難しい用語は `terms` に用語解説を入れる。
- 機能追加ニュースは `type: "feature"` にする。
- ベータ版、技術検証版、限定プレビューは `status: "beta"` または `status: "preview"` にする。
- 固定表示の説明文をHTMLへ追加しない。

## 機能比較

`compare.html` は機能一覧と対応状況の2段構成です。

- `〇`: 公式に使える、または主要機能として扱える
- `△`: 一部対応、ベータ/プレビュー、用途や制約の確認が必要
- `×`: 主用途ではない、または公式確認できていない

更新時は `data/features.json` の `catalog` と `matrix` を編集します。

## 詳細手順

GitHub Pages、Codex深夜更新、Windowsタスクスケジューラ手順は `docs/setup-github-and-windows.md` にまとめています。
