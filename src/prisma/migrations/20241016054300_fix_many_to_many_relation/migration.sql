-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "icon_number" INTEGER NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Todos" (
    "todo_id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "todo_deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Todos_pkey" PRIMARY KEY ("todo_id")
);

-- CreateTable
CREATE TABLE "Posts" (
    "post_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "author_id" INTEGER NOT NULL,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "PostTags" (
    "tag_id" SERIAL NOT NULL,
    "tag_name" TEXT NOT NULL,

    CONSTRAINT "PostTags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "PostComments" (
    "comment_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,

    CONSTRAINT "PostComments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "TodoComments" (
    "comment_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" INTEGER NOT NULL,
    "todo_id" INTEGER NOT NULL,

    CONSTRAINT "TodoComments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "_PostTagsToPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_firebase_uid_key" ON "Users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Users_user_email_key" ON "Users"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "PostTags_tag_name_key" ON "PostTags"("tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "_PostTagsToPosts_AB_unique" ON "_PostTagsToPosts"("A", "B");

-- CreateIndex
CREATE INDEX "_PostTagsToPosts_B_index" ON "_PostTagsToPosts"("B");

-- AddForeignKey
ALTER TABLE "Todos" ADD CONSTRAINT "Todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComments" ADD CONSTRAINT "PostComments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComments" ADD CONSTRAINT "PostComments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Posts"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoComments" ADD CONSTRAINT "TodoComments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoComments" ADD CONSTRAINT "TodoComments_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "Todos"("todo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTagsToPosts" ADD CONSTRAINT "_PostTagsToPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "PostTags"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTagsToPosts" ADD CONSTRAINT "_PostTagsToPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "Posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;
