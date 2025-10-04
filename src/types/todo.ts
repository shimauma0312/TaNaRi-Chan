// ToDo関連の型定義

export interface Todo {
  todo_id: number;
  id: string; // ユーザーID
  title: string;
  description?: string;
  todo_deadline: string;
  is_completed: boolean;
  is_public: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 公開ToDo用の型（ユーザー情報付き）
export interface PublicTodo extends Todo {
  user: {
    id: string;
    user_name: string;
  };
}

export interface User {
  id: string;
  user_name: string;
  user_email: string;
  icon_number: number;
}

export interface TodoFormData {
  title: string;
  description: string;
  todo_deadline: string;
  is_public: boolean;
  is_completed?: boolean;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export interface ApiErrorResponse {
  error: string;
  statusCode?: number;
}