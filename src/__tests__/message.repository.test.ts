import { PrismaMessageRepository } from "@/infrastructure/message/PrismaMessageRepository"

describe("PrismaMessageRepository mailbox deletion", () => {
  const message = {
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
})
