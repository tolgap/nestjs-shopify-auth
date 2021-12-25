import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { ShopifyAuthModuleOptions } from '../interfaces';

export async function authHandler(
  req: Request,
  res: Response,
  domain: string,
  options: ShopifyAuthModuleOptions,
  isOnline = true,
) {
  const { basePath } = options;
  const redirectUrl = `${basePath}/callback`;

  const oauthUrl = await Shopify.Auth.beginAuth(
    req,
    res,
    domain,
    redirectUrl,
    isOnline,
  );

  res.redirect(oauthUrl);
}
