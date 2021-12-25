import { AccessMode } from './interfaces';

export const SHOPIFY_AUTH_ONLINE = 'SHOPIFY_AUTH_ONLINE';
export const SHOPIFY_AUTH_OFFLINE = 'SHOPIFY_AUTH_OFFLINE';

export const SHOPIFY_AUTH_ONLINE_CONTROLLER_HACK =
  'SHOPIFY_AUTH_ONLINE_CONTROLLER_HACK';
export const SHOPIFY_AUTH_OFFLINE_CONTROLLER_HACK =
  'SHOPIFY_AUTH_OFFLINE_CONTROLLER_HACK';

export const getShopifyAuthProviderToken = (accessMode: AccessMode) => {
  return accessMode !== AccessMode.Offline
    ? SHOPIFY_AUTH_ONLINE
    : SHOPIFY_AUTH_OFFLINE;
};

export const getShopifyAuthControllerHackToken = (accessMode: AccessMode) => {
  return accessMode !== AccessMode.Offline
    ? SHOPIFY_AUTH_ONLINE_CONTROLLER_HACK
    : SHOPIFY_AUTH_OFFLINE_CONTROLLER_HACK;
};
