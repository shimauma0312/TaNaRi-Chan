"use client"

import SideMenu from "@/components/SideMenu";
import useAuth from "@/hooks/useAuth";
import { Todo } from "@/types/todo";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Get user's Todo list
 */
const getTodoList = async (id: string): Promise<Todo[]> => {
  const response = await fetch("/api/todoList/" + id);
  if (!response.ok) {
    throw new Error('Failed to fetch Todo list');
  }
  const data = await response.json();
  return data;
};

/**
 * Toggle Todo completion status
 */
const toggleTodoCompletion = async (todoId: number): Promise<Todo> => {
  const response = await fetch(`/api/todoList/toggle/${todoId}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to toggle completion status');
  }
  return response.json();
};

/**
 * Delete a Todo
 */
const deleteTodo = async (todoId: number, userId: string): Promise<void> => {
  const response = await fetch(`/api/todoList/${userId}?todo_id=${todoId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete Todo');
  }
};

const ToDoListPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch Todo list
  const fetchTodoList = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const todos = await getTodoList(user.id);
      setTodoList(todos);
    } catch (error) {
      console.error('ToDoリスト取得エラー:', error);
      setError(error instanceof Error ? error.message : 'ToDoリストの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTodoList();
    }
  }, [user, fetchTodoList]);

  // Toggle completion status
  const handleToggleCompletion = async (todoId: number) => {
    try {
      const updatedTodo = await toggleTodoCompletion(todoId);
      setTodoList(prevList =>
        prevList.map(todo =>
          todo.todo_id === todoId ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Toggle completion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle completion status');
    }
  };

  // Delete Todo
  const handleDeleteTodo = async (todoId: number) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this Todo?')) {
      return;
    }

    try {
      await deleteTodo(todoId, user.id);
      setTodoList(prevList => prevList.filter(todo => todo.todo_id !== todoId));
    } catch (error) {
      console.error('Delete Todo error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete Todo');
    }
  };

  // Navigate to edit page
  const handleEditTodo = (todoId: number) => {
    router.push(`/dashboard/todoList/edit?id=${todoId}`);
  };

  // Highlight todos with nearby deadline (within 3 days)
  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  // Check if overdue
  const isOverdue = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return deadlineDate < now;
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4 relative">
        <div className="container mx-auto">
          {/* Header */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => router.push("/dashboard/todoList/register")}
              className="px-4 py-2 bg-green-500 text-lg text-white rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Todo
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-red-500 text-lg text-white rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Back
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-4">My Todo List</h1>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading Todo list...</div>
            </div>
          ) : todoList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-400 mb-4">No Todos yet</div>
              <button
                onClick={() => router.push("/dashboard/todoList/register")}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Create your first Todo
              </button>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <div className="mb-6 flex gap-4">
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
                  <div className="text-sm text-blue-300">Total</div>
                  <div className="text-xl font-bold">{todoList.length}</div>
                </div>
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
                  <div className="text-sm text-green-300">Completed</div>
                  <div className="text-xl font-bold">{todoList.filter(todo => todo.is_completed).length}</div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
                  <div className="text-sm text-yellow-300">Pending</div>
                  <div className="text-xl font-bold">{todoList.filter(todo => !todo.is_completed).length}</div>
                </div>
              </div>

              {/* TODO List */}
              <ul className="space-y-4">
                {todoList.map((todo) => (
                  <li 
                    key={todo.todo_id} 
                    className={`p-4 border rounded-lg shadow-md transition-all ${
                      todo.is_completed 
                        ? 'bg-gray-800/50 border-gray-600' 
                        : isOverdue(todo.todo_deadline)
                        ? 'bg-red-900/30 border-red-500'
                        : isDeadlineNear(todo.todo_deadline)
                        ? 'bg-yellow-900/30 border-yellow-500'
                        : 'bg-gray-900/50 border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={todo.is_completed}
                            onChange={() => handleToggleCompletion(todo.todo_id)}
                            className="w-5 h-5 rounded border-gray-400 text-green-500 focus:ring-green-500"
                          />
                          <h2 className={`text-xl font-semibold ${todo.is_completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.title}
                          </h2>
                          {todo.is_public && (
                            <span className="px-2 py-1 bg-blue-500/20 border border-blue-500 rounded text-xs text-blue-300">
                              Public
                            </span>
                          )}
                        </div>
                        <p className={`text-gray-300 mb-2 ${todo.is_completed ? 'line-through' : ''}`}>
                          {todo.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`${
                            isOverdue(todo.todo_deadline) && !todo.is_completed
                              ? 'text-red-400 font-bold'
                              : isDeadlineNear(todo.todo_deadline) && !todo.is_completed
                              ? 'text-yellow-400 font-bold'
                              : 'text-gray-500'
                          }`}>
                            Due: {new Date(todo.todo_deadline).toLocaleDateString('en-US')}
                            {isOverdue(todo.todo_deadline) && !todo.is_completed && ' (Overdue)'}
                            {isDeadlineNear(todo.todo_deadline) && !todo.is_completed && !isOverdue(todo.todo_deadline) && ' (Due soon)'}
                          </span>
                          <span className="text-gray-500">
                            Status: {todo.is_completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditTodo(todo.todo_id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.todo_id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToDoListPage;
