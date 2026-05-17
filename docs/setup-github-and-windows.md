# GitHub and Windows Setup

このメモは、AIシグナルボードをGitHub Pagesで公開し、Codexで深夜更新するための手順です。

## 1. GitHub側の設定

### Repository

1. GitHubで新しいリポジトリを作る。
2. Publicリポジトリにする。GitHub PagesとActionsの無料運用がしやすいです。
3. ローカルでこのフォルダをGit管理にする。

注意: 今のフォルダには空の `.git` ディレクトリがあります。Gitとしては未初期化なので、削除してから作り直します。

PowerShell例:

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
Remove-Item -Recurse -Force .git
git init
git branch -M main
git add .
git commit -m "Initial AI Signal Board"
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

### Pages

1. GitHubのリポジトリを開く。
2. `Settings` -> `Pages` を開く。
3. `Build and deployment` の `Source` を `Deploy from a branch` にする。
4. `Branch` を `main`、フォルダを `/root` にする。
5. 保存する。

数分後に `https://YOUR_NAME.github.io/YOUR_REPO/` で見られます。

## 2. GitHub Actions巡回を使わない

深夜更新はCodexで行うため、GitHub Actionsの巡回は不要です。`.github/workflows/crawl-sources.yml` は削除または無効化してください。

GitHubは次の用途だけにします。

- GitHub Pagesで公開する
- Codexが更新したファイルをpushする

## 3. 深夜にスリープ解除してCodex更新する

Windowsタスクスケジューラを使います。PCはシャットダウンせず、スリープにしておきます。

前提:

- Gitリポジトリが初期化済み
- GitHub remote設定済み
- `git push` がパスワード入力なしで成功する
- WSL内で `codex` コマンドが使える
- WSL内でCodexにログイン済み

手動テスト:

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\run_codex_nightly_update.ps1
```

毎日4:00に登録:

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\register_codex_nightly_task.ps1 -Time "04:00"
```

終わったあと再スリープしたい場合:

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\register_codex_nightly_task.ps1 -Time "04:00" -SleepAfter
```

タスクスケジューラで確認する項目:

- `条件` -> `タスクを実行するためにスリープを解除する`
- `設定` -> `スケジュールされた時刻にタスクを開始できなかった場合、すぐにタスクを実行する`

ログは `scripts/logs/` に保存されます。

## 4. PC起動時にローカル巡回だけする旧方式

### ログオン時に実行する

PowerShellを開きます。

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\register_ai_news_startup_task.ps1 -TriggerType LogOn
```

これでWindowsにログオンしたタイミングで `scripts/windows/run_ai_news_startup.bat` が実行されます。

### 毎日決まった時刻に実行する

スリープ復帰も狙うなら、毎日指定時刻のタスクにします。管理者PowerShellのほうが確実です。

```powershell
cd "C:\Users\darum\Desktop\サイト類\ai-news"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\register_ai_news_startup_task.ps1 -TriggerType Daily -Time "09:00"
```

これで毎日9:00に実行されます。スリープ中なら、タスク設定の `Wake the computer to run this task` が有効な場合に復帰できます。

## 5. 完全シャットダウンから自動起動したい場合

Windowsタスクスケジューラだけでは、完全に電源が切れたPCを起動できません。必要なものはどちらかです。

- BIOS/UEFIの `RTC Wake` / `Wake on Alarm`
- 別端末からの Wake-on-LAN

おすすめはスリープ運用です。完全シャットダウン運用はPC機種ごとの差が大きいです。

## 6. Codex要約を自動起動できるか

`codex exec` を使えば可能です。ただし、完全無人運用にする前に数回は手動テストしてください。

理由:

- CodexのAI要約は対話・確認が必要になる場合がある
- 完了検知と失敗時の扱いが難しい
- 自動シャットダウンと組み合わせると、途中終了のリスクがある

やるなら段階的にします。

1. 手動で `run_codex_nightly_update.ps1` を実行
2. 問題なければタスクスケジューラへ登録
3. 数日ログを確認
4. 安定したら `-SleepAfter` を付ける
