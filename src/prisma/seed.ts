import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const database = new PrismaClient()

const seedUsers = [
  {
    id: "1",
    user_name: "yamada",
    user_email: "yamada@example.com",
    password: "password123",
    icon_number: 1,
  },
  {
    id: "2",
    user_name: "alice_dev",
    user_email: "alice@example.com",
    password: "alice123",
    icon_number: 2,
  },
  {
    id: "3",
    user_name: "bob_manager",
    user_email: "bob@example.com",
    password: "bobpass",
    icon_number: 3,
  },
  {
    id: "4",
    user_name: "carol_designer",
    user_email: "carol@example.com",
    password: "design123",
    icon_number: 4,
  },
  {
    id: "5",
    user_name: "dave_qa",
    user_email: "dave@example.com",
    password: "testing123",
    icon_number: 5,
  },
] as const

function assertDestructiveSeedIsAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed because NODE_ENV is production.")
  }

  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error(
      "This seed replaces all application data. Set ALLOW_DESTRUCTIVE_SEED=true to continue.",
    )
  }
}

async function main() {
  assertDestructiveSeedIsAllowed()

  const users = await Promise.all(
    seedUsers.map(async ({ password, ...user }) => ({
      ...user,
      password: await bcrypt.hash(password, 12),
    })),
  )

  await database.$transaction(async (prisma) => {
    console.log("Clearing existing data...")
    // Delete every model in dependency order so the reset is complete even when
    // development data includes comments, messages, sessions, tags, or logs.
    await prisma.postComment.deleteMany({})
    await prisma.todoComment.deleteMany({})
    await prisma.message.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.todo.deleteMany({})
    await prisma.post.deleteMany({})
    await prisma.postTag.deleteMany({})
    await prisma.rateLimitBucket.deleteMany({})
    await prisma.log.deleteMany({})
    await prisma.user.deleteMany({})

    console.log("Creating users...")
    await prisma.user.createMany({ data: users })

    // Create sample todos
    const now = new Date()
    const d = (days: number) => new Date(now.getTime() + days * 86_400_000)

    console.log("Creating todos...")
    // Yamada's todos
    await prisma.todo.create({
      data: {
        title: "プロジェクトドキュメント整備",
        description: "新機能の包括的なドキュメントを作成する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "1",
      },
    })
    await prisma.todo.create({
      data: {
        title: "PR #123 コードレビュー",
        description: "認証モジュールの変更内容をレビューする",
        todo_deadline: d(1),
        is_public: false,
        is_completed: true,
        id: "1",
      },
    })
    await prisma.todo.create({
      data: {
        title: "四半期レビュー用スライド作成",
        description: "経営陣向けの進捗報告スライドを仕上げる",
        todo_deadline: d(-1),
        is_public: true,
        is_completed: false,
        id: "1",
      },
    })
    await prisma.todo.create({
      data: {
        title: "API ユニットテスト実装",
        description: "認証・Todo・記事 API の単体テストを完成させる",
        todo_deadline: d(5),
        is_public: true,
        is_completed: false,
        id: "1",
      },
    })
    await prisma.todo.create({
      data: {
        title: "CI/CD パイプライン構築",
        description: "GitHub Actions を使ったデプロイ自動化を設定する",
        todo_deadline: d(14),
        is_public: false,
        is_completed: false,
        id: "1",
      },
    })
    await prisma.todo.create({
      data: {
        title: "セキュリティ監査レポート確認",
        description: "OWASP 準拠のセキュリティ問題を洗い出し対応する",
        todo_deadline: d(2),
        is_public: true,
        is_completed: false,
        id: "1",
      },
    })

    // Alice's todos
    await prisma.todo.create({
      data: {
        title: "OAuth2 認証実装",
        description: "Google・GitHub のソーシャルログインを追加する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "2",
      },
    })
    await prisma.todo.create({
      data: {
        title: "DBマイグレーション修正",
        description: "マイグレーションファイルのコンフリクトを解消する",
        todo_deadline: d(1),
        is_public: true,
        is_completed: true,
        id: "2",
      },
    })
    await prisma.todo.create({
      data: {
        title: "Next.js App Router 学習",
        description: "サーバーコンポーネント・Streaming を調査する",
        todo_deadline: d(30),
        is_public: false,
        is_completed: false,
        id: "2",
      },
    })
    await prisma.todo.create({
      data: {
        title: "API レイヤーリファクタリング",
        description: "Service 層と Repository 層を明確に分離する",
        todo_deadline: d(7),
        is_public: false,
        is_completed: false,
        id: "2",
      },
    })
    await prisma.todo.create({
      data: {
        title: "結合テスト実装",
        description: "API エンドポイントの結合テストを追加する",
        todo_deadline: d(2),
        is_public: true,
        is_completed: false,
        id: "2",
      },
    })
    await prisma.todo.create({
      data: {
        title: "REST API ドキュメント作成",
        description: "OpenAPI Spec を使って API 仕様書を整備する",
        todo_deadline: d(21),
        is_public: true,
        is_completed: false,
        id: "2",
      },
    })

    // Bob's todos
    await prisma.todo.create({
      data: {
        title: "チームパフォーマンスレビュー",
        description: "メンバー全員の四半期評価を実施する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "3",
      },
    })
    await prisma.todo.create({
      data: {
        title: "Q4 予算計画策定",
        description: "次四半期のコスト配分と ROI 目標を設定する",
        todo_deadline: d(30),
        is_public: false,
        is_completed: false,
        id: "3",
      },
    })
    await prisma.todo.create({
      data: {
        title: "スプリント振り返り準備",
        description: "スプリントの改善点をまとめてアジェンダを作る",
        todo_deadline: d(2),
        is_public: true,
        is_completed: false,
        id: "3",
      },
    })
    await prisma.todo.create({
      data: {
        title: "ステークホルダー向け報告書",
        description: "経営陣・投資家向けに進捗をまとめた報告書を作成する",
        todo_deadline: d(10),
        is_public: false,
        is_completed: false,
        id: "3",
      },
    })
    await prisma.todo.create({
      data: {
        title: "チームビルディング企画",
        description: "オフサイトイベントとアクティビティを手配する",
        todo_deadline: d(21),
        is_public: true,
        is_completed: false,
        id: "3",
      },
    })
    await prisma.todo.create({
      data: {
        title: "OKR レビューミーティング",
        description: "今期の OKR 達成率を確認し次期目標を設定する",
        todo_deadline: d(-1),
        is_public: true,
        is_completed: true,
        id: "3",
      },
    })

    // Carol's todos
    await prisma.todo.create({
      data: {
        title: "デザインシステム文書化",
        description: "コンポーネントガイドラインと使用例を整備する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "4",
      },
    })
    await prisma.todo.create({
      data: {
        title: "モバイルアプリワイヤーフレーム",
        description: "iOS・Android 双方のワイヤーフレームを作成する",
        todo_deadline: d(1),
        is_public: true,
        is_completed: true,
        id: "4",
      },
    })
    await prisma.todo.create({
      data: {
        title: "ユーザーインタビュー分析",
        description: "最近のインタビュー結果をまとめてアフィニティマップを作る",
        todo_deadline: d(14),
        is_public: false,
        is_completed: false,
        id: "4",
      },
    })
    await prisma.todo.create({
      data: {
        title: "アクセシビリティ監査",
        description: "WCAG 2.1 AA 基準でのアクセシビリティ問題を修正する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "4",
      },
    })
    await prisma.todo.create({
      data: {
        title: "アイコンセット再設計",
        description: "ブランドガイドラインに合わせてアイコンを統一する",
        todo_deadline: d(21),
        is_public: false,
        is_completed: false,
        id: "4",
      },
    })
    await prisma.todo.create({
      data: {
        title: "ブランドガイドライン改訂",
        description: "カラー・タイポグラフィ・ボイスを最新化する",
        todo_deadline: d(28),
        is_public: true,
        is_completed: false,
        id: "4",
      },
    })

    // Dave's todos
    await prisma.todo.create({
      data: {
        title: "E2E テスト自動化パイプライン",
        description: "Playwright を使ったエンドツーエンドテストを構築する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "5",
      },
    })
    await prisma.todo.create({
      data: {
        title: "パフォーマンステストレポート",
        description: "負荷テスト結果と改善提案をまとめる",
        todo_deadline: d(2),
        is_public: true,
        is_completed: true,
        id: "5",
      },
    })
    await prisma.todo.create({
      data: {
        title: "バグトリアージ準備",
        description: "優先度付きのバグリストとトリアージ議題を作成する",
        todo_deadline: d(-1),
        is_public: false,
        is_completed: false,
        id: "5",
      },
    })
    await prisma.todo.create({
      data: {
        title: "負荷テスト環境構築",
        description: "k6 を使ったスケーラビリティテストを準備する",
        todo_deadline: d(7),
        is_public: true,
        is_completed: false,
        id: "5",
      },
    })
    await prisma.todo.create({
      data: {
        title: "セキュリティ脆弱性スキャン",
        description: "OWASP ZAP を使った脆弱性スキャンを実行・分析する",
        todo_deadline: d(3),
        is_public: false,
        is_completed: false,
        id: "5",
      },
    })
    await prisma.todo.create({
      data: {
        title: "テストカバレッジレポート",
        description: "単体・結合・E2E のカバレッジ目標 80% を達成する",
        todo_deadline: d(14),
        is_public: true,
        is_completed: false,
        id: "5",
      },
    })

    console.log("Creating articles...")
    // Create sample articles
    await prisma.post.create({
      data: {
        title: "Next.js App Router 入門",
        content:
          "# Next.js App Router 入門\n\nApp Router はサーバーコンポーネントをデフォルトで活用でき、Streaming や Suspense も標準サポートされています。",
        author_id: "1",
      },
    })
    await prisma.post.create({
      data: {
        title: "デザインシステム構築ベストプラクティス",
        content:
          "# デザインシステム構築ベストプラクティス\n\nカラートークン・タイポグラフィスケール・スペーシングシステムを整備し、Storybook と Figma の連携が鉄板です。",
        author_id: "4",
      },
    })
    await prisma.post.create({
      data: {
        title: "TypeScript 実践パターン集",
        content:
          "# TypeScript 実践パターン集\n\nDiscriminated Union や satisfies 演算子を活用して型安全なコードを書きましょう。",
        author_id: "2",
      },
    })
    await prisma.post.create({
      data: {
        title: "Prisma で学ぶデータベース最適化",
        content:
          "# Prisma で学ぶデータベース最適化\n\nN+1 問題を防ぐには include より select を活用し、複雑な集計クエリは $queryRaw を使いましょう。",
        author_id: "1",
      },
    })
    await prisma.post.create({
      data: {
        title: "テスト駆動開発（TDD）実践ガイド",
        content:
          "# テスト駆動開発（TDD）実践ガイド\n\nRed → Green → Refactor のサイクルで品質を高め、Jest + Testing Library でカバレッジ 80% を目指しましょう。",
        author_id: "5",
      },
    })
    await prisma.post.create({
      data: {
        title: "アジャイルスクラム実践ガイド",
        content:
          "# アジャイルスクラム実践ガイド\n\nスプリントプランニングではベロシティを基にポイントを割り当て、レトロスペクティブでは心理的安全性を最優先にしましょう。",
        author_id: "3",
      },
    })
    await prisma.post.create({
      data: {
        title: "React パフォーマンス最適化テクニック",
        content:
          "# React パフォーマンス最適化テクニック\n\nuseMemo・useCallback・React.memo を活用しつつ、Profiler で計測して闇雲な最適化を避けましょう。",
        author_id: "2",
      },
    })
    await prisma.post.create({
      data: {
        title: "Tailwind CSS 設計アーキテクチャ",
        content:
          "# Tailwind CSS 設計アーキテクチャ\n\n同じユーティリティが 3 箇所以上現れたら @apply でコンポーネント化を検討し、tailwind.config.ts でテーマを一元管理しましょう。",
        author_id: "4",
      },
    })
    await prisma.post.create({
      data: {
        title: "API セキュリティ実装ガイド",
        content:
          "# API セキュリティ実装ガイド\n\nOWASP Top 10 を軸に、HttpOnly Cookie・SameSite=Lax・zod によるバリデーションを組み合わせましょう。",
        author_id: "1",
      },
    })
    await prisma.post.create({
      data: {
        title: "GitHub Actions で CI/CD を構築する",
        content:
          "# GitHub Actions で CI/CD を構築する\n\nプルリクエストごとにテスト・ビルド・デプロイを自動化し、キャッシュを活用して実行時間を短縮しましょう。",
        author_id: "5",
      },
    })
    await prisma.post.create({
      data: {
        title: "UX リサーチ手法まとめ",
        content:
          "# UX リサーチ手法まとめ\n\nユーザーインタビューでは行動を観察し、A/B テストでは統計的有意差が出るまで判断しないことが重要です。",
        author_id: "4",
      },
    })
    await prisma.post.create({
      data: {
        title: "データドリブン意思決定のフレームワーク",
        content:
          "# データドリブン意思決定のフレームワーク\n\nNorth Star Metric を定義し、意思決定に直結する指標だけをダッシュボードに表示しましょう。",
        author_id: "3",
      },
    })
  })

  console.log("Seed data created successfully!")
  console.log("Users: 5, Todos: 30, Articles: 12")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await database.$disconnect()
  })
