# BIG3 セットビルダー

ベンチプレス・スクワット・デッドリフトの1RMを入力すると、メインDay（アップ・メイン・バックオフ）／中強度Day／軽めDayのセットを自動計算するNext.js（App Router）アプリ。

## ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

## Vercelへのデプロイ

このリポジトリ（`big3-set-builder` ディレクトリ）をVercelにインポートするだけでビルド設定不要でデプロイできる。

```bash
npm i -g vercel
vercel
```

または [vercel.com](https://vercel.com) でGitHubリポジトリをインポート（Framework Presetは自動で Next.js が検出される）。

## 構成

- `app/` — App Router のページ・レイアウト
- `components/Big3SetBuilder.tsx` — 計算UI本体（クライアントコンポーネント）
- `lib/exercises.ts` — 種目ごとの%1RMレンジ・reps・sets定義
- `lib/calc.ts` — 重量丸め・アップセット計算ロジック

スクワット・デッドリフトの%1RMレンジは、RM換算式の係数差（ベンチ: `1RM≈W×(1+reps/40)`、スクワット/デッドリフト: `1RM≈W×(1+reps/33.3)`）を根拠に、ベンチ比で一律 -2.5pt シフトしている（詳細は `lib/exercises.ts` のコメントとアプリ内の注記を参照）。
