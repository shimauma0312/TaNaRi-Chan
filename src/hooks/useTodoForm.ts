import { useCallback, useState } from 'react';

interface TodoFormData {
  title: string;
  description: string;
  todo_deadline: string;
  is_public: boolean;
  is_completed?: boolean;
}

interface UseTodoFormOptions {
  initialData?: Partial<TodoFormData>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * ToDoフォーム管理用カスタムフック
 * フォームの状態管理とバリデーションを提供
 */
export const useTodoForm = (options: UseTodoFormOptions = {}) => {
  const { initialData = {}, onSuccess, onError } = options;

  const [formData, setFormData] = useState<TodoFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    todo_deadline: initialData.todo_deadline 
      ? new Date(initialData.todo_deadline).toISOString().split('T')[0]
      : '',
    is_public: initialData.is_public || false,
    is_completed: initialData.is_completed || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TodoFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * フィールドの値を更新
   */
  const updateField = useCallback((field: keyof TodoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  /**
   * バリデーション
   */
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof TodoFormData, string>> = {};

    // タイトルのバリデーション
    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    // 説明のバリデーション
    if (!formData.description.trim()) {
      newErrors.description = '説明は必須です';
    } else if (formData.description.length > 500) {
      newErrors.description = '説明は500文字以内で入力してください';
    }

    // 期限のバリデーション
    if (!formData.todo_deadline) {
      newErrors.todo_deadline = '期限は必須です';
    } else {
      const deadline = new Date(formData.todo_deadline);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // 新規作成時は過去日不可、編集時は許可
      if (!initialData.todo_deadline && deadline < now) {
        newErrors.todo_deadline = '期限は今日以降に設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, initialData]);

  /**
   * フォームをリセット
   */
  const resetForm = useCallback(() => {
    setFormData({
      title: initialData.title || '',
      description: initialData.description || '',
      todo_deadline: initialData.todo_deadline 
        ? new Date(initialData.todo_deadline).toISOString().split('T')[0]
        : '',
      is_public: initialData.is_public || false,
      is_completed: initialData.is_completed || false,
    });
    setErrors({});
  }, [initialData]);

  /**
   * API送信用のデータを取得
   */
  const getSubmitData = useCallback(() => {
    return {
      title: formData.title.trim(),
      description: formData.description.trim(),
      todo_deadline: new Date(formData.todo_deadline).toISOString(),
      is_public: formData.is_public,
      ...(initialData.is_completed !== undefined && { is_completed: formData.is_completed }),
    };
  }, [formData, initialData]);

  /**
   * フォーム送信処理
   */
  const handleSubmit = useCallback(async (
    submitFunction: (data: any) => Promise<any>
  ) => {
    if (!validate()) {
      return false;
    }

    try {
      setIsSubmitting(true);
      const submitData = getSubmitData();
      const result = await submitFunction(submitData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '処理に失敗しました';
      
      if (onError) {
        onError(errorMessage);
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, getSubmitData, onSuccess, onError]);

  /**
   * エラーをクリア
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * 特定のフィールドのエラーをクリア
   */
  const clearFieldError = useCallback((field: keyof TodoFormData) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  return {
    // フォームデータ
    formData,
    errors,
    isSubmitting,
    
    // アクション
    updateField,
    resetForm,
    handleSubmit,
    validate,
    clearErrors,
    clearFieldError,
    getSubmitData,
    
    // ヘルパー
    isValid: Object.keys(errors).length === 0,
    hasChanges: JSON.stringify(formData) !== JSON.stringify({
      title: initialData.title || '',
      description: initialData.description || '',
      todo_deadline: initialData.todo_deadline 
        ? new Date(initialData.todo_deadline).toISOString().split('T')[0]
        : '',
      is_public: initialData.is_public || false,
      is_completed: initialData.is_completed || false,
    }),
  };
};