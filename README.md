# nestjs-shopify-auth

[![Node.js CI](https://github.com/tolgap/nestjs-shopify-auth/actions/workflows/node.js.yml/badge.svg)](https://github.com/tolgap/nestjs-shopify-auth/actions/workflows/node.js.yml)

An OAuth setup for NestJS using Shopify's [`shopify-node-api`] package. Allows for online and offline auth using this module. Also adds a GraphQL proxy so you can use online tokens to proxy your GraphQL requests to Shopify, without exposing your Shopify Admin access token to the frontend.

## Installation

Install package using NPM:

```
npm install @shopify/shopify-api nestjs-shopify-auth
```

or using Yarn:

```
yarn add @shopify/shopify-api nestjs-shopify-auth
```

Make sure you have your Shopify context initialized, [as required in `@shopify/shopify-api`](https://github.com/Shopify/shopify-node-api/blob/main/docs/getting_started.md#set-up-context). You can use the following package to do this is a neat way in NestJS that I've developed as well:

```
npm install shopify-nestjs-api
```

See usage: https://github.com/tolgap/shopify-nestjs-api .

## Usage

From any module, import the `ShopifyAuthModule` using `registerOnlineAuthAsync` and/or `registerOfflineAuthAsync`:

```ts
// app.module.ts
@Module({
  imports: [
    ShopifyAuthModule.registerOnlineAuthAsync({
      useFactory: () => ({
        basePath: 'user',
      }),
    }),
  ],
})
export class AppModule {}
```

You can provide an injectable that can handle the redirection or any other setup you want after an offline or online auth was successful:

```ts
// my-shopify-auth.handler.ts
@Injectable()
export class MyShopifyAuthHandler implements ShopifyAuthAfterHandler {
  async afterAuth(req: Request, res: Response, session: SessionInterface) {
    // implement your logic after a successful auth.
    // you can check `session.isOnline` to see if it was an online auth or offline auth.
  }
}
```

and provide and inject it to your `ShopifyAuthModule`:

```ts
// app.module.ts
import { MyShopifyAuthHandler } from './my-shopify-auth.handler';

@Module({
  imports: [
    ShopifyAuthModule.registerOnlineAuthAsync({
      useFactory: (afterAuthHandler: MyShopifyAuthHandler) => ({
        basePath: 'user',
        afterAuthHandler,
      }),
      provide: [MyShopifyAuthHandler]
      inject: [MyShopifyAuthHandler],
    }),
  ],
})
export class AppModule {}
```

You can also use `useClass` and `useExisting` to register the `ShopifyAuthModule`. You can even register both auth modes using the same Module:

```ts
// app.module.ts
import { MyShopifyAuthHandler } from './my-shopify-auth.handler';

@Module({
  imports: [
    ShopifyAuthModule.registerOnlineAuthAsync({
      useFactory: (afterAuthHandler: MyShopifyAuthHandler) => ({
        basePath: 'user',
        afterAuthHandler,
      }),
      provide: [MyShopifyAuthHandler]
      inject: [MyShopifyAuthHandler],
    }),
    ShopifyAuthModule.registerOfflineAuthAsync({
      useFactory: (afterAuthHandler: MyShopifyAuthHandler) => ({
        basePath: 'shop',
        afterAuthHandler,
      }),
      provide: [MyShopifyAuthHandler]
      inject: [MyShopifyAuthHandler],
    }),
  ],
})
export class AppModule {}
```

Now, if you want to install an App and store the offline access token in your DB, or Redis, or whatever storage you prefer, just visit `/shop/auth?shop=<yourshopname>.myshopify.com`. And if you want to create short-lived online access token, for instance, to only perform one-off requests to Shopify Admin GraphQL, you can visit `/user/auth?shop=<yourshopname>.myshopify.com`.

## GraphQL proxy

This module automatically attaches a GraphQL endpoint to `/graphql` if you register online auth. You will need valid online auth tokens to make use of it.
