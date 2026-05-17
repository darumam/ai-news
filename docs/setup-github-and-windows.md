# GitHub and Windows Setup

このメモは、AI Signal BoardをGitHub Pagesで公開し、GitHub Actionsで公式ソース巡回を動かし、必要ならPC起動時にもローカル巡回するための手順です。

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

### Actions

1. `Settings` -> `Actions` -> `General` を開く。
2. `Actions permissions` でActionsを許可する。
3. `Workflow permissions` を `Read and write permissions` にする。
4. `Allow GitHub Actions to create and approve pull requests` は不要です。
5. `Actions` タブから `Crawl official AI sources` を開き、`Run workflow` で手動実行する。

成功すると `data/inbox.json` が更新され、`inbox.html` に更新通知が出ます。

## 2. GitHub Actionsの役割

GitHub ActionsはAI要約しません。API費用ゼロを守るため、やることは公式ソースの巡回と未要約通知の追加だけです。

- 実行: 1日1回
- 手動実行: 可能
- 更新対象: `data/inbox.json`
- 既に `data/news.json` にあるURL: 通知から削除

## 3. PC起動時にローカル巡回する

GitHub Actionsがあるので、通常はPC起動時の巡回は不要です。ただしローカルでも更新通知を作りたい場合は、Windowsタスクスケジューラを使います。

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

## 4. 完全シャットダウンから自動起動したい場合

Windowsタスクスケジューラだけでは、完全に電源が切れたPCを起動できません。必要なものはどちらかです。

- BIOS/UEFIの `RTC Wake` / `Wake on Alarm`
- 別端末からの Wake-on-LAN

おすすめはスリープ運用です。完全シャットダウン運用はPC機種ごとの差が大きいです。

## 5. Codex要約を自動起動できるか

現実的には、GitHub Actionsで通知を集め、Codexを開いたときに要約する運用が安定です。

理由:

- CodexのAI要約は対話・確認が必要になりやすい
- 完了検知と失敗時の扱いが難しい
- 自動シャットダウンと組み合わせると、途中終了のリスクがある

やるなら段階的にします。

1. GitHub Actionsで通知収集
2. PC起動時にローカル巡回だけ実行
3. Codexで要約更新
4. 安定してから電源自動化を検討
