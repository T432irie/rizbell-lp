# rizbell-lp（swipe-app）— Claude Code 向けの案内

まず `AGENTS.md`（全 AI 共通のルール）と `HANDOFF.md`（引き継ぎ）を読む。

## 構成
- Next.js 16（App Router）＋ **JavaScript**（TypeScript ではない）
  - `app/`：画面と API（`app/api/`、`app/admin/`、`app/editor/`、`app/p/`、`app/auth/`）
  - `lib/`：Supabase のクライアントなど
  - `services/aiService.js`
  - `migrations/`：DB の変更の SQL
  - `src/` と README は、昔の Create React App の名残。README の説明は今の構成と合わない
- 本番
  - Vercel のプロジェクト `swipe-app`（rizbell.com）。main にマージすると本番に反映される。PR のプレビューは BLOCKED になる（2026-11-21 時点）
  - DB は Supabase（rizbell-lfo とは別のプロジェクト）

## 主なコマンド
| 用途 | コマンド | 目安 |
|---|---|---|
| ビルド | `npm run build` | 約18秒（2026-11-21） |
| 開発 | `npm run dev` | |
- **使えるチェックはビルドだけ**
  - 型チェックはない（JavaScript のため）
  - テストもない
  - lint も使えない。`package.json` に `lint`（`next lint`）のスクリプトは残っているが、`next lint` は Next.js 16 で廃止されていて、eslint も入っていないので実行しない
- `.claude/quick-check.json` には PR の前の全チェック（`full`：ビルドだけ）しか設定していない。編集後の自動チェック（`edit`）はないので、PostToolUse フックは何もしない
- このファイルがあるので、Claude Code から `gh pr create` をするには、今のコミットで `~/dev/setup/bin/pre-pr-check.sh`（ビルド）を通し、このブランチで `~/dev/setup/bin/cursor-review.sh` を実行しておく必要がある（PreToolUse フックが確かめる。pr-review-loop スキル）

## 触ってはいけない場所・注意
- `.env.local` は秘密情報。コミットしない・表示しない
- 本番の DB と Vercel の設定は、T の承認なしに変えない
- main に直接コミットしない（main は保護されている）
- 画面に関わる変更は、Chrome DevTools MCP でスマホ幅と PC 幅の両方を確かめる（~/.claude/CLAUDE.md）

## 過去の注意点
- 2026-11-21 PR の Vercel のプレビューが BLOCKED（ビルドの失敗ではない）。main は本番（170329d）と同じコミットだった

## 教訓
<!-- 同じ種類の失敗や、T に指摘された間違いを1行で追記する（日付・何が起きたか・次からどうするか）。~/.claude/CLAUDE.md の「教訓の記録」のルール -->
- （まだない）
