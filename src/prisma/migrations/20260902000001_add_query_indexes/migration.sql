-- Add indexes for the application's most frequent list and ownership queries.
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_author_id_createdAt_idx" ON "Post"("author_id", "createdAt");
CREATE INDEX "Todo_is_public_createdAt_idx" ON "Todo"("is_public", "createdAt");
CREATE INDEX "Todo_id_is_completed_todo_deadline_idx" ON "Todo"("id", "is_completed", "todo_deadline");
CREATE INDEX "Message_receiver_id_createdAt_idx" ON "Message"("receiver_id", "createdAt");
CREATE INDEX "Message_sender_id_createdAt_idx" ON "Message"("sender_id", "createdAt");
