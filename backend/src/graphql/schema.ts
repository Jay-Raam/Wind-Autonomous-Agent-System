import { createSchema } from 'graphql-yoga';
import { TaskRepository } from '../repositories/task.repository.js';
import { TaskService } from '../services/task.service.js';
import { AppError } from '../utils/errors.js';
import type { GraphqlContext } from './context.js';

const taskRepository = new TaskRepository();
const taskService = new TaskService();

export const schema = createSchema<GraphqlContext>({
  typeDefs: /* GraphQL */ `
    type Task {
      id: ID!
      userId: ID!
      status: String!
      input: String!
      result: String
      error: String
      createdAt: String!
      updatedAt: String!
    }

    type Query {
      meTasks: [Task!]!
      task(id: ID!): Task
    }

    type Mutation {
      createTask(input: String!): Task!
    }
  `,
  resolvers: {
    Query: {
      meTasks: async (_parent, _args, ctx) => {
        if (!ctx.userId) {
          throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        return taskRepository.listByUser(ctx.userId);
      },
      task: async (_parent, args: { id: string }, ctx) => {
        if (!ctx.userId) {
          throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const task = await taskRepository.findById(args.id);

        if (!task || task.userId.toString() !== ctx.userId) {
          return null;
        }

        return task;
      },
    },
    Mutation: {
      createTask: async (_parent, args: { input: string }, ctx) => {
        if (!ctx.userId) {
          throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        return taskService.createTask(ctx.userId, { input: args.input });
      },
    },
    Task: {
      id: (task: { id: string }) => task.id,
      userId: (task: { userId: { toString: () => string } }) => task.userId.toString(),
    },
  },
});
