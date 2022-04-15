import { Controller, Get, Inject, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ShopifyAuthModuleOptions } from '../interfaces';
import { SHOPIFY_AUTH_OFFLINE } from '../constants';
import { authHandler } from './authHandler';
import { callbackHandler } from './callbackHandler';
import { ApplicationConfig } from '@nestjs/core';

@Controller('shopify/offline')
export class ShopifyOfflineAuthController {
  constructor(
    @Inject(SHOPIFY_AUTH_OFFLINE)
    private options: ShopifyAuthModuleOptions,
    private appConfig: ApplicationConfig,
  ) {}

  @Get('auth')
  async auth(
    @Query('shop') domain: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await authHandler(
      req,
      res,
      domain,
      this.options,
      false,
      this.appConfig.getGlobalPrefix(),
    );
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    await callbackHandler(req, res, this.options);
  }
}
