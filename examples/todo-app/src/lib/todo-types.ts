export interface TodoFormData {
  id?: string;
  title: string;
  description?: string | null;
  status: "pending" | "in_progress" | "done" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date | null;
  categoryId?: string | null;
}
