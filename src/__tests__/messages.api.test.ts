/**
 * メッセージAPIルートのテスト
 *
 * テスト対象:
 * - GET  /api/messages       (受信トレイ取得)
 * - POST /api/messages       (メッセージ送信)
 * - GET  /api/messages/sent  (送信トレイ取得)
 * - DELETE /api/messages/[id] (メッセージ削除)
 * - PATCH /api/messages/[id]/read (既読化)
 */

import { NextRequest } from 'next/server';
import { ErrorType } from '@/utils/errorHandler';

// PrismaClientモック
jest.mock('@prisma/client', () => {
  const mockMessage = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      message: mockMessage,
    })),
    __mockMessage: mockMessage,
  };
});

// ロガーモック
jest.mock('@/logging/logging', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// 認証モック
jest.mock('@/lib/auth', () => ({
  getUserIdFromRequest: jest.fn(),
}));

import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth';
import { GET as getInbox, POST as postMessage } from '@/app/api/messages/route';
import { GET as getSent } from '@/app/api/messages/sent/route';
import { DELETE as deleteMessage } from '@/app/api/messages/[message_id]/route';
import { PATCH as patchRead } from '@/app/api/messages/[message_id]/read/route';

const mockGetUserId = getUserIdFromRequest as jest.MockedFunction<typeof getUserIdFromRequest>;
const mockPrismaMessage = (require('@prisma/client') as any).__mockMessage;

/** テスト用メッセージデータ */
const mockMessageData = {
  message_id: 1,
  subject: 'テスト件名',
  body: 'テスト本文',
  sender_id: 'user1',
  receiver_id: 'user2',
  is_read: false,
  createdAt: new Date('2024-01-01'),
  sender: { id: 'user1', user_name: '送信者' },
  receiver: { id: 'user2', user_name: '受信者' },
};

/** リクエスト作成ヘルパー */
function createRequest(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --------------------------------------------------
// GET /api/messages (受信トレイ)
// --------------------------------------------------
describe('GET /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('認証済みユーザーの受信メッセージを返す', async () => {
    mockGetUserId.mockReturnValue('user2');
    mockPrismaMessage.findMany.mockResolvedValue([mockMessageData]);

    const req = createRequest('GET', 'http://localhost/api/messages');
    const res = await getInbox(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('未認証の場合は401を返す', async () => {
    mockGetUserId.mockReturnValue(null);

    const req = createRequest('GET', 'http://localhost/api/messages');
    const res = await getInbox(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('認証が必要です');
  });

  it('DBエラー時は500を返す', async () => {
    mockGetUserId.mockReturnValue('user2');
    mockPrismaMessage.findMany.mockRejectedValue(new Error('DB error'));

    const req = createRequest('GET', 'http://localhost/api/messages');
    const res = await getInbox(req);

    expect(res.status).toBe(500);
  });
});

// --------------------------------------------------
// POST /api/messages (メッセージ送信)
// --------------------------------------------------
describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効なデータでメッセージを送信できる', async () => {
    mockGetUserId.mockReturnValue('user1');
    mockPrismaMessage.create.mockResolvedValue(mockMessageData);

    const req = createRequest('POST', 'http://localhost/api/messages', {
      subject: 'テスト件名',
      body: 'テスト本文',
      receiver_id: 'user2',
    });
    const res = await postMessage(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.subject).toBe('テスト件名');
  });

  it('未認証の場合は401を返す', async () => {
    mockGetUserId.mockReturnValue(null);

    const req = createRequest('POST', 'http://localhost/api/messages', {
      subject: 'テスト件名',
      body: 'テスト本文',
      receiver_id: 'user2',
    });
    const res = await postMessage(req);

    expect(res.status).toBe(401);
  });

  it('件名が空の場合は400を返す', async () => {
    mockGetUserId.mockReturnValue('user1');

    const req = createRequest('POST', 'http://localhost/api/messages', {
      subject: '',
      body: 'テスト本文',
      receiver_id: 'user2',
    });
    const res = await postMessage(req);

    expect(res.status).toBe(400);
    expect(mockPrismaMessage.create).not.toHaveBeenCalled();
  });

  it('自分自身への送信は400を返す', async () => {
    mockGetUserId.mockReturnValue('user1');

    const req = createRequest('POST', 'http://localhost/api/messages', {
      subject: 'テスト件名',
      body: 'テスト本文',
      receiver_id: 'user1',
    });
    const res = await postMessage(req);

    expect(res.status).toBe(400);
  });
});

