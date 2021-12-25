import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';

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
