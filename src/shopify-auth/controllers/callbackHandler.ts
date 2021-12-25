import Shopify, { AuthQuery } from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { ShopifyAuthModuleOptions } from '../interfaces';

export async function callbackHandler(
  req: Request,
  res: Response,
  options: ShopifyAuthModuleOptions,
) {
  const query = req.query as unknown as AuthQuery;
  const session = await Shopify.Auth.validateAuthCallback(req, res, query);

  if (session) {
    if (options.afterAuthHandler) {
      await options.afterAuthHandler.afterAuth(req, res, session);
      return;
    }

    res.redirect(`/?shop=${query.shop}&host=${query.host}`);
    return;
  }

  res.sendStatus(401);
}
