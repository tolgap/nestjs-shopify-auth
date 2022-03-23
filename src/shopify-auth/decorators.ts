import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { AUTH_MODE_KEY } from './constants';
import { ShopifyAuthExceptionFilter } from './exceptions';
import { ShopifyAuthGuard } from './guard';
import { AccessMode } from './interfaces';

export const Shop = createParamDecorator<
  unknown,
  ExecutionContext,
  Promise<string>
>(async (_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const res = ctx.switchToHttp().getResponse<Response>();

  const session = await Shopify.Utils.loadCurrentSession(req, res);
  return session.shop;
});

export const UseShopifyAuth = (accessMode?: AccessMode) =>
  applyDecorators(
    SetMetadata(AUTH_MODE_KEY, accessMode || AccessMode.Online),
    UseGuards(ShopifyAuthGuard),
    UseFilters(ShopifyAuthExceptionFilter),
  );
