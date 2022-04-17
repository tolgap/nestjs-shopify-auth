# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

# Unreleased

### Fixed

- Fixed callback url joining when no global prefix, or empty global prefix was used

# 2.1.1

### Fixed

- Global prefix is now respected when generating callback URL when redirecting to OAuth screen

# 2.1.0

### Added

- Add metadata to figure out AccessMode of a controller
- Add `@UseShopifyAuth` decorator for usage in controllers to check for Online or Offline sessions

### Other

- Refactoring to simplify `ShopfiyAuthExceptionFilter` testing

# 2.0.1

### Fixed

- Remove console.log statement cluttering the log output
- Remove old explainer from README regarding `bodyParser` usage

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
