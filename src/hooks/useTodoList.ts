import { PublicTodo, Todo } from '@/types/todo';
import { useCallback, useEffect, useState } from 'react';

interface UseTodoListOptions {
  userId?: string;
  autoFetch?: boolean;
}

/**
 * ToDoリスト管理用カスタムフック
 * CRUD操作とローディング状態を管理
 */
export const useTodoList = (options: UseTodoListOptions = {}) => {
  const { userId, autoFetch = true } = options;
  
  const [todos, setTodos] = useState<(Todo | PublicTodo)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ToDoリストを取得
   */
  const fetchTodos = useCallback(async (targetUserId?: string) => {
    const id = targetUserId || userId;
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/todoList/${id}`);
      if (!response.ok) {
        throw new Error('ToDoリストの取得に失敗しました');
      }
      
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ToDoリストの取得に失敗しました';
      setError(errorMessage);
      console.error('ToDoリスト取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 公開ToDoリストを取得
   */
  const fetchPublicTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/todoList');
      if (!response.ok) {
        throw new Error('公開ToDoリストの取得に失敗しました');
      }
      
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '公開ToDoリストの取得に失敗しました';
      setError(errorMessage);
      console.error('公開ToDoリスト取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ToDoを作成
   */
  const createTodo = useCallback(async (todoData: {
    title: string;
    description: string;
    todo_deadline: string;
    is_public: boolean;
  }) => {
    try {
      const response = await fetch('/api/todoList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ToDoの作成に失敗しました');
      }

      const newTodo = await response.json();
      setTodos(prev => [newTodo, ...prev]);
      return newTodo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ToDoの作成に失敗しました';
      setError(errorMessage);
      throw error;
    }
  }, []);

  /**
   * ToDoを更新
   */
  const updateTodo = useCallback(async (
    todoId: number,
    updateData: {
      title?: string;
      description?: string;
      todo_deadline?: string;
      is_completed?: boolean;
      is_public?: boolean;
    }
  ) => {
    if (!userId) {
      throw new Error('ユーザーIDが必要です');
    }

    try {
      const response = await fetch(`/api/todoList/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todo_id: todoId, ...updateData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ToDoの更新に失敗しました');
      }

      const updatedTodo = await response.json();
      setTodos(prev => prev.map(todo => 
        todo.todo_id === todoId ? updatedTodo : todo
      ));
      return updatedTodo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ToDoの更新に失敗しました';
      setError(errorMessage);
      throw error;
    }
  }, [userId]);

  /**
   * ToDoを削除
   */
  const deleteTodo = useCallback(async (todoId: number) => {
    if (!userId) {
      throw new Error('ユーザーIDが必要です');
    }

    try {
      const response = await fetch(`/api/todoList/${userId}?todo_id=${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ToDoの削除に失敗しました');
      }

      setTodos(prev => prev.filter(todo => todo.todo_id !== todoId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ToDoの削除に失敗しました';
      setError(errorMessage);
      throw error;
    }
  }, [userId]);

  /**
   * ToDoの完了状態を切り替え
   */
  const toggleTodoCompletion = useCallback(async (todoId: number) => {
    try {
      const response = await fetch(`/api/todoList/toggle/${todoId}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '完了状態の切り替えに失敗しました');
      }

      const updatedTodo = await response.json();
      setTodos(prev => prev.map(todo => 
        todo.todo_id === todoId ? updatedTodo : todo
      ));
      return updatedTodo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完了状態の切り替えに失敗しました';
      setError(errorMessage);
      throw error;
    }
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 初期データ取得
   */
  useEffect(() => {
    if (autoFetch && userId) {
      fetchTodos();
    }
  }, [autoFetch, userId, fetchTodos]);

  // 統計データ
  const stats = {
    total: todos.length,
    completed: todos.filter(todo => todo.is_completed).length,
    pending: todos.filter(todo => !todo.is_completed).length,
    overdue: todos.filter(todo => {
      if (todo.is_completed) return false;
      const deadline = new Date(todo.todo_deadline);
      const now = new Date();
      return deadline < now;
    }).length,
  };

  return {
    // データ
    todos,
    stats,
    
    // 状態
    isLoading,
    error,
    
    // アクション
    fetchTodos,
    fetchPublicTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoCompletion,
    clearError,
  };
};