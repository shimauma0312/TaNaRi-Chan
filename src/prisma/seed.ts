import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.user.upsert({
        where: { id: '1' },
        update: {
            user_name: 'yamada',
            user_email: 'yamada@example.com',
            // pw: password123
            password: '$2b$12$bqe08s6Gfy6d7O3Sogg.kettd45pDIK7S6F1.7NqS2b0eYFkcexqu',
            icon_number: 1,
        },
        create: {
            id: '1',
            user_name: 'yamada',
            user_email: 'yamada@example.com',
            // pw: password123
            password: '$2b$12$bqe08s6Gfy6d7O3Sogg.kettd45pDIK7S6F1.7NqS2b0eYFkcexqu',
            icon_number: 1,
        },
    });

    await prisma.post.upsert({
        where: { post_id: 1 },
        update: {
            content: '# 光源氏の物語は、まことに雅なり。',
            author_id: '1',
        },
        create: {
            title: '源氏物語について',
            content: '# 光源氏の物語は、まことに雅なり。',
            author_id: '1',
            comments: {
                create: [
                    {
                        content: 'まことに興味深き内容でございます。',
                        author_id: '1',
                        createdAt: new Date(),
                    },
                ],
            },
        },
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });