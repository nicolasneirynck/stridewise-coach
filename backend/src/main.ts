import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<ServerConfig>);
  const port = config.get<number>('port')!;

  app.setGlobalPrefix('api');

  await app.listen(port);
}

bootstrap();
