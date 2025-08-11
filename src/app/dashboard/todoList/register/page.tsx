"use client";

import MinLoader from "@/components/MinLoader";
import SideMenu from "@/components/SideMenu";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // フォームの状態管理
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [visibility, setVisibility] = useState("private");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTodo = { title, description, dueDate, visibility };
    console.log("New Todo:", newTodo);
  };

  if (loading || !user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="flex flex-col items-center justify-center min-h-full px-4">
          {/* My Todo Listへ戻るボタン */}
          <button
            onClick={() => router.push("/dashboard/todoList")}
            className="self-start mb-4 px-4 py-2 bg-red-500 text-lg text-white py-1 px-3 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            My Todo Listへ戻る
          </button>

          {/* フォーム */}
          <div className="w-full max-w-lg p-6 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--foreground)]">
            <h2 className="text-2xl font-bold mb-4">新しいToDoを登録</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">ToDoタイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block font-medium">説明文</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block font-medium">期限</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block font-medium">公開範囲</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-black text-white border-gray-400 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="private">自分のみ</option>
                  <option value="public">全体公開</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
              >
                登録
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
