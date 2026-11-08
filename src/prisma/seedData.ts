// 生成シードデータ（Issue #253）
// 負荷テストや人気記事集計の開発で使えるよう、決定的な疑似乱数で
// 大量の Todo / 記事 / いいねを生成する。乱数の種が固定なので、
// 同じ now を渡せば毎回同じ内容・件数・分布になる（日時は now からの
// 相対オフセットで決まるため、実行日に依存しない分布になる）

export const GENERATED_TODO_COUNT = 270
export const GENERATED_POST_COUNT = 288

const SEED_USER_IDS = ["1", "2", "3", "4", "5"] as const

// 著者・担当者の偏り（先頭のユーザーほどアクティブ）
const USER_WEIGHTS = [3, 3, 2, 2, 2]

export const SEED_TAG_NAMES = [
  "フロントエンド",
  "バックエンド",
  "TypeScript",
  "Next.js",
  "React",
  "DB",
  "テスト",
  "CI/CD",
  "DevOps",
  "セキュリティ",
  "パフォーマンス",
  "デザイン",
  "UX",
  "マネジメント",
  "アーキテクチャ",
] as const

/** mulberry32: 種固定の決定的な疑似乱数 */
function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = ReturnType<typeof createRandom>

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

function intBetween(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

function pickWeightedUser(random: Random): string {
  const total = USER_WEIGHTS.reduce((sum, weight) => sum + weight, 0)
  let roll = random() * total
  for (let i = 0; i < SEED_USER_IDS.length; i++) {
    roll -= USER_WEIGHTS[i]
    if (roll < 0) {
      return SEED_USER_IDS[i]
    }
  }
  return SEED_USER_IDS[SEED_USER_IDS.length - 1]
}

function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

const DAY_MS = 86_400_000

export interface GeneratedTodo {
  title: string
  description: string
  todo_deadline: Date
  createdAt: Date
  is_public: boolean
  is_completed: boolean
  id: string
}

const TODO_TARGETS = [
  "認証API",
  "記事一覧画面",
  "Todoコメント機能",
  "検索機能",
  "通知メール",
  "プロフィール画面",
  "画像アップロード",
  "権限管理",
  "ダッシュボード",
  "レポート出力",
  "設定画面",
  "オンボーディング",
  "多言語対応",
  "ダークモード",
  "監査ログ",
  "バックアップ",
  "課金プラン",
  "招待機能",
  "いいね機能",
  "人気記事集計",
  "メールテンプレート",
  "ファイル共有",
  "カレンダー連携",
  "コメント機能",
  "タグ機能",
  "下書き保存",
  "パスワードリセット",
  "二要素認証",
  "利用規約ページ",
  "ヘルプページ",
  "お問い合わせフォーム",
  "分析ダッシュボード",
] as const

const TODO_ACTIONS = [
  "の実装",
  "のバグ修正",
  "の調査",
  "のコードレビュー",
  "の仕様作成",
  "の文言更新",
  "のテスト追加",
  "の設計見直し",
  "の動作確認",
  "の移行作業",
  "の最適化",
  "のドキュメント化",
] as const

const TODO_DETAILS = [
  "関係する画面とAPIの両方を確認する",
  "まずは現状の挙動を再現するところから始める",
  "レビューで指摘された観点も合わせて対応する",
  "テストケースを追加してから着手する",
  "影響範囲を洗い出してから進める",
  "完了条件をチームで認識合わせしておく",
  "ついでに古い実装の掃除もしておく",
  "終わったら動作確認の結果を共有する",
] as const

export function buildGeneratedTodos(now: Date): GeneratedTodo[] {
  const random = createRandom(20261108)

  // ターゲット×アクションの全組み合わせから決定的に選ぶことで、
  // タイトルの重複が起きないことを保証する（組み合わせ総数 > 生成件数）
  const titles = shuffled(
    random,
    TODO_TARGETS.flatMap((target) => TODO_ACTIONS.map((action) => `${target}${action}`)),
  ).slice(0, GENERATED_TODO_COUNT)

  return titles.map((title) => ({
    title,
    description: `${title}。${pick(random, TODO_DETAILS)}`,
    todo_deadline: new Date(now.getTime() + intBetween(random, -14, 45) * DAY_MS),
    createdAt: new Date(now.getTime() - intBetween(random, 1, 60) * DAY_MS),
    is_public: random() < 0.6,
    is_completed: random() < 0.35,
    id: pickWeightedUser(random),
  }))
}

export interface GeneratedPostLike {
  user_id: string
  createdAt: Date
}

export interface GeneratedPost {
  title: string
  content: string
  author_id: string
  createdAt: Date
  tags: string[]
  likes: GeneratedPostLike[]
}

const POST_SUBJECTS = [
  "Next.js",
  "React",
  "TypeScript",
  "Prisma",
  "PostgreSQL",
  "Docker",
  "GitHub Actions",
  "Jest",
  "Playwright",
  "API設計",
  "認証・認可",
  "セキュリティ",
  "パフォーマンス計測",
  "アクセシビリティ",
  "UIデザイン",
  "UXリサーチ",
  "スクラム",
  "コードレビュー",
  "リファクタリング",
  "テスト駆動開発",
  "CI/CD",
  "監視・ロギング",
  "キャッシュ",
  "WebSocket",
  "GraphQL",
  "状態管理",
  "フォーム設計",
  "エラーハンドリング",
] as const

const POST_TITLE_PATTERNS: ReadonlyArray<(subject: string) => string> = [
  (s) => `${s} 入門`,
  (s) => `${s} 実践ガイド`,
  (s) => `${s} のベストプラクティス`,
  (s) => `${s} でハマったポイントと対策`,
  (s) => `${s} を使った開発フロー`,
  (s) => `${s} の設計パターン`,
  (s) => `${s} パフォーマンスチューニング`,
  (s) => `${s} のよくある失敗と回避策`,
  (s) => `${s} チートシート`,
  (s) => `${s} をチームに導入した話`,
  (s) => `${s} の基本と応用`,
  (s) => `${s} トラブルシューティング`,
]

// subject ごとの代表タグ（ないものは生成時にタグプールから選ぶ）
const SUBJECT_TAGS: Readonly<Record<string, string>> = {
  "Next.js": "Next.js",
  React: "React",
  TypeScript: "TypeScript",
  Prisma: "DB",
  PostgreSQL: "DB",
  Docker: "DevOps",
  "GitHub Actions": "CI/CD",
  Jest: "テスト",
  Playwright: "テスト",
  API設計: "バックエンド",
  "認証・認可": "セキュリティ",
  セキュリティ: "セキュリティ",
  パフォーマンス計測: "パフォーマンス",
  アクセシビリティ: "UX",
  UIデザイン: "デザイン",
  UXリサーチ: "UX",
  スクラム: "マネジメント",
  コードレビュー: "マネジメント",
  リファクタリング: "アーキテクチャ",
  テスト駆動開発: "テスト",
  "CI/CD": "CI/CD",
  "監視・ロギング": "DevOps",
  キャッシュ: "パフォーマンス",
  WebSocket: "バックエンド",
  GraphQL: "バックエンド",
  状態管理: "フロントエンド",
  フォーム設計: "フロントエンド",
  エラーハンドリング: "アーキテクチャ",
}

const POST_INTROS = [
  "開発中に何度も調べ直したので、まとめておきます",
  "チームで導入する際に決めたルールのメモです",
  "ハマりどころが多かったので、再発防止として残します",
  "後から見返す前提で、要点だけコンパクトに書きます",
  "新規参画者向けのオンボーディング資料も兼ねています",
  "実際に運用してみて分かったことを中心に書きます",
] as const

const POST_POINTS = [
  "まずは公式ドキュメントの推奨構成に寄せる",
  "計測せずに最適化しない",
  "境界（入力バリデーション）を厳密にする",
  "失敗時の挙動を先に決めておく",
  "テストで守る範囲と守らない範囲を分ける",
  "レビューで見てほしい観点をPRに書く",
  "小さく分けてこまめにリリースする",
  "既存実装との一貫性を優先する",
  "ログと監視を最初から入れておく",
  "将来の変更箇所を局所化する",
] as const

const POST_BODIES = [
  "最初は素直な実装で動かし、ボトルネックが見えてから手を入れました。結果として、複雑な抽象化を入れずに済んだのが良かったです",
  "設計の段階で責務を分けておくと、後からの仕様変更にもだいぶ耐えられます。逆に、ここを曖昧にすると修正コストが跳ね上がります",
  "運用を始めてから気づいたのですが、想定していなかった使われ方をするケースが必ず出てきます。ログを残しておいたおかげで原因追跡が楽でした",
  "パフォーマンスは体感ではなく数値で判断するようにしました。変更前後で計測値を比較すると、議論が前に進みます",
  "チーム開発では、個人の好みよりも読み合わせたルールの一貫性が効きます。リンターとフォーマッターで機械的に揃えるのが一番平和です",
  "エラーケースを先に洗い出しておくと、実装がだいぶスムーズになります。正常系だけ作って後から足すと、だいたい設計が崩れます",
] as const

const POST_CLOSINGS = [
  "まずはこの方針で運用して、困ったら見直します",
  "同じところで詰まっている人の参考になれば",
  "細かいところはコード側のコメントにも残してあります",
  "次は実測値をもう少し溜めてから続編を書く予定です",
  "指摘があればコメントで教えてください",
] as const

function buildPostContent(random: Random, title: string, subject: string): string {
  const points = shuffled(random, POST_POINTS).slice(0, 3)
  const paragraphs = shuffled(random, POST_BODIES).slice(0, intBetween(random, 2, 3))
  return [
    `# ${title}`,
    "",
    `${subject}について。${pick(random, POST_INTROS)}`,
    "",
    "## ポイント",
    ...points.map((point) => `- ${point}`),
    "",
    ...paragraphs.flatMap((paragraph) => [paragraph, ""]),
    "## まとめ",
    pick(random, POST_CLOSINGS),
  ].join("\n")
}

function buildLikes(
  random: Random,
  authorId: string,
  createdAt: Date,
  now: Date,
): GeneratedPostLike[] {
  // 人気記事集計が意味を持つよう、いいね数は0に寄せつつ一部へ集中させる
  // 著者本人は除くので上限はユーザー数-1（4）
  const roll = random()
  const likeCount = roll < 0.45 ? 0 : roll < 0.7 ? 1 : roll < 0.85 ? 2 : roll < 0.93 ? 3 : 4
  if (likeCount === 0) {
    return []
  }

  const likers = shuffled(
    random,
    SEED_USER_IDS.filter((userId) => userId !== authorId),
  ).slice(0, likeCount)

  const ageMs = Math.max(now.getTime() - createdAt.getTime(), 1)
  return likers.map((userId) => ({
    user_id: userId,
    createdAt: new Date(createdAt.getTime() + Math.floor(random() * ageMs)),
  }))
}

export function buildGeneratedPosts(now: Date): GeneratedPost[] {
  const random = createRandom(20260253)
  const posts: GeneratedPost[] = []

  for (let i = 0; i < GENERATED_POST_COUNT; i++) {
    const subject = POST_SUBJECTS[i % POST_SUBJECTS.length]
    const pattern =
      POST_TITLE_PATTERNS[Math.floor(i / POST_SUBJECTS.length) % POST_TITLE_PATTERNS.length]
    const title = pattern(subject)
    const author_id = pickWeightedUser(random)
    const createdAt = new Date(
      now.getTime() - intBetween(random, 0, 364) * DAY_MS - intBetween(random, 0, 23) * 3_600_000,
    )

    const primaryTag = SUBJECT_TAGS[subject] ?? pick(random, SEED_TAG_NAMES)
    const extraTags = shuffled(
      random,
      SEED_TAG_NAMES.filter((tag) => tag !== primaryTag),
    ).slice(0, intBetween(random, 0, 2))

    posts.push({
      title,
      content: buildPostContent(random, title, subject),
      author_id,
      createdAt,
      tags: [primaryTag, ...extraTags],
      likes: buildLikes(random, author_id, createdAt, now),
    })
  }

  return posts
}
