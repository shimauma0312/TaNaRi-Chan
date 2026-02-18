/**
 * メッセージリストコンポーネント
 *
 * 受信トレイまたは送信トレイのメッセージ一覧を表示する。
 */

"use client"

import { MessageWithUsers } from "@/domain/message/Message"
import MessageItem from "./MessageItem"

/**
 * MessageListコンポーネントのProps
 *
 * @property messages - 表示するメッセージの配列
 * @property variant  - 受信（`inbox`）か送信（`sent`）かの種別
 * @property onDelete - 削除コールバック
 * @property onRead   - 既読コールバック（受信トレイのみ）
 */
interface MessageListProps {
  messages: MessageWithUsers[]
  variant: "inbox" | "sent"
  onDelete: (messageId: number) => void
  onRead?: (messageId: number) => void
}

/**
 * メッセージ一覧コンポーネント
 *
 * @param props - コンポーネントのProps
 * @returns メッセージ一覧のJSX要素
 */
const MessageList = ({ messages, variant, onDelete, onRead }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <p className="text-gray-400">
        {variant === "inbox" ? "受信メッセージはありません" : "送信メッセージはありません"}
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.message_id}
          message={message}
          variant={variant}
          onDelete={onDelete}
          onRead={onRead}
        />
      ))}
    </ul>
  )
}

export default MessageList
