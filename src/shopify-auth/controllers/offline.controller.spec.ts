import Shopify from '@shopify/shopify-api';
import { Session } from '@shopify/shopify-api/dist/auth/session';
import { Request, Response } from 'express';
import { mocked } from 'ts-jest/utils';
import { ShopifyAuthModuleOptions } from '../interfaces';
import { ShopifyOfflineAuthController } from './offline.controller';

const TEST_SHOP = 'testing-shop.myshopify.com';
const TEST_HOST = `https://${TEST_SHOP}/admin`;

const options: ShopifyAuthModuleOptions = {
  basePath: 'shop',
};

const mockReq = {
  query: { shop: TEST_SHOP, host: TEST_HOST },
};
const mockRedirect = jest.fn();
const mockRes = {
  redirect: mockRedirect,
};
const req = mocked<Request>(mockReq as unknown as Request);
const res = mocked<Response>(mockRes as unknown as Response);

const authUrl = `https://${TEST_SHOP}/admin/authenticate`;

describe('ShopifyOfflineAuthController', () => {
  let beginAuthSpy: jest.SpyInstance;
  let validateAuthSpy: jest.SpyInstance;
  let controller: ShopifyOfflineAuthController;

  beforeEach(() => {
    controller = new ShopifyOfflineAuthController(options);
    beginAuthSpy = jest
      .spyOn(Shopify.Auth, 'beginAuth')
      .mockResolvedValue(authUrl);
    validateAuthSpy = jest
      .spyOn(Shopify.Auth, 'validateAuthCallback')
      .mockResolvedValue({} as unknown as Session);
  });

  afterEach(() => {
    mockRedirect.mockClear();
    beginAuthSpy.mockClear();
    validateAuthSpy.mockClear();
  });

  test('#auth', async () => {
    await controller.auth(TEST_SHOP, req, res);

    expect(beginAuthSpy).toHaveBeenCalledWith(
      req,
      res,
      TEST_SHOP,
      'shop/callback',
      false,
    );

    expect(mockRedirect).toHaveBeenCalledWith(authUrl);
  });

  test('#callback', async () => {
    await controller.callback(req, res);

    expect(validateAuthSpy).toHaveBeenCalledWith(req, res, {
      shop: TEST_SHOP,
      host: TEST_HOST,
    });

    expect(mockRedirect).toHaveBeenCalledWith(
      `/?shop=${TEST_SHOP}&host=${TEST_HOST}`,
    );
  });
});
