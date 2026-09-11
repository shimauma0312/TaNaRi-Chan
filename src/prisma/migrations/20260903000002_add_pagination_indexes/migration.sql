-- Align compound indexes with the filters and descending primary-key cursors
-- used by the bounded list endpoints.
DROP INDEX IF EXISTS "Message_receiver_id_deletedByReceiver_createdAt_idx";
DROP INDEX IF EXISTS "Message_sender_id_deletedBySender_createdAt_idx";

CREATE INDEX "Message_receiver_id_deletedByReceiver_message_id_idx"
ON "Message"("receiver_id", "deletedByReceiver", "message_id");

CREATE INDEX "Message_sender_id_deletedBySender_message_id_idx"
ON "Message"("sender_id", "deletedBySender", "message_id");

CREATE INDEX "Todo_id_todo_id_idx" ON "Todo"("id", "todo_id");
CREATE INDEX "Todo_is_public_todo_id_idx" ON "Todo"("is_public", "todo_id");
CREATE INDEX "Post_author_id_post_id_idx" ON "Post"("author_id", "post_id");
