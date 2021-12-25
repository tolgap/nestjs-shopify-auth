import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { ReauthHeaderException, ReauthRedirectException } from './exceptions';

@Injectable()
export class ShopifyAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const session = await Shopify.Utils.loadCurrentSession(req, res);

    if (session) {
      const scopesChanged = !Shopify.Context.SCOPES.equals(session.scope);

      if (
        !scopesChanged &&
        session.accessToken &&
        (!session.expires || new Date(session.expires) >= new Date())
      ) {
        return true;
      }
    }

    const authHeader: string | undefined =
      Shopify.Context.IS_EMBEDDED_APP && req.headers.authorization;
    let shop: string | undefined = undefined;

    if (authHeader) {
      if (session) {
        shop = session.shop;
      } else if (authHeader) {
        const matches = authHeader?.match(/Bearer (.*)/);
        if (matches) {
          const payload = Shopify.Utils.decodeSessionToken(matches[1]);
          shop = payload.dest.replace('https://', '');
        }
      }

      if (shop) {
        throw new ReauthHeaderException(shop);
      }
    } else if (req.query.shop) {
      shop = req.query.shop.toString() || process.env.SHOP;

      throw new ReauthRedirectException(shop);
    }

    return false;
  }
}
