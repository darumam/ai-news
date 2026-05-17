# AIシグナルボード

公式ソースだけを対象に、AI関連の重要アップデートを短い日本語要約で読むための個人用ダッシュボードです。

## ページ

- `index.html`: Codexで要約済みの重要ニュース
- `inbox.html`: GitHub Actionsが見つけた未要約の更新通知
- `compare.html`: 開発者向けAI機能の比較

## データ

- `data/news.json`: 要約済みニュース
- `data/inbox.json`: 未要約の巡回通知
- `data/features.json`: 機能比較
- `data/sources.json`: 公式巡回ソース

## GitHub Pages

GitHub Pagesでは、リポジトリのルートを公開対象にしてください。外部スクリプトや外部CDNは使っていません。

## GitHub Actions巡回

`.github/workflows/crawl-sources.yml` が1日1回、公式ソースを巡回します。

- API費用ゼロ
- AI要約なし
- RSS/Atom中心
- 公式URLだけを `data/inbox.json` に追加
- `data/news.json` に掲載済みのURLは通知から削除
- 手動実行は GitHub の Actions タブから `Crawl official AI sources` を実行

ローカル確認:

```bash
python3 scripts/crawl_sources.py --dry-run
```

実際に `data/inbox.json` を更新:

```bash
python3 scripts/crawl_sources.py
```

## ソース方針

扱うのは公式サイト、公式ブログ、公式ドキュメント、公式チェンジログだけです。二次メディア、SNS、噂、リーク、個人ブログは除外します。

現在の対象:

- OpenAI
- Anthropic
- Google DeepMind
- Microsoft AI / Azure
- GitHub Copilot
- Mistral AI
- Vercel AI関連

## Codex更新手順

Codexを開いたら、次の流れで更新します。

1. `data/inbox.json` の未要約通知を確認する。
2. 重要な候補だけ公式URLを開いて内容確認する。
3. 日本語で短く要約し、`data/news.json` に追加する。
4. ベータ版、技術検証版、限定プレビューなどは `status` に `beta` または `preview` を入れる。
5. 機能比較に関係する更新は `data/features.json` に反映する。
6. `python3 scripts/crawl_sources.py` を実行し、`news.json` に掲載済みのURLを `inbox.json` から消す。
7. `index.html`、`inbox.html`、`compare.html` を確認する。

Codexに頼む時のプロンプト例:

```text
data/inbox.json の未要約通知を確認し、重要な公式更新だけを data/news.json に日本語で短く要約してください。
ベータ版やプレビュー版は status に反映してください。
機能比較に関係するものは data/features.json も更新してください。
最後に scripts/crawl_sources.py を実行して、掲載済みURLを inbox.json から削除してください。
公式ソース以外は使わないでください。
```

## 機能比較

`compare.html` は2段構成です。

- 機能一覧: 何を見るべきかのカタログ
- 対応状況: 提供元ごとに `〇 / △ / ×` で比較

記号の意味:

- `〇`: 公式に使える、または主要機能として扱える
- `△`: 一部対応、ベータ/プレビュー、用途や制約の確認が必要
- `×`: 主用途ではない、または公式確認できていない

更新時は `data/features.json` の `catalog` と `matrix` を編集します。

## PCスケジュール

PCを決まった時間に起動してCodex更新を走らせ、終わったらシャットダウンする運用は、条件つきで可能です。

- スリープ復帰なら、Windowsタスクスケジューラで起動時刻を指定しやすいです。
- 完全シャットダウンからの自動起動は、BIOS/UEFIのRTC WakeやWake-on-LAN対応が必要です。
- GitHub Actions巡回だけならPC不要です。
- CodexによるAI要約まで完全自動化する場合、Codexアプリ/CLIを安定して起動し、完了検知してシャットダウンする仕組みが別途必要です。

おすすめは、GitHub Actionsで通知だけ自動収集し、Codex要約はPCを開いたタイミングで実行する運用です。電源自動化は最後に足すほうが安全です。

詳しいGitHub Pages / Codex深夜更新 / Windowsタスクスケジューラ手順は `docs/setup-github-and-windows.md` にまとめています。
