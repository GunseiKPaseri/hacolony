# API リファクタリング完了レポート

## 概要

`src/app/api`ディレクトリ下のAPI実装を、内部処理をユースケースとして`src/server/services`ディレクトリに移動・再実装しました。

## 実装したユースケースサービス

### 1. UserService (`src/server/services/userService.ts`)

- **責任**: ユーザー認証・管理に関するビジネスロジック
- **主要メソッド**:
  - `createUser()`: ユーザー登録（入力値検証含む）
  - `getUserByEmail()`: メールアドレスでユーザー検索
  - `getUserByIdWithAvatar()`: ユーザーとアバター情報取得
  - `hasAvatar()`: アバター存在確認
  - `getSelfAvatar()`: 自己アバター取得

### 2. AvatarService (`src/server/services/avatarService.ts`)

- **責任**: アバター作成・管理に関するビジネスロジック
- **主要メソッド**:
  - `getAvatarsByUserId()`: ユーザーのアバター一覧取得
  - `createAvatar()`: 通常アバター作成
  - `createSelfAvatar()`: 自己アバター作成（フォロー関係含む）
  - `createAIAvatar()`: AIアバター作成（BotConfig・フォロー関係含む）

### 3. PostService (`src/server/services/postService.ts`)

- **責任**: 投稿管理に関するビジネスロジック
- **主要メソッド**:
  - `getPostsByUserId()`: ユーザーの投稿一覧取得
  - `createPost()`: 投稿作成（ボットリプライトリガー含む）

## 更新されたAPIエンドポイント

### 認証関連

- `POST /api/auth/register` → `UserService.createUser()`
- `POST /api/auth/[...nextauth]` → `UserService.getUserByEmail()`

### アバター関連

- `GET /api/avatars` → `AvatarService.getAvatarsByUserId()`
- `POST /api/avatars` → `AvatarService.createAvatar()`
- `GET /api/avatar/self` → `UserService.getSelfAvatar()`
- `POST /api/avatar/self` → `AvatarService.createSelfAvatar()`
- `POST /api/avatar/ai` → `AvatarService.createAIAvatar()`

### 投稿関連

- `GET /api/posts` → `PostService.getPostsByUserId()`
- `POST /api/posts` → `PostService.createPost()`

## DI（依存性注入）の設定更新

### 追加されたサービス登録

```typescript
// src/server/di.type.ts
BotReplyService: Symbol.for("BotReplyService"),
UserService: Symbol.for("UserService"),
AvatarService: Symbol.for("AvatarService"),
PostService: Symbol.for("PostService"),

// src/server/di.ts
container.registerSingleton(DI.BotReplyService, BotReplyService);
container.registerSingleton(DI.UserService, UserService);
container.registerSingleton(DI.AvatarService, AvatarService);
container.registerSingleton(DI.PostService, PostService);
```

## 改善点

### 1. 関心の分離

- API層：HTTPリクエスト/レスポンス処理、認証チェック、エラーハンドリング
- サービス層：ビジネスロジック、入力値検証、複数リポジトリの協調

### 2. 入力値検証の強化

- 各サービスメソッドで適切な入力値検証を実装
- エラーメッセージの統一化

### 3. トランザクション処理

- 複数のデータベース操作が必要な処理でPrismaトランザクションを使用
- データ整合性の確保

### 4. エラーハンドリングの統一

- `InvalidInputError`と`NotFoundError`の適切な使い分け
- 一貫したエラーレスポンス形式

## 今後の改善提案

1. **テストの充実**: 各ユースケースサービスの単体テスト追加
2. **バリデーション強化**: より詳細な入力値検証ルールの実装
3. **ログ出力**: 各サービスでの適切なログ出力
4. **型安全性**: より厳密な型定義の導入
5. **パフォーマンス**: データベースクエリの最適化

## 使用技術

- TypeScript
- Next.js App Router
- Prisma
- tsyringe（DI Container）
- bcryptjs（パスワードハッシュ化）
- NextAuth.js（認証）

リファクタリングにより、コードの保守性、テスタビリティ、再利用性が大幅に向上しました。
