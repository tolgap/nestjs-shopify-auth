import './test-helper';

import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, Injectable } from '@nestjs/common';
import { ShopifyAuthAfterHandler, ShopifyAuthModule } from '../src';
import Shopify, { SessionInterface } from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { Session } from '@shopify/shopify-api/dist/auth/session';
import { AuthScopes } from '@shopify/shopify-api/dist/auth/scopes';

const TEST_SHOP = 'testing-shop.myshopify.com';
const nonce = '888491362182521';

const onlineSession = new Shopify.Session.Session(
  'online_test_session',
  TEST_SHOP,
  nonce,
  true,
);
onlineSession.shop = TEST_SHOP;
onlineSession.isOnline = true;
onlineSession.scope = 'write_shipping';
onlineSession.accessToken = 'foobar';

const offlineSession = new Shopify.Session.Session(
  'offline_test_session',
  TEST_SHOP,
  nonce,
  false,
);
offlineSession.shop = TEST_SHOP;
offlineSession.isOnline = false;
offlineSession.scope = 'write_shipping';
offlineSession.accessToken = 'foocrux';

@Injectable()
class AfterAuthHandler implements ShopifyAuthAfterHandler {
  async afterAuth(
    _req: Request,
    res: Response,
    session: SessionInterface,
  ): Promise<void> {
    if (session.isOnline) {
      res.redirect(`/?shop=${session.shop}&access-mode=online`);
      return;
    }

    res.redirect(`/?shop=${session.shop}&access-mode=offline`);
  }
}

describe('ShopifyAuthModule', () => {
  let app: INestApplication;
  let beginAuthSpy: jest.SpyInstance;
  let validateAuthSpy: jest.SpyInstance;

  beforeEach(() => {
    beginAuthSpy = jest.spyOn(Shopify.Auth, 'beginAuth');
    validateAuthSpy = jest.spyOn(Shopify.Auth, 'validateAuthCallback');
  });

  afterEach(() => {
    beginAuthSpy.mockClear();
    validateAuthSpy.mockClear();
  });

  describe('#registerOnlineAuthAsync', () => {
    const authRedirectUrl =
      `https://${TEST_SHOP}` +
      '/admin/oauth/authorize' +
      '?client_id=foo' +
      '&scope=write_shipping' +
      '&redirect_uri=https%3A%2F%2Flocalhost%3A8082user%2Fcallback' +
      `&state=${nonce}` +
      '&grant_options%5B%5D=per-user';

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ShopifyAuthModule.registerOnlineAuthAsync({
            useFactory: async (afterAuthHandler: AfterAuthHandler) => ({
              basePath: 'user',
              afterAuthHandler,
            }),
            providers: [AfterAuthHandler],
            inject: [AfterAuthHandler],
          }),
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    test('/GET /user/auth', async () => {
      beginAuthSpy.mockResolvedValue(authRedirectUrl);

      const res = await request(app.getHttpServer())
        .get('/user/auth')
        .query({ shop: TEST_SHOP })
        .expect(302);

      expect(res.headers.location).toEqual(authRedirectUrl);
    });

    test('/GET /user/callback', async () => {
      validateAuthSpy.mockResolvedValue(onlineSession);

      const res = await request(app.getHttpServer())
        .get('/user/callback')
        .query({
          shop: TEST_SHOP,
          state: nonce,
          code: 'foobar',
          hmac: 'abc',
        })
        .expect(302);

      const redirectUrl = `/?shop=${TEST_SHOP}&access-mode=online`;

      expect(res.headers.location).toEqual(redirectUrl);
    });

    describe('POST /graphql', () => {
      let graphqlSpy: jest.SpyInstance;

      beforeEach(() => {
        graphqlSpy = jest
          .spyOn(Shopify.Utils, 'graphqlProxy')
          .mockImplementation((_req, res) => {
            res.statusCode = 201;
            res.end();
            return Promise.resolve();
          });
      });

      afterEach(() => {
        graphqlSpy.mockClear();
      });

      test('rejects without session', async () => {
        await request(app.getHttpServer()).post('/graphql').expect(403);
      });

      describe('with session', () => {
        let sessionSpy: jest.SpyInstance;

        beforeEach(() => {
          sessionSpy = jest
            .spyOn(Shopify.Utils, 'loadCurrentSession')
            .mockResolvedValue({
              scope: new AuthScopes(['write_shipping']),
              accessToken: 'foobar',
              expires: new Date().valueOf() + 5000,
            } as unknown as Session);
        });

        afterEach(() => {
          sessionSpy.mockClear();
        });

        test('passes request to graphql proxy', async () => {
          await request(app.getHttpServer()).post('/graphql').expect(201);

          expect(graphqlSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('#registerOfflineAuthAsync', () => {
    const authRedirectUrl =
      `https://${TEST_SHOP}` +
      '/admin/oauth/authorize' +
      '?client_id=foo' +
      '&scope=write_shipping' +
      '&redirect_uri=https%3A%2F%2Flocalhost%3A8082shop%2Fcallback' +
      `&state=${nonce}`;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ShopifyAuthModule.registerOfflineAuthAsync({
            useFactory: async (afterAuthHandler: AfterAuthHandler) => ({
              basePath: 'shop',
              afterAuthHandler,
            }),
            providers: [AfterAuthHandler],
            inject: [AfterAuthHandler],
          }),
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    test('/GET /shop/auth', async () => {
      beginAuthSpy.mockResolvedValue(authRedirectUrl);

      const res = await request(app.getHttpServer())
        .get('/shop/auth')
        .query({ shop: TEST_SHOP })
        .expect(302);

      expect(res.headers.location).toEqual(authRedirectUrl);
    });

    test('/GET /shop/callback', async () => {
      validateAuthSpy.mockResolvedValue(offlineSession);

      const res = await request(app.getHttpServer())
        .get('/shop/callback')
        .query({
          shop: TEST_SHOP,
          state: nonce,
          code: 'foobar',
          hmac: 'abc',
        })
        .expect(302);

      const redirectUrl = `/?shop=${TEST_SHOP}&access-mode=offline`;

      expect(res.headers.location).toEqual(redirectUrl);
    });
  });
});
