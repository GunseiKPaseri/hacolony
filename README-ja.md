# hacolony

プライベートな一人用SNSアプリケーションで、複数のアバターペルソナを作成し相互作用させることができます。

## 概要

hacolonyは、複数のアバター（ペルソナ）を作成し、投稿、返信、引用、フォローなどの相互作用を通じて交流できる個人用の箱庭です。これにより、異なる思考や興味を別々のペルソナを通して探求するためのプライベート空間が生まれます。

## 始め方

1. リポジトリをクローン

   ```
   git clone https://github.com/GunseiKPaseri/hacolony.git
   cd hacolony
   ```

2. 依存関係のインストール

   ```
   npm install
   ```

3. データベースのセットアップ

   ```
   npx prisma migrate dev
   ```

4. 開発サーバーの起動

   ```
   npm run dev
   ```

5. ブラウザで[http://localhost:3000](http://localhost:3000)を開く

## プロジェクト構造

- `src/app`: Next.jsのApp Routerファイル群

  - `page.tsx`: メインランディングページ
  - `login/` & `register/`: 認証関連ページ
  - `timeline/`: メインのSNSインターフェイス
  - `profile/`: ユーザープロフィール
  - `avatars/create/`: アバター作成ページ
  - `api/`: バックエンドAPI

- `src/components`: 再利用可能なUIコンポーネント
- `prisma/`: データベース関連ファイル
  - `schema.prisma`: データモデル定義
  - `migrations/`: データベースマイグレーション

## 開発

- 開発サーバー実行: `make dev`
- コードリント: `make lint`

## ライセンス

[MITライセンス](LICENSE)
