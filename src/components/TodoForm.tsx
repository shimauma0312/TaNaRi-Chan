import { Todo } from "@/types/todo";
import { useState } from "react";

interface TodoFormProps {
  initialData?: Partial<Todo>;
  onSubmit: (data: {
    title: string;
    description: string;
    todo_deadline: string;
    is_public: boolean;
    is_completed?: boolean;
  }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

/**
 * ToDo作成・編集用フォームコンポーネント
 * 作成と編集の両方で再利用可能
 */
export default function TodoForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  isSubmitting = false,
}: TodoFormProps) {
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [dueDate, setDueDate] = useState(
    initialData.todo_deadline 
      ? new Date(initialData.todo_deadline).toISOString().split('T')[0]
      : ""
  );
  const [visibility, setVisibility] = useState(
    initialData.is_public ? "public" : "private"
  );
  const [isCompleted, setIsCompleted] = useState(initialData.is_completed || false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // フロントエンドバリデーション
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!description.trim()) {
        throw new Error('Description is required');
      }
      if (!dueDate) {
        throw new Error('Due date is required');
      }

      // 期限が過去でないかチェック（編集時は除く）
      if (!initialData.todo_id) {
        const deadline = new Date(dueDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (deadline < now) {
          throw new Error('Due date must be today or later');
        }
      }

      const formData = {
        title: title.trim(),
        description: description.trim(),
        todo_deadline: new Date(dueDate).toISOString(),
        is_public: visibility === 'public',
        ...(initialData.todo_id && { is_completed: isCompleted }),
      };

      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <div className="w-full max-w-lg p-6 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--foreground)]">
      <h2 className="text-2xl font-bold mb-4">
        {initialData.todo_id ? 'Edit Todo' : 'Create New Todo'}
      </h2>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Todo Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
            required
            disabled={isSubmitting}
            placeholder="e.g., Create project documentation"
            maxLength={100}
          />
          <div className="text-xs text-gray-400 mt-1">
            {title.length}/100 characters
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
            rows={3}
            required
            disabled={isSubmitting}
            placeholder="Enter detailed description"
            maxLength={500}
          />
          <div className="text-xs text-gray-400 mt-1">
            {description.length}/500 characters
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Due Date *</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
            required
            disabled={isSubmitting}
            min={!initialData.todo_id ? new Date().toISOString().split('T')[0] : undefined}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full p-2 border rounded-lg bg-black text-white border-gray-400 focus:ring-2 focus:ring-blue-400"
            disabled={isSubmitting}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <div className="text-xs text-gray-400 mt-1">
            Public todos can be viewed by other users
          </div>
        </div>

        {/* 編集時のみ完了状態を表示 */}
        {initialData.todo_id && (
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 text-green-500 rounded border-gray-400 focus:ring-green-500"
                disabled={isSubmitting}
              />
              <span className="font-medium">Completed</span>
            </label>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}