"use client";

import MinLoader from "@/components/MinLoader";
import SideMenu from "@/components/SideMenu";
import useAuth from "@/hooks/useAuth";
import { Todo } from "@/types/todo";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function EditTodoPageSearchParams({ setTodoId }: { setTodoId: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const id = searchParams.get('id');
    setTodoId(id);
  }, [searchParams, setTodoId]);
  
  return null;
}

function EditTodoPageContent({ todoId }: { todoId: string | null }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // フォームの状態管理
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * ToDoを取得する
   */
  const fetchTodo = useCallback(async (id: string): Promise<Todo | null> => {
    if (!user?.id) return null;
    
    const response = await fetch(`/api/todoList/${user.id}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch ToDo');
    }
    
    const todos: Todo[] = await response.json();
    const todo = todos.find(t => t.todo_id === parseInt(id));
    
    if (!todo) {
      throw new Error('ToDo not found');
    }
    
    return todo;
  }, [user?.id]);

  /**
   * ToDo更新APIを呼び出す
   */
  const updateTodo = async (todoData: {
    todo_id: number;
    title: string;
    description: string;
    todo_deadline: string;
    is_completed: boolean;
    is_public: boolean;
  }) => {
    const response = await fetch(`/api/todoList/${user?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todoData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update ToDo');
    }

    return response.json();
  };

  // ToDoデータの初期化
  useEffect(() => {
    const initializeTodo = async () => {
      if (!user || !todoId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const todo = await fetchTodo(todoId);
        if (!todo) {
          throw new Error('ToDo not found');
        }
        setTitle(todo.title);
        setDescription(todo.description || '');
        setDueDate(new Date(todo.todo_deadline).toISOString().split('T')[0]);
        setVisibility(todo.is_public ? 'public' : 'private');
        setIsCompleted(todo.is_completed);
      } catch (error) {
        console.error('ToDo取得エラー:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch ToDo');
      } finally {
        setIsLoading(false);
      }
    };

    initializeTodo();
  }, [user, todoId, fetchTodo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!todoId || !user) return;
    
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

      const todoData = {
        todo_id: parseInt(todoId),
        title: title.trim(),
        description: description.trim(),
        todo_deadline: new Date(dueDate).toISOString(),
        is_completed: isCompleted,
        is_public: visibility === 'public',
      };

      await updateTodo(todoData);
      
      // 成功時はToDo一覧ページにリダイレクト
      router.push('/dashboard/todoList');
    } catch (error) {
      console.error('ToDo更新エラー:', error);
      setError(error instanceof Error ? error.message : 'Failed to update ToDo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return <MinLoader />
  }

  if (!todoId) {
    return (
      <div className="min-h-screen text-white p-4 flex">
        <SideMenu />
        <div className="w-4/5 p-4">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">ToDo ID is not specified</div>
            <button
              onClick={() => router.push("/dashboard/todoList")}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Back to ToDo List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
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
            <h2 className="text-2xl font-bold mb-4">Edit ToDo</h2>
            
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

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/todoList')}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditTodoPage() {
  const [todoId, setTodoId] = useState<string | null>(null);
  
  return (
    <Suspense fallback={<MinLoader />}>
      <EditTodoPageSearchParams setTodoId={setTodoId} />
      <EditTodoPageContent todoId={todoId} />
    </Suspense>
  );
}
