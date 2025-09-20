テストコードの書き方とテスト実行方法についての説明にゃ！開発者がテストを書くときの参考にしてほしいにゃ〜。

## テスト環境の概要にゃ！

- **テストフレームワーク**: Jest にゃ！
- **テスト実行環境**: Docker コンテナ内 にゃ！
- **テストタイプ**: 
  - 単体テスト（Unit Tests）
  - 統合テスト（Integration Tests）
  - APIテスト

## ディレクトリ構造にゃ！

```
src/
  __tests__/             # テストコードが入るディレクトリにゃ！
    *.test.ts            # 全テストファイルは .test.ts の拡張子を持つにゃ！
    README.md            # このファイルにゃ！
  jest.config.js         # Jestの設定ファイルにゃ！
  jest.setup.js          # Jest起動時に実行される設定にゃ！
  run-tests.sh           # テスト実行スクリプトにゃ！
```

## テストの実行方法にゃ！

### Dockerを使ったテスト実行（推奨）にゃ！

```bash
# Dockerコンテナ内でテストを実行するにゃ！
docker compose exec app npm test

# 特定のテストだけ実行するにゃ！
docker compose exec app npm test -- __tests__/articles.functions.test.ts

# ウォッチモードで実行するにゃ！
docker compose exec app npm test -- --watch
```

### 直接実行（非推奨）にゃ！

```bash
npm run test
```

直接実行の場合はデータベース接続などが適切に設定されていない可能性があるから注意するにゃ！

## テストの書き方にゃ！

### 基本構造にゃ！

```typescript
// インポートにゃ！
import { ... } from '...';

// テスト対象の関数やモジュールを記述にゃ！
describe('テスト対象の名前', () => {
  // 前処理にゃ！
  beforeAll(() => {
    // テスト全体の前に1回だけ実行されるにゃ！
  });
  
  beforeEach(() => {
    // 各テストケースの前に実行されるにゃ！
  });
  
  // テストケースをグループ化することもできるにゃ！
  describe('特定の機能や条件', () => {
    test('期待する動作の説明', async () => {
      // テストコードを書くにゃ！
      const result = await someFunction();
      expect(result).toBe(expectedValue);
    });
  });
  
  // 後処理にゃ！
  afterEach(() => {
    // 各テストケースの後に実行されるにゃ！
  });
  
  afterAll(() => {
    // テスト全体の後に1回だけ実行されるにゃ！
  });
});
```

### 統合テストの例にゃ！

```typescript
import { PrismaClient } from '@prisma/client';
import * as articleService from '@/service/articleService';

// 実際のDBに接続するにゃ！
const prisma = new PrismaClient();

describe('Article Service (Integration Tests)', () => {
  // テストデータにゃ！
  const testArticle = {
    title: `Test Article ${Date.now()}`,
    content: 'This is a test article'
  };
  
  let testArticleId: string;
  
  // クリーンアップにゃ！
  afterAll(async () => {
    if (testArticleId) {
      await prisma.article.delete({
        where: { id: testArticleId }
      });
    }
    await prisma.$disconnect();
  });
  
  test('記事を作成できるにゃ！', async () => {
    const result = await articleService.createArticle(testArticle);
    
    expect(result).toBeDefined();
    expect(result.title).toBe(testArticle.title);
    
    testArticleId = result.id; // 後続テストのために保存するにゃ！
  });
  
  // 他のテストケースも同様に書くにゃ！
});
```

### モック使用例（必要な場合のみ）にゃ！

```typescript
import { myFunction } from '@/utils/myUtils';

// モック化するにゃ！
jest.mock('@/utils/myUtils', () => ({
  myFunction: jest.fn()
}));

describe('モックを使ったテスト', () => {
  test('関数が正しく呼ばれるかにゃ！', () => {
    // モックの戻り値を設定するにゃ！
    (myFunction as jest.Mock).mockReturnValue('mocked value');
    
    // テスト対象のコードを実行するにゃ！
    const result = someOtherFunction();
    
    // 検証するにゃ！
    expect(myFunction).toHaveBeenCalled();
    expect(myFunction).toHaveBeenCalledWith(expectedArgs);
    expect(result).toBe('expected result');
  });
});
```

## テスト作法とベストプラクティスにゃ！

1. **実際のDBを使ったテストを優先するにゃ！** 
   - モックはテスト対象の実際の挙動を検証できないので、可能な限り実際のデータベースを使うにゃ！
   - Docker環境で統合テストを行うのがベストプラクティスにゃ！

2. **テストケース名は明確に書くにゃ！**
   - 「〜できること」「〜の場合は〜となること」のような明確な説明を書くにゃ！

3. **テストは独立して実行できるようにするにゃ！**
   - テスト間で依存関係がないように気をつけるにゃ！
   - テストデータは各テストで作成・削除するにゃ！

4. **時刻に依存するテストには注意するにゃ！**
   - 日付や時刻に依存するテストは、固定の時刻を使うかモック化するにゃ！

5. **テストデータはユニークにするにゃ！**
   - テストデータの衝突を避けるため、タイムスタンプなどを使ってユニークにするにゃ！
   ```typescript
   const uniqueName = `test-${Date.now()}`;
   ```

6. **afterAll でクリーンアップするにゃ！**
   - テスト中に作成したデータは、afterAll ブロックで必ず削除するにゃ！
   - データベース接続も適切に閉じるにゃ！

7. **非同期処理は適切に扱うにゃ！**
   - 非同期関数のテストでは async/await を使うにゃ！
   - Promise の解決を待つことを忘れないにゃ！

## 期待値の検証（アサーション）にゃ！

Jest では expect 関数を使って検証するにゃ！よく使うマッチャーの例にゃ：

```typescript
// 等価性にゃ！
expect(value).toBe(expectedValue);          // === による比較にゃ！
expect(value).toEqual(expectedValue);       // 深い比較にゃ！
expect(value).toStrictEqual(expectedValue); // より厳密な深い比較にゃ！

// 真偽値にゃ！
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// 数値にゃ！
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);

// 配列・オブジェクトにゃ！
expect(array).toContain('item');
expect(object).toHaveProperty('propertyName');

// 例外にゃ！
expect(() => dangerousFunction()).toThrow();
expect(() => dangerousFunction()).toThrow('特定のエラーメッセージ');
```

## トラブルシューティングにゃ！

### よくある問題と解決策にゃ！

1. **テストがタイムアウトする場合にゃ！**
   ```typescript
   // タイムアウト時間を延長するにゃ（ミリ秒単位）
   jest.setTimeout(30000); // 30秒にゃ！
   ```

2. **非同期処理が完了しない場合にゃ！**
   - async/await を使用しているか確認するにゃ！
   - Promise の解決を適切に待っているか確認するにゃ！

3. **環境変数が設定されていない場合にゃ！**
   - Docker環境で実行しているか確認するにゃ！
   - .env.test ファイルが正しく設定されているか確認するにゃ！

4. **テストDBの接続問題にゃ！**
   - Dockerコンテナが起動しているか確認するにゃ！
   - データベース接続設定が正しいか確認するにゃ！