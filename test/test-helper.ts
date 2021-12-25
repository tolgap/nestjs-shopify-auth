import Shopify, { ApiVersion } from '@shopify/shopify-api';
import { MemorySessionStorage } from '@shopify/shopify-api/dist/auth/session';

beforeAll(() => {
  Shopify.Context.initialize({
    API_KEY: 'foo',
    API_SECRET_KEY: 'bar',
    SCOPES: ['write_shipping'],
    API_VERSION: ApiVersion.Unstable,
    HOST_NAME: 'localhost:8082',
    IS_EMBEDDED_APP: true,
    SESSION_STORAGE: new MemorySessionStorage(),
  });
  Shopify.Context.USER_AGENT_PREFIX = undefined;
});
