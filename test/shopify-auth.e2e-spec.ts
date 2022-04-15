import './test-helper';

import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, Injectable } from '@nestjs/common';
import { ShopifyAuthAfterHandler, ShopifyAuthModule } from '../src';
import Shopify, { SessionInterface } from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { Session } from '@shopify/shopify-api/dist/auth/session';
import { AuthScopes } from '@shopify/shopify-api/dist/auth/scopes';

const mockQuery = jest.fn();

jest.mock('@shopify/shopify-api/dist/clients/graphql', () => ({
  __esModule: true,
  GraphqlClient: class MockGraphqlClient {
    constructor(readonly domain: string, readonly accessToken: string) {}

    query = mockQuery;
  },
}));

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
      test('rejects without session', async () => {
        await request(app.getHttpServer()).post('/graphql').expect(403);
      });

      describe('with session', () => {
        let sessionSpy: jest.SpyInstance;
        const successResponse = {
          data: {
            shop: {
              name: 'Shop',
            },
          },
        };
        const shopQuery = `{
          shop {
            name
          }
        }`;
        const objectQuery = {
          query: shopQuery,
          variables: `{
            foo: bar
          }`,
        };

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
          mockQuery.mockReset();
        });

        test('passes request to graphql proxy', async () => {
          mockQuery.mockResolvedValue({
            body: JSON.stringify(successResponse),
          });

          const response = await request(app.getHttpServer())
            .post('/graphql')
            .send(objectQuery)
            .set('Content-Type', 'application/json')
            .expect(200);

          expect(JSON.parse(response.text)).toEqual(successResponse);
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
      '&redirect_uri=https%3A%2F%2Flocalhost%3A8082%2Fshopify%2Fshop%2Fcallback' +
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
      app.setGlobalPrefix('shopify');
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    test('/GET /shopify/shop/auth', async () => {
      beginAuthSpy.mockResolvedValue(authRedirectUrl);

      const res = await request(app.getHttpServer())
        .get('/shopify/shop/auth')
        .query({ shop: TEST_SHOP })
        .expect(302);

      expect(res.headers.location).toEqual(authRedirectUrl);
    });

    test('/GET /shopify/shop/callback', async () => {
      validateAuthSpy.mockResolvedValue(offlineSession);

      const res = await request(app.getHttpServer())
        .get('/shopify/shop/callback')
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
