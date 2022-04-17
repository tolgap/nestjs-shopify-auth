import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { ShopifyAuthModuleOptions } from '../interfaces';
import { joinUrl } from '../utils/join-url.util';

export async function authHandler(
  req: Request,
  res: Response,
  domain: string,
  options: ShopifyAuthModuleOptions,
  isOnline = true,
  globalPrefix = '',
) {
  const { basePath } = options;

  const redirectUrl = joinUrl(globalPrefix, basePath, 'callback');

  const oauthUrl = await Shopify.Auth.beginAuth(
    req,
    res,
    domain,
    redirectUrl,
    isOnline,
  );

  res.redirect(oauthUrl);
}
