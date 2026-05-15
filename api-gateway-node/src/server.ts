import { buildApp } from './app';
import { env } from './config/env';
import { db } from './config/database';

async function main(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`📖 Swagger UI → http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    await db.$disconnect();
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`${signal} received — shutting down gracefully`);
    await app.close();
    await db.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
