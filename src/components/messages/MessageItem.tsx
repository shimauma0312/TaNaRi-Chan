/**
 * メッセージアイテムコンポーネント
 *
 * 受信トレイ・送信トレイの各メッセージを表示するカードコンポーネント。
 */

"use client"

import { MessageWithUsers } from "@/domain/message/Message"

/**
 * MessageItemコンポーネントのProps
 *
 * @property message  - 表示するメッセージ（ユーザー情報付き）
 * @property variant  - 受信トレイ（`inbox`）か送信トレイ（`sent`）かの種別
 * @property onDelete - 削除ボタン押下時のコールバック
 * @property onRead   - 既読ボタン押下時のコールバック（受信トレイのみ）
 */
interface MessageItemProps {
  message: MessageWithUsers
  variant: "inbox" | "sent"
  onDelete: (messageId: number) => void
  onRead?: (messageId: number) => void
}

/**
 * メッセージアイテムカードコンポーネント
 *
 * @param props - コンポーネントのProps
 * @returns メッセージカードのJSX要素
 */
const MessageItem = ({ message, variant, onDelete, onRead }: MessageItemProps) => {
  const counterpart =
    variant === "inbox" ? message.sender : message.receiver

  const counterpartLabel = variant === "inbox" ? "From" : "To"

  return (
    <li
      className={`p-4 border rounded-lg shadow-md ${
        variant === "inbox" && !message.is_read
          ? "border-indigo-400 bg-indigo-900 bg-opacity-20"
          : "border-gray-600"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {variant === "inbox" && !message.is_read && (
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
            )}
            <h2 className="text-lg font-semibold">{message.subject}</h2>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {counterpartLabel}: {counterpart.user_name}
          </p>
          <p className="text-gray-300 text-sm line-clamp-2">{message.body}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(message.createdAt).toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          {variant === "inbox" && !message.is_read && onRead && (
            <button
              onClick={() => onRead(message.message_id)}
              className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              既読にする
            </button>
          )}
          <button
            onClick={() => onDelete(message.message_id)}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </div>
    </li>
  )
}

export default MessageItem
