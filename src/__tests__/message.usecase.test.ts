/**
 * メッセージユースケースのユニットテスト
 *
 * テスト対象:
 * - MessageEntity（ドメイン層ビジネスルール）
 * - SendMessageUseCase
 * - GetInboxMessagesUseCase
 * - GetSentMessagesUseCase
 * - MarkMessageAsReadUseCase
 * - DeleteMessageUseCase
 */

import { SendMessageUseCase } from '@/application/message/SendMessageUseCase';
import { GetInboxMessagesUseCase } from '@/application/message/GetInboxMessagesUseCase';
import { GetSentMessagesUseCase } from '@/application/message/GetSentMessagesUseCase';
import { MarkMessageAsReadUseCase } from '@/application/message/MarkMessageAsReadUseCase';
import { DeleteMessageUseCase } from '@/application/message/DeleteMessageUseCase';
import { IMessageRepository } from '@/domain/message/MessageRepository';
import { MessageEntity, MessageWithUsers } from '@/domain/message/Message';
import { AppError, ErrorType } from '@/utils/errorHandler';

// モックリポジトリの作成
const createMockRepository = (): jest.Mocked<IMessageRepository> => ({
  create: jest.fn(),
  findByReceiverId: jest.fn(),
  findBySenderId: jest.fn(),
  findById: jest.fn(),
  markAsRead: jest.fn(),
  delete: jest.fn(),
});

/** テスト用メッセージデータのファクトリ */
const createMockMessage = (overrides: Partial<MessageWithUsers> = {}): MessageWithUsers => ({
  message_id: 1,
  subject: 'テスト件名',
  body: 'テスト本文',
  sender_id: 'user1',
  receiver_id: 'user2',
  is_read: false,
  createdAt: new Date('2024-01-01'),
  sender: { id: 'user1', user_name: '送信者' },
  receiver: { id: 'user2', user_name: '受信者' },
  ...overrides,
});

