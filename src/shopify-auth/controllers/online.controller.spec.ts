import { ApplicationConfig } from '@nestjs/core';
import Shopify from '@shopify/shopify-api';
import { Session } from '@shopify/shopify-api/dist/auth/session';
import { Request, Response } from 'express';
import { mocked } from 'ts-jest/utils';
import { ShopifyAuthModuleOptions } from '../interfaces';
import { ShopifyOnlineAuthController } from './online.controller';

const TEST_SHOP = 'testing-shop.myshopify.com';
const TEST_HOST = 'testing-shop.myshopify.com/admin';

const options: ShopifyAuthModuleOptions = {
  basePath: 'user',
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

describe('ShopifyOnlineAuthController', () => {
  let beginAuthSpy: jest.SpyInstance;
  let validateAuthSpy: jest.SpyInstance;
  let controller: ShopifyOnlineAuthController;
  const appConfig = new ApplicationConfig();

  beforeEach(() => {
    controller = new ShopifyOnlineAuthController(options, appConfig);
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
      '/user/callback',
      true,
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
