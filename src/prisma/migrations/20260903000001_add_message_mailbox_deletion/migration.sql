ALTER TABLE "Message"
ADD COLUMN "deletedBySender" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedByReceiver" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Message_receiver_id_deletedByReceiver_createdAt_idx"
ON "Message"("receiver_id", "deletedByReceiver", "createdAt");

CREATE INDEX "Message_sender_id_deletedBySender_createdAt_idx"
ON "Message"("sender_id", "deletedBySender", "createdAt");
