-- Support bounded owner calendar queries over a [from, to) deadline range.
CREATE INDEX "Todo_id_todo_deadline_idx" ON "Todo"("id", "todo_deadline");
