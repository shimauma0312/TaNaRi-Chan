// Mock for @prisma/client
const mockPost = {
  findMany: jest.fn(),
  findUnique: jest.fn(), 
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaClient = jest.fn().mockImplementation(() => ({
  post: mockPost,
}));

module.exports = {
  PrismaClient: mockPrismaClient,
  mockPost,
};