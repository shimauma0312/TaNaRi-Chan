import { PublicTodo, Todo } from "@/types/todo";
import { useState } from "react";

interface TodoListProps {
  todos: (Todo | PublicTodo)[];
  onToggleCompletion?: (todoId: number) => Promise<void>;
  onEdit?: (todoId: number) => void;
  onDelete?: (todoId: number) => Promise<void>;
  showStats?: boolean;
  allowEdit?: boolean;
  showPublicBadge?: boolean;
}

/**
 * Todo list display component
 * Includes list view, statistics, operation buttons
 */
export default function TodoList({
  todos,
  onToggleCompletion,
  onEdit,
  onDelete,
  showStats = true,
  allowEdit = true,
  showPublicBadge = true,
}: TodoListProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

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

  // Statistics data
  const stats = {
    total: todos.length,
    completed: todos.filter(todo => todo.is_completed).length,
    pending: todos.filter(todo => !todo.is_completed).length,
    overdue: todos.filter(todo => !todo.is_completed && isOverdue(todo.todo_deadline)).length,
    nearDeadline: todos.filter(todo => !todo.is_completed && isDeadlineNear(todo.todo_deadline) && !isOverdue(todo.todo_deadline)).length,
  };

  const handleDelete = async (todoId: number) => {
    if (!onDelete) return;
    
    if (!confirm('このToDoを削除してもよろしいですか？')) {
      return;
    }

    try {
      setIsDeleting(todoId);
      await onDelete(todoId);
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleCompletion = async (todoId: number) => {
    if (!onToggleCompletion) return;
    
    try {
      await onToggleCompletion(todoId);
    } catch (error) {
      console.error('Toggle completion error:', error);
    }
  };

  if (todos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-gray-400 mb-4">No Todos available</div>
        <p className="text-gray-500">Create a new Todo to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
            <div className="text-sm text-blue-300">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
            <div className="text-sm text-green-300">Completed</div>
            <div className="text-xl font-bold">{stats.completed}</div>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
            <div className="text-sm text-yellow-300">Pending</div>
            <div className="text-xl font-bold">{stats.pending}</div>
          </div>
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
            <div className="text-sm text-red-300">Overdue</div>
            <div className="text-xl font-bold">{stats.overdue}</div>
          </div>
          <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3">
            <div className="text-sm text-orange-300">Due Soon</div>
            <div className="text-xl font-bold">{stats.nearDeadline}</div>
          </div>
        </div>
      )}

      {/* TODO List */}
      <ul className="space-y-4">
        {todos.map((todo) => (
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
                  {onToggleCompletion && (
                    <input
                      type="checkbox"
                      checked={todo.is_completed}
                      onChange={() => handleToggleCompletion(todo.todo_id)}
                      className="w-5 h-5 rounded border-gray-400 text-green-500 focus:ring-green-500"
                    />
                  )}
                  <h2 className={`text-xl font-semibold ${todo.is_completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.title}
                  </h2>
                  {showPublicBadge && todo.is_public && (
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
                  {todo.createdAt && (
                    <span className="text-gray-500">
                      Created: {new Date(todo.createdAt).toLocaleDateString('en-US')}
                    </span>
                  )}
                  {/* Display username for public todos */}
                  {'user' in todo && (
                    <span className="text-blue-400 font-medium">
                      Author: {(todo as PublicTodo).user.user_name}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 操作ボタン */}
              {allowEdit && (onEdit || onDelete) && (
                <div className="flex gap-2 ml-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(todo.todo_id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(todo.todo_id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                      disabled={isDeleting === todo.todo_id}
                    >
                      {isDeleting === todo.todo_id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}