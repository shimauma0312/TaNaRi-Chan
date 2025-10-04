import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // 既存のデータをクリア（開発環境でのみ）
    console.log('Clearing existing data...');
    await prisma.postComment.deleteMany({});
    await prisma.todo.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Creating users...');
    // User 1: yamada
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

    // User 2: alice_dev
    await prisma.user.upsert({
        where: { id: '2' },
        update: {
            user_name: 'alice_dev',
            user_email: 'alice@example.com',
            // pw: alice123
            password: '$2b$12$L8vHKC8Qk3Xk7QqNgNxC4eLEJf3GJNdHkJ2mDz4Gp8Rr9oQnBpKtO',
            icon_number: 2,
        },
        create: {
            id: '2',
            user_name: 'alice_dev',
            user_email: 'alice@example.com',
            // pw: alice123
            password: '$2b$12$L8vHKC8Qk3Xk7QqNgNxC4eLEJf3GJNdHkJ2mDz4Gp8Rr9oQnBpKtO',
            icon_number: 2,
        },
    });

    // User 3: bob_manager
    await prisma.user.upsert({
        where: { id: '3' },
        update: {
            user_name: 'bob_manager',
            user_email: 'bob@example.com',
            // pw: bobpass
            password: '$2b$12$M9wILC9Rl4Yl8RrOhOyD5uMFKG4HOPeIlK3nEz5Hr9Ss0qRoBqLuK',
            icon_number: 3,
        },
        create: {
            id: '3',
            user_name: 'bob_manager',
            user_email: 'bob@example.com',
            // pw: bobpass
            password: '$2b$12$M9wILC9Rl4Yl8RrOhOyD5uMFKG4HOPeIlK3nEz5Hr9Ss0qRoBqLuK',
            icon_number: 3,
        },
    });

    // User 4: carol_designer
    await prisma.user.upsert({
        where: { id: '4' },
        update: {
            user_name: 'carol_designer',
            user_email: 'carol@example.com',
            // pw: design123
            password: '$2b$12$N0xJMD0Sm5Zm9SsPhPzE6uNGLH5IPQfJmL4oF06Is0Tt1rSoCrMvS',
            icon_number: 4,
        },
        create: {
            id: '4',
            user_name: 'carol_designer',
            user_email: 'carol@example.com',
            // pw: design123
            password: '$2b$12$N0xJMD0Sm5Zm9SsPhPzE6uNGLH5IPQfJmL4oF06Is0Tt1rSoCrMvS',
            icon_number: 4,
        },
    });

    // User 5: dave_qa
    await prisma.user.upsert({
        where: { id: '5' },
        update: {
            user_name: 'dave_qa',
            user_email: 'dave@example.com',
            // pw: testing123
            password: '$2b$12$O1yKNE1Tn6an0TtQiQzF7uOHMI6JQRgKnM5pG17Jt1Uu2sTpDsMwT',
            icon_number: 5,
        },
        create: {
            id: '5',
            user_name: 'dave_qa',
            user_email: 'dave@example.com',
            // pw: testing123
            password: '$2b$12$O1yKNE1Tn6an0TtQiQzF7uOHMI6JQRgKnM5pG17Jt1Uu2sTpDsMwT',
            icon_number: 5,
        },
    });

    // Create sample todos
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('Creating todos...');
    // Yamada's todos (mixed public/private)
    await prisma.todo.create({
        data: {
            title: 'Complete project documentation',
            description: 'Write comprehensive documentation for the new feature',
            todo_deadline: nextWeek,
            is_public: true,
            is_completed: false,
            id: '1',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Code review for PR #123',
            description: 'Review the authentication module changes',
            todo_deadline: tomorrow,
            is_public: false,
            is_completed: true,
            id: '1',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Prepare presentation slides',
            description: 'Create slides for quarterly review meeting',
            todo_deadline: yesterday,
            is_public: true,
            is_completed: false,
            id: '1',
        },
    });

    // Alice's todos (developer focus)
    await prisma.todo.create({
        data: {
            title: 'Implement user authentication',
            description: 'Add OAuth2 integration for Google and GitHub',
            todo_deadline: nextWeek,
            is_public: true,
            is_completed: false,
            id: '2',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Fix database migration issues',
            description: 'Resolve conflicts in migration files',
            todo_deadline: tomorrow,
            is_public: true,
            is_completed: true,
            id: '2',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Learn Next.js 14 features',
            description: 'Study app router and server components',
            todo_deadline: nextMonth,
            is_public: false,
            is_completed: false,
            id: '2',
        },
    });

    // Bob's todos (manager focus)
    await prisma.todo.create({
        data: {
            title: 'Team performance review',
            description: 'Conduct quarterly performance reviews for team members',
            todo_deadline: nextWeek,
            is_public: true,
            is_completed: false,
            id: '3',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Budget planning for Q4',
            description: 'Prepare budget allocation for next quarter',
            todo_deadline: nextMonth,
            is_public: false,
            is_completed: false,
            id: '3',
        },
    });

    // Carol's todos (designer focus)
    await prisma.todo.create({
        data: {
            title: 'Design system documentation',
            description: 'Create comprehensive design system guide',
            todo_deadline: nextWeek,
            is_public: true,
            is_completed: false,
            id: '4',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Mobile app wireframes',
            description: 'Create wireframes for iOS and Android apps',
            todo_deadline: tomorrow,
            is_public: true,
            is_completed: true,
            id: '4',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'User interview analysis',
            description: 'Analyze findings from recent user interviews',
            todo_deadline: nextMonth,
            is_public: false,
            is_completed: false,
            id: '4',
        },
    });

    // Dave's todos (QA focus)
    await prisma.todo.create({
        data: {
            title: 'E2E test automation',
            description: 'Set up automated end-to-end testing pipeline',
            todo_deadline: nextWeek,
            is_public: true,
            is_completed: false,
            id: '5',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Performance testing report',
            description: 'Create detailed performance analysis report',
            todo_deadline: tomorrow,
            is_public: true,
            is_completed: true,
            id: '5',
        },
    });

    await prisma.todo.create({
        data: {
            title: 'Bug triage meeting prep',
            description: 'Prepare agenda and priority list for bug triage',
            todo_deadline: yesterday,
            is_public: false,
            is_completed: false,
            id: '5',
        },
    });

    console.log('Creating articles...');
    // Create sample articles
    await prisma.post.create({
        data: {
            title: 'Getting Started with Next.js 14',
            content: '# Getting Started with Next.js 14\n\nNext.js 14 introduces many exciting features including improved performance and developer experience.',
            author_id: '1',
        },
    });

    await prisma.post.create({
        data: {
            title: 'Design System Best Practices',
            content: '# Design System Best Practices\n\nBuilding a consistent design system is crucial for maintaining design consistency across products.',
            author_id: '4',
        },
    });

    console.log('Seed data created successfully!');
    console.log('Users: 5, Todos: 14, Articles: 2');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });