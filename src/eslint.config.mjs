import nextConfig from "eslint-config-next/core-web-vitals"
import prettierConfig from "eslint-config-prettier"

/** @type {import("eslint").Linter.Config[]} */
const config = [
    // 解析対象外ディレクトリ
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "dist/**",
            "build/**",
            "prisma/migrations/**",
            "coverage/**",
            "public/**",
        ],
    },

    // Next.js core-web-vitals（TypeScript ルールも内包）
    ...nextConfig,

    // Prettier と競合する ESLint ルールを無効化
    { rules: prettierConfig.rules },

    // 全ファイルへの共通ルール
    {
        rules: {
            // React 17+ は JSX transform があるため不要
            "react/react-in-jsx-scope": "off",
            // <img> 要素の Next.js Image 強制を無効化
            "@next/next/no-img-element": "off",
            // console.log は警告、warn/error は許可
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },

    // TypeScript ファイル固有ルール
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            // 未使用変数: _ prefix は許可
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            // any 型は警告のみ（段階的移行を考慮）
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
]

export default config