// --------------------------------------------------
// MessageEntity（Domain層 - 純粋ビジネスルール）
// --------------------------------------------------
describe('MessageEntity', () => {
  describe('canMarkAsRead', () => {
    it('受信者は既読にできる', () => {
      expect(MessageEntity.canMarkAsRead({ receiver_id: 'user2' }, 'user2')).toBe(true);
    });

    it('送信者は既読にできない', () => {
      expect(MessageEntity.canMarkAsRead({ receiver_id: 'user2' }, 'user1')).toBe(false);
    });

    it('無関係なユーザーは既読にできない', () => {
      expect(MessageEntity.canMarkAsRead({ receiver_id: 'user2' }, 'user3')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('送信者は削除できる', () => {
      expect(MessageEntity.canDelete({ sender_id: 'user1', receiver_id: 'user2' }, 'user1')).toBe(true);
    });

    it('受信者は削除できる', () => {
      expect(MessageEntity.canDelete({ sender_id: 'user1', receiver_id: 'user2' }, 'user2')).toBe(true);
    });

    it('無関係なユーザーは削除できない', () => {
      expect(MessageEntity.canDelete({ sender_id: 'user1', receiver_id: 'user2' }, 'user3')).toBe(false);
    });
  });
});

// --------------------------------------------------
// SendMessageUseCase
// --------------------------------------------------
describe('SendMessageUseCase', () => {
  let mockRepo: jest.Mocked<IMessageRepository>;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new SendMessageUseCase(mockRepo);
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効なデータでメッセージを送信できる', async () => {
      const input = {
        subject: 'テスト件名',
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: 'user2',
      };
      const mockMessage = createMockMessage();
      mockRepo.create.mockResolvedValue(mockMessage);

      const result = await useCase.execute(input);

      expect(result).toEqual(mockMessage);
      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });
  });

  describe('異常系 - バリデーション', () => {
    it('件名が空の場合はAppErrorをスローする', async () => {
      const input = {
        subject: '',
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: 'user2',
      };

      await expect(useCase.execute(input)).rejects.toThrow(AppError);
      await expect(useCase.execute(input)).rejects.toMatchObject({
        type: ErrorType.VALIDATION,
        statusCode: 400,
      });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('本文が空の場合はAppErrorをスローする', async () => {
      const input = {
        subject: 'テスト件名',
        body: '',
        sender_id: 'user1',
        receiver_id: 'user2',
      };

      await expect(useCase.execute(input)).rejects.toThrow(AppError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('自分自身に送信しようとした場合はAppErrorをスローする', async () => {
      const input = {
        subject: 'テスト件名',
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: 'user1',
      };

      await expect(useCase.execute(input)).rejects.toThrow(AppError);
      await expect(useCase.execute(input)).rejects.toMatchObject({
        type: ErrorType.VALIDATION,
        statusCode: 400,
      });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('受信者IDが空の場合はAppErrorをスローする', async () => {
      const input = {
        subject: 'テスト件名',
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: '',
      };

      await expect(useCase.execute(input)).rejects.toThrow(AppError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('件名が最大文字数を超えた場合はAppErrorをスローする', async () => {
      const input = {
        subject: 'a'.repeat(201),
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: 'user2',
      };

      await expect(useCase.execute(input)).rejects.toThrow(AppError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('異常系 - データベースエラー', () => {
    it('リポジトリがエラーをスローした場合はAppErrorに変換される', async () => {
      const input = {
        subject: 'テスト件名',
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: 'user2',
      };
      mockRepo.create.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(input)).rejects.toThrow(AppError);
      await expect(useCase.execute(input)).rejects.toMatchObject({
        type: ErrorType.DATABASE_ERROR,
        statusCode: 500,
      });
    });

    it('AppErrorはそのまま再スローされる', async () => {
      const input = {
        subject: 'テスト件名',
        body: 'テスト本文',
        sender_id: 'user1',
        receiver_id: 'user2',
      };
      const appError = new AppError('Not Found', ErrorType.NOT_FOUND, 404);
      mockRepo.create.mockRejectedValue(appError);

      await expect(useCase.execute(input)).rejects.toBe(appError);
    });
  });
});

// --------------------------------------------------
// GetInboxMessagesUseCase
// --------------------------------------------------
describe('GetInboxMessagesUseCase', () => {
  let mockRepo: jest.Mocked<IMessageRepository>;
  let useCase: GetInboxMessagesUseCase;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new GetInboxMessagesUseCase(mockRepo);
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('受信メッセージ一覧を取得できる', async () => {
      const messages = [createMockMessage(), createMockMessage({ message_id: 2 })];
      mockRepo.findByReceiverId.mockResolvedValue(messages);

      const result = await useCase.execute('user2');

      expect(result).toEqual(messages);
      expect(mockRepo.findByReceiverId).toHaveBeenCalledWith('user2');
    });

    it('メッセージがない場合は空配列を返す', async () => {
      mockRepo.findByReceiverId.mockResolvedValue([]);

      const result = await useCase.execute('user2');

      expect(result).toEqual([]);
    });
  });

  describe('異常系', () => {
    it('ユーザーIDが空の場合はAppErrorをスローする', async () => {
      await expect(useCase.execute('')).rejects.toThrow(AppError);
      await expect(useCase.execute('')).rejects.toMatchObject({
        type: ErrorType.VALIDATION,
        statusCode: 400,
      });
    });

    it('リポジトリエラーはAppErrorに変換される', async () => {
      mockRepo.findByReceiverId.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute('user2')).rejects.toThrow(AppError);
      await expect(useCase.execute('user2')).rejects.toMatchObject({
        type: ErrorType.DATABASE_ERROR,
      });
    });
  });
});

// --------------------------------------------------
// GetSentMessagesUseCase
// --------------------------------------------------
describe('GetSentMessagesUseCase', () => {
  let mockRepo: jest.Mocked<IMessageRepository>;
  let useCase: GetSentMessagesUseCase;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new GetSentMessagesUseCase(mockRepo);
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('送信メッセージ一覧を取得できる', async () => {
      const messages = [createMockMessage()];
      mockRepo.findBySenderId.mockResolvedValue(messages);

      const result = await useCase.execute('user1');

      expect(result).toEqual(messages);
      expect(mockRepo.findBySenderId).toHaveBeenCalledWith('user1');
    });
  });

  describe('異常系', () => {
    it('ユーザーIDが空の場合はAppErrorをスローする', async () => {
      await expect(useCase.execute('')).rejects.toThrow(AppError);
      await expect(useCase.execute('')).rejects.toMatchObject({
        type: ErrorType.VALIDATION,
        statusCode: 400,
      });
    });
  });
});

// --------------------------------------------------
// MarkMessageAsReadUseCase
// --------------------------------------------------
describe('MarkMessageAsReadUseCase', () => {
  let mockRepo: jest.Mocked<IMessageRepository>;
  let useCase: MarkMessageAsReadUseCase;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new MarkMessageAsReadUseCase(mockRepo);
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('受信者がメッセージを既読にできる', async () => {
      const message = createMockMessage();
      const updatedMessage = { ...message, is_read: true };
      mockRepo.findById.mockResolvedValue(message);
      mockRepo.markAsRead.mockResolvedValue(updatedMessage);

      const result = await useCase.execute(1, 'user2');

      expect(result).toEqual(updatedMessage);
      expect(mockRepo.markAsRead).toHaveBeenCalledWith(1, 'user2');
    });

    it('Domain層のcanMarkAsReadに権限チェックを委譲する（送信者は拒否）', async () => {
      // このテストはApplication層がDomain層に権限チェックを委譲することを保証する
      const message = createMockMessage({ receiver_id: 'user2' });
      mockRepo.findById.mockResolvedValue(message);

      // user1（送信者）が既読操作しようとした場合 → Domain層が false を返す
      await expect(useCase.execute(1, 'user1')).rejects.toMatchObject({
        type: ErrorType.AUTHORIZATION,
        statusCode: 403,
      });
      // 権限チェック失敗時はmarkAsReadを呼ばない
      expect(mockRepo.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('異常系', () => {
    it('メッセージが存在しない場合はNOT_FOUNDエラーをスローする', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(999, 'user2')).rejects.toThrow(AppError);
      await expect(useCase.execute(999, 'user2')).rejects.toMatchObject({
        type: ErrorType.NOT_FOUND,
        statusCode: 404,
      });
    });

    it('受信者以外が既読にしようとするとAUTHORIZATIONエラーをスローする', async () => {
      const message = createMockMessage({ receiver_id: 'user2' });
      mockRepo.findById.mockResolvedValue(message);

      // user1（送信者）が既読操作しようとした場合
      await expect(useCase.execute(1, 'user1')).rejects.toThrow(AppError);
      await expect(useCase.execute(1, 'user1')).rejects.toMatchObject({
        type: ErrorType.AUTHORIZATION,
        statusCode: 403,
      });
    });
  });
});

// --------------------------------------------------
// DeleteMessageUseCase
// --------------------------------------------------
describe('DeleteMessageUseCase', () => {
  let mockRepo: jest.Mocked<IMessageRepository>;
  let useCase: DeleteMessageUseCase;

  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new DeleteMessageUseCase(mockRepo);
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('送信者がメッセージを削除できる', async () => {
      const message = createMockMessage();
      mockRepo.findById.mockResolvedValue(message);
      mockRepo.delete.mockResolvedValue(undefined);

      await expect(useCase.execute(1, 'user1')).resolves.toBeUndefined();
      expect(mockRepo.delete).toHaveBeenCalledWith(1, 'user1');
    });

    it('受信者がメッセージを削除できる', async () => {
      const message = createMockMessage();
      mockRepo.findById.mockResolvedValue(message);
      mockRepo.delete.mockResolvedValue(undefined);

      await expect(useCase.execute(1, 'user2')).resolves.toBeUndefined();
    });

    it('Domain層のcanDeleteに権限チェックを委譲する（無関係者は拒否）', async () => {
      // このテストはApplication層がDomain層に権限チェックを委譲することを保証する
      const message = createMockMessage({ sender_id: 'user1', receiver_id: 'user2' });
      mockRepo.findById.mockResolvedValue(message);

      // user3（無関係者）が削除しようとした場合 → Domain層が false を返す
      await expect(useCase.execute(1, 'user3')).rejects.toMatchObject({
        type: ErrorType.AUTHORIZATION,
        statusCode: 403,
      });
      // 権限チェック失敗時はdeleteを呼ばない
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('異常系', () => {
    it('メッセージが存在しない場合はNOT_FOUNDエラーをスローする', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(999, 'user1')).rejects.toThrow(AppError);
      await expect(useCase.execute(999, 'user1')).rejects.toMatchObject({
        type: ErrorType.NOT_FOUND,
        statusCode: 404,
      });
    });

    it('送受信者以外が削除しようとするとAUTHORIZATIONエラーをスローする', async () => {
      const message = createMockMessage({ sender_id: 'user1', receiver_id: 'user2' });
      mockRepo.findById.mockResolvedValue(message);

      // user3（関係者でない）が削除しようとした場合
      await expect(useCase.execute(1, 'user3')).rejects.toThrow(AppError);
      await expect(useCase.execute(1, 'user3')).rejects.toMatchObject({
        type: ErrorType.AUTHORIZATION,
        statusCode: 403,
      });
    });

    it('リポジトリのdeleteがエラーをスローした場合はAppErrorに変換される', async () => {
      const message = createMockMessage();
      mockRepo.findById.mockResolvedValue(message);
      mockRepo.delete.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(1, 'user1')).rejects.toThrow(AppError);
      await expect(useCase.execute(1, 'user1')).rejects.toMatchObject({
        type: ErrorType.DATABASE_ERROR,
      });
    });
  });
});
