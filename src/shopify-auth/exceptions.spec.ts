import { ModuleRef } from '@nestjs/core';
import { SHOPIFY_AUTH_OFFLINE, SHOPIFY_AUTH_ONLINE } from './constants';
import {
  ReauthHeaderException,
  ReauthRedirectException,
  ShopifyAuthExceptionFilter,
} from './exceptions';
import { ShopifyAuthModuleOptions } from './interfaces';

const TEST_SHOP = 'testing-shop.myshopify.com';

const onlineOptions: ShopifyAuthModuleOptions = {
  basePath: 'user',
};
const offlineOptions: ShopifyAuthModuleOptions = {
  basePath: 'shop',
};

const mockStatus = jest.fn().mockReturnThis();
const mockSetHeader = jest.fn().mockReturnThis();
const mockJson = jest.fn().mockReturnThis();
const mockRedirect = jest.fn().mockReturnThis();

const mockGetResponse = jest.fn().mockImplementation(() => ({
  status: mockStatus,
  setHeader: mockSetHeader,
  json: mockJson,
  redirect: mockRedirect,
}));
const mockGetRequest = jest.fn().mockImplementation(() => ({
  hostname: 'localhost',
}));

const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
  getRequest: mockGetRequest,
  getResponse: mockGetResponse,
}));

const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

const moduleRef = {
  get: jest.fn().mockImplementation((token: string) => {
    if (token === SHOPIFY_AUTH_ONLINE) {
      return onlineOptions;
    } else if (token === SHOPIFY_AUTH_OFFLINE) {
      return offlineOptions;
    } else {
      throw new Error('Unknown token asked from exception filter');
    }
  }),
};

describe('ShopifyAuthExceptionFilter', () => {
  const filter = new ShopifyAuthExceptionFilter(
    moduleRef as unknown as ModuleRef,
  );

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  afterEach(() => {
    mockStatus.mockClear();
    mockSetHeader.mockClear();
    mockJson.mockClear();
    mockRedirect.mockClear();
  });

  describe('online auth', () => {
    beforeEach(() => {
      const exception = new ReauthHeaderException(TEST_SHOP);
      filter.catch(exception, mockArgumentsHost);
    });

    it('should have status 401', () => {
      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should contain headers to reauthorize', () => {
      expect(mockSetHeader.mock.calls).toEqual([
        ['X-Shopify-Api-Request-Failure-Reauthorize', '1'],
        [
          'X-Shopify-API-Request-Failure-Reauthorize-Url',
          `https://localhost/user/auth?shop=${TEST_SHOP}`,
        ],
      ]);
    });
  });

  describe('offline auth', () => {
    beforeEach(() => {
      const exception = new ReauthRedirectException(TEST_SHOP);
      filter.catch(exception, mockArgumentsHost);
    });

    it('should redirect to offline auth', () => {
      expect(mockRedirect).toHaveBeenCalledWith(
        `https://localhost/shop/auth?shop=${TEST_SHOP}`,
      );
    });

    it('should not set custom headers', () => {
      expect(mockSetHeader).not.toHaveBeenCalled();
    });
  });
});
