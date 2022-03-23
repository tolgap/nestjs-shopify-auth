import '../../test/test-helper';

import { ExecutionContext } from '@nestjs/common';
import { mocked } from 'ts-jest/utils';
import Shopify, { SessionInterface } from '@shopify/shopify-api';
import { ShopifyAuthGuard } from './guard';
import { ReauthHeaderException, ReauthRedirectException } from './exceptions';
import { Reflector } from '@nestjs/core';
import { AccessMode } from './interfaces';

const TEST_SHOP = 'testing-shop.myshopify.com';
const TEST_USER = '1';

let headers = {};
const query = {
  shop: TEST_SHOP,
};

const req = jest.fn().mockReturnValue({
  headers,
  query,
});
const res = jest.fn();
const mockExecutionContext = {
  getHandler: jest.fn(),
  getClass: jest.fn(),
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: req,
    getResponse: res,
  }),
};
const executionContext = mocked(
  mockExecutionContext as unknown as ExecutionContext,
  true,
);

const reflector = new Reflector();

const jwtToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rlc3Rpbmctc2hvcC5teXNob3BpZnkuY29tL2FkbWluIiwiZGVzdCI6Imh0dHBzOi8vdGVzdGluZy1zaG9wLm15c2hvcGlmeS5jb20iLCJhdWQiOiJmb28iLCJzdWIiOiIxIiwiZXhwIjo1MDAwMDAwMDAwMDAwLCJuYmYiOjEyMzQsImlhdCI6MTIzNCwianRpIjoiNDMyMSIsInNpZCI6ImFiYzEyMyJ9.eD6-h8ZBWckH0xOCMJ5818oAkR9uQ050uu_638X_lfI';

describe('ShopifyAuthGuard', () => {
  let jwtSessionId: string;
  let session: SessionInterface;
  let reflectorSpy: jest.SpyInstance;
  const guard = new ShopifyAuthGuard(reflector);

  beforeEach(() => {
    jwtSessionId = Shopify.Auth.getJwtSessionId(TEST_SHOP, TEST_USER);
    session = new Shopify.Session.Session(jwtSessionId, TEST_SHOP, '', true);
    session.scope = 'write_shipping';
    session.expires = new Date(5000000000000);
    session.accessToken = 'test_token';

    reflectorSpy = jest.spyOn(reflector, 'getAllAndOverride');
  });

  afterEach(() => {
    reflectorSpy.mockClear();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw ReauthRedirectException if no session found', async () => {
    reflectorSpy.mockReturnValue(AccessMode.Offline);

    await expect(guard.canActivate(executionContext)).rejects.toThrowError(
      ReauthRedirectException,
    );
  });

  it('should throw ReauthHeaderException if session auth token is empty', async () => {
    reflectorSpy.mockReturnValue(AccessMode.Online);

    session.accessToken = undefined;
    await Shopify.Utils.storeSession(session);

    headers = {
      authorization: `Bearer ${jwtToken}`,
    };
    req.mockClear();
    req.mockReturnValue({
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
      query,
    });

    await expect(guard.canActivate(executionContext)).rejects.toThrowError(
      ReauthHeaderException,
    );
  });

  it('should throw ReauthHeaderException if session is not found', async () => {
    reflectorSpy.mockReturnValue(AccessMode.Online);

    // we never call `Shopify.Utils.storeSession`
    headers = {
      authorization: `Bearer ${jwtToken}`,
    };
    req.mockClear();
    req.mockReturnValue({
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
      query,
    });

    await expect(guard.canActivate(executionContext)).rejects.toThrowError(
      ReauthHeaderException,
    );
  });

  it('should returns true when session is valid', async () => {
    reflectorSpy.mockReturnValue(AccessMode.Online);

    await Shopify.Utils.storeSession(session);

    headers = {
      authorization: `Bearer ${jwtToken}`,
    };
    req.mockClear();
    req.mockReturnValue({
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
      query,
    });

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);
  });
});