// --------------------------------------------------
// GET /api/messages/sent (送信トレイ)
// --------------------------------------------------
describe('GET /api/messages/sent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('認証済みユーザーの送信メッセージを返す', async () => {
    mockGetUserId.mockReturnValue('user1');
    mockPrismaMessage.findMany.mockResolvedValue([mockMessageData]);

    const req = createRequest('GET', 'http://localhost/api/messages/sent');
    const res = await getSent(req);

    expect(res.status).toBe(200);
  });

  it('未認証の場合は401を返す', async () => {
    mockGetUserId.mockReturnValue(null);

    const req = createRequest('GET', 'http://localhost/api/messages/sent');
    const res = await getSent(req);

    expect(res.status).toBe(401);
  });
});

// --------------------------------------------------
// DELETE /api/messages/[message_id]
// --------------------------------------------------
describe('DELETE /api/messages/[message_id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('送信者がメッセージを削除できる', async () => {
    mockGetUserId.mockReturnValue('user1');
    mockPrismaMessage.findUnique.mockResolvedValue(mockMessageData);
    mockPrismaMessage.delete.mockResolvedValue(mockMessageData);

    const req = createRequest('DELETE', 'http://localhost/api/messages/1');
    const res = await deleteMessage(req, {
      params: Promise.resolve({ message_id: '1' }),
    });

    expect(res.status).toBe(200);
  });

  it('未認証の場合は401を返す', async () => {
    mockGetUserId.mockReturnValue(null);

    const req = createRequest('DELETE', 'http://localhost/api/messages/1');
    const res = await deleteMessage(req, {
      params: Promise.resolve({ message_id: '1' }),
    });

    expect(res.status).toBe(401);
  });

  it('無効なIDの場合は400を返す', async () => {
    mockGetUserId.mockReturnValue('user1');

    const req = createRequest('DELETE', 'http://localhost/api/messages/invalid');
    const res = await deleteMessage(req, {
      params: Promise.resolve({ message_id: 'invalid' }),
    });

    expect(res.status).toBe(400);
  });

  it('存在しないメッセージは404を返す', async () => {
    mockGetUserId.mockReturnValue('user1');
    mockPrismaMessage.findUnique.mockResolvedValue(null);

    const req = createRequest('DELETE', 'http://localhost/api/messages/999');
    const res = await deleteMessage(req, {
      params: Promise.resolve({ message_id: '999' }),
    });

    expect(res.status).toBe(404);
  });

  it('関係者でない場合は403を返す', async () => {
    mockGetUserId.mockReturnValue('user3');
    mockPrismaMessage.findUnique.mockResolvedValue(mockMessageData);

    const req = createRequest('DELETE', 'http://localhost/api/messages/1');
    const res = await deleteMessage(req, {
      params: Promise.resolve({ message_id: '1' }),
    });

    expect(res.status).toBe(403);
  });
});

// --------------------------------------------------
// PATCH /api/messages/[message_id]/read
// --------------------------------------------------
describe('PATCH /api/messages/[message_id]/read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('受信者がメッセージを既読にできる', async () => {
    mockGetUserId.mockReturnValue('user2');
    mockPrismaMessage.findUnique.mockResolvedValue(mockMessageData);
    mockPrismaMessage.update.mockResolvedValue({ ...mockMessageData, is_read: true });

    const req = createRequest('PATCH', 'http://localhost/api/messages/1/read');
    const res = await patchRead(req, {
      params: Promise.resolve({ message_id: '1' }),
    });

    expect(res.status).toBe(200);
  });

  it('未認証の場合は401を返す', async () => {
    mockGetUserId.mockReturnValue(null);

    const req = createRequest('PATCH', 'http://localhost/api/messages/1/read');
    const res = await patchRead(req, {
      params: Promise.resolve({ message_id: '1' }),
    });

    expect(res.status).toBe(401);
  });

  it('受信者以外が既読にしようとすると403を返す', async () => {
    mockGetUserId.mockReturnValue('user1'); // sender, not receiver
    mockPrismaMessage.findUnique.mockResolvedValue(mockMessageData);

    const req = createRequest('PATCH', 'http://localhost/api/messages/1/read');
    const res = await patchRead(req, {
      params: Promise.resolve({ message_id: '1' }),
    });

    expect(res.status).toBe(403);
  });

  it('存在しないメッセージは404を返す', async () => {
    mockGetUserId.mockReturnValue('user2');
    mockPrismaMessage.findUnique.mockResolvedValue(null);

    const req = createRequest('PATCH', 'http://localhost/api/messages/999/read');
    const res = await patchRead(req, {
      params: Promise.resolve({ message_id: '999' }),
    });

    expect(res.status).toBe(404);
  });
});
