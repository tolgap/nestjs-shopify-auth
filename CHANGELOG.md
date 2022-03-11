# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

# 2.0.0

### Fixed

- ⚠️ [Breaking] Rewrite GraphQL handler to not take over the entirety of the request and response.

  This removes the requirement of installing `body-parser` and disabling the `bodyParser` logic of NextJS just to use this package.

  Before:

  ```ts
  // main.ts
  import { NestFactory } from '@nestjs/core';
  import { json } from 'body-parser';
  import { AppModule } from './app.module';

  async function bootstrap() {
    const jsonParseMiddleware = json();
    const app = await NestFactory.create(AppModule, { bodyParser: false });
    app.use((req, res, next) => {
      // NOTE: Make sure this is the same `path` you pass to the `ShopifyAuthModule.registerOnlineAsync`.
      if (req.path.indexOf('/graphql') === 0) {
        next();
      } else {
        jsonParseMiddleware(req, res, next);
      }
    });

    await app.listen(3000);
  }
  bootstrap();
  ```

  After:

  ```ts
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
  }
  bootstrap();
  ```
