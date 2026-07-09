AIシグナルボードを更新してください。

目的:
- GitHub Actions巡回は使わず、Codexが公式ソースをWeb確認して要約済みニュースを更新する。
- API費用がかかる外部AIサービスは使わない。
- 公式ソースのみを使う。

対象ファイル:
- data/news.json
- data/features.json
- index.html
- feature-news.html
- compare.html
- README.md

必須ルール:
- OpenAI、Anthropic、Google DeepMind、Microsoft AI/Azure、GitHub Copilot、Mistral AI、Vercel AI、Cursor/Anysphere関連の公式サイト、公式ブログ、公式ドキュメント、公式チェンジログだけを確認する。
- 二次メディア、SNS、噂、リーク、個人ブログは使わない。
- ニュースは過去分を消さず、最新分を追加する。重複URLは追加しない。
- 1回の更新で追加するニュースは最大6件。
- 重要度の低いものは追加しない。
- `type` は `feature`、`security`、`model`、`policy`、`business` のいずれかにする。
- 機能追加ニュースは `type: "feature"` にする。
- ベータ版、技術検証版、限定プレビューは `status: "beta"` または `status: "preview"` にする。
- タイトル、要約、開発者メモは日本語にする。
- 難しい用語がある場合は `terms` に用語解説を追加する。
- 固定表示の説明文をHTMLへ追加しない。
- 英語UIラベルを追加しない。
- 公式URL以外を追加しない。

更新内容:
1. 公式ソースをWeb確認する。
2. `data/news.json` に新しい重要ニュースを追加する。
3. 機能比較に関係する更新があれば `data/features.json` も更新する。
4. `data/inbox.json` は使わない。未処理通知運用は不要。
5. JSON構文を検証する。
6. 変更内容を簡潔に最終報告する。

禁止:
- git commitしない。
- git pushしない。
- GitHub Actionsの巡回を復活させない。
- 公式ソース以外を根拠にしない。
