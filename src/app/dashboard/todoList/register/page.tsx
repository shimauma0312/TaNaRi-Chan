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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ToDo作成APIを呼び出す
   */
  const createTodo = async (todoData: {
    title: string;
    description: string;
    todo_deadline: string;
    is_public: boolean;
  }) => {
    const response = await fetch('/api/todoList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todoData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create ToDo');
    }

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // バリデーション
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!description.trim()) {
        throw new Error('Description is required');
      }
      if (!dueDate) {
        throw new Error('Due date is required');
      }

      // 期限が過去でないかチェック
      const deadline = new Date(dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // 時刻を00:00:00にリセット
      if (deadline < now) {
        throw new Error('Due date must be today or later');
      }

      const todoData = {
        title: title.trim(),
        description: description.trim(),
        todo_deadline: new Date(dueDate).toISOString(),
        is_public: visibility === 'public',
      };

      await createTodo(todoData);
      
      // 成功時はToDo一覧ページにリダイレクト
      router.push('/dashboard/todoList');
    } catch (error) {
      console.error('ToDo作成エラー:', error);
      setError(error instanceof Error ? error.message : 'Failed to create ToDo');
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          >
            Back to My Todo List
          </button>

          {/* フォーム */}
          <div className="w-full max-w-lg p-6 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--foreground)]">
            <h2 className="text-2xl font-bold mb-4">Register New ToDo</h2>
            
            {/* エラーメッセージ */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">ToDo Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. Create project documentation"
                />
              </div>

              <div>
                <label className="block font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  required
                  disabled={isSubmitting}
                  placeholder="Enter detailed description"
                />
              </div>

              <div>
                <label className="block font-medium">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]} // 今日以降の日付のみ選択可能
                />
              </div>

              <div>
                <label className="block font-medium">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-black text-white border-gray-400 focus:ring-2 focus:ring-blue-400"
                  disabled={isSubmitting}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
