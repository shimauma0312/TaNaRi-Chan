import { PrismaMessageRepository } from "@/infrastructure/message/PrismaMessageRepository"

describe("PrismaMessageRepository mailbox deletion", () => {
  const message = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  }
  const repository = new PrismaMessageRepository({ message } as any)

  beforeEach(() => {
    jest.clearAllMocks()
    message.findMany.mockResolvedValue([])
    message.update.mockResolvedValue({})
    message.deleteMany.mockResolvedValue({ count: 0 })
  })

  test("受信箱から削除しても送信者側の行を保持する", async () => {
    message.findUnique.mockResolvedValue({ sender_id: "sender", receiver_id: "receiver" })

    await repository.delete(1, "receiver")

    expect(message.update).toHaveBeenCalledWith({
      where: { message_id: 1, receiver_id: "receiver", deletedByReceiver: false },
      data: { deletedByReceiver: true },
    })
    expect(message.deleteMany).toHaveBeenCalledWith({
      where: { message_id: 1, deletedBySender: true, deletedByReceiver: true },
    })
  })

  test("削除済みメッセージを各メールボックスから除外する", async () => {
    await repository.findByReceiverId("receiver")
    await repository.findBySenderId("sender")

    expect(message.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { receiver_id: "receiver", deletedByReceiver: false } }),
    )
    expect(message.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { sender_id: "sender", deletedBySender: false } }),
    )
  })

  test("内部のメールボックス削除フラグをAPI用取得結果に含めない", async () => {
    message.create.mockResolvedValue({})

    await repository.create({
      subject: "subject",
      body: "body",
      sender_id: "sender",
      receiver_id: "receiver",
    })
    await repository.findByReceiverId("receiver")
    await repository.findBySenderId("sender")
    await repository.findById(1)

    for (const query of [
      message.create.mock.calls[0][0],
      message.findMany.mock.calls[0][0],
      message.findMany.mock.calls[1][0],
      message.findUnique.mock.calls[0][0],
    ]) {
      expect(query.select).toEqual(
        expect.objectContaining({ message_id: true, sender: expect.any(Object) }),
      )
      expect(query.select).not.toHaveProperty("deletedBySender")
      expect(query.select).not.toHaveProperty("deletedByReceiver")
      expect(query).not.toHaveProperty("include")
    }
  })

  test("削除済みの受信メッセージを既読化しない", async () => {
    await repository.markAsRead(1, "receiver")

    expect(message.update).toHaveBeenCalledWith({
      where: { message_id: 1, receiver_id: "receiver", deletedByReceiver: false },
      data: { is_read: true },
      select: expect.objectContaining({ message_id: true, body: true }),
    })
  })
})
