import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from './config/configuration';
import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<ServerConfig>);
  const port = config.get<number>('port')!;

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // verwijdert de properties die niet in de DTO staan
      forbidNonWhitelisted: true, // gooit fout als er foute properties binnenkomen
      forbidUnknownValues: true, // gooit fout bij onbekende types/waarden
      transform: true, // zet inkomende JSON uit de body van request om naar instantie van DTO-klasse

      // Fouten formatteren zodat we mooi per parameter de fouten gegroepeerd zien
      // Zo is het voor de front-end makkelijker om bv. per inputveld de bijhorende error te tonen.
      exceptionFactory: (errors: ValidationError[] = []) => {
        const formattedErrors = errors.reduce(
          (acc, err) => {
            acc[err.property] = Object.values(err.constraints || {});
            return acc;
          },
          {} as Record<string, string[]>,
        );

        return new BadRequestException({
          details: { body: formattedErrors },
        });
      },
    }),
  );

  await app.listen(port);
}

bootstrap();
