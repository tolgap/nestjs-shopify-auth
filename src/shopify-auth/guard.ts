import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { AUTH_MODE_KEY } from './constants';
import { ReauthHeaderException, ReauthRedirectException } from './exceptions';
import { AccessMode } from './interfaces';

@Injectable()
export class ShopifyAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const requiredAccessMode = this.reflector.getAllAndOverride<AccessMode>(
      AUTH_MODE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    const isOnline = requiredAccessMode === AccessMode.Online;
    const session = await Shopify.Utils.loadCurrentSession(req, res, isOnline);

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
    } else if (!isOnline) {
      shop = req.query.shop?.toString() || process.env.SHOP;

      if (shop) {
        throw new ReauthRedirectException(shop);
      }
    }

    return false;
  }
}
