import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // register adapter
  app.useWebSocketAdapter(new WsAdapter(app) as any);

  await app.listen(parseInt(process.env['PORT'] , 10) || 3000);
}
bootstrap();
