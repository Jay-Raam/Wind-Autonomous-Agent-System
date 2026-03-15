import { createYoga } from 'graphql-yoga';
import type { Express } from 'express';
import { schema } from './schema.js';
import { buildGraphqlContext } from './context.js';

export function registerGraphql(app: Express): void {
  const yoga = createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    context: ({ request }) => {
      const req = (request as unknown as { req?: import('express').Request }).req;
      return buildGraphqlContext(req!);
    },
  });

  app.use('/graphql', yoga);
}
