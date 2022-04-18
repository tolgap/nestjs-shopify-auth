import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationConfig, ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { SHOPIFY_AUTH_OFFLINE, SHOPIFY_AUTH_ONLINE } from './constants';
import { ShopifyAuthModuleOptions } from './interfaces';
import { joinUrl } from './utils/join-url.util';

export class ShopifyAuthException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ReauthHeaderException extends ShopifyAuthException {
  constructor(public shop: string) {
    super('Reauthorization Required (See Headers)');
  }
}
export class ReauthRedirectException extends ShopifyAuthException {
  constructor(public shop: string) {
    super('Reauthorization Required (See Redirect)');
  }
}

@Catch(ShopifyAuthException)
export class ShopifyAuthExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly appConfig: ApplicationConfig,
  ) {}

  catch(exception: ShopifyAuthException, host: ArgumentsHost) {
    const context = host.switchToHttp();

    const req = context.getRequest<Request>();
    const res = context.getResponse<Response>();

    const domain = `https://${req.hostname}`;

    if (exception instanceof ReauthHeaderException) {
      const onlineOptions = this.moduleRef.get<ShopifyAuthModuleOptions>(
        SHOPIFY_AUTH_ONLINE,
        { strict: false },
      );

      const status = exception.getStatus();
      const prefix = this.appConfig.getGlobalPrefix();
      const basePath = onlineOptions.basePath || '';
      const authPath = `auth?shop=${exception.shop}`;
      const redirectPath = joinUrl(prefix, basePath, authPath);
      const authUrl = new URL(redirectPath, domain).toString();

      res
        .status(status)
        .setHeader('X-Shopify-Api-Request-Failure-Reauthorize', '1')
        .setHeader('X-Shopify-API-Request-Failure-Reauthorize-Url', authUrl)
        .json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          message: exception.message,
        });
    } else if (exception instanceof ReauthRedirectException) {
      const offlineOptions = this.moduleRef.get<ShopifyAuthModuleOptions>(
        SHOPIFY_AUTH_OFFLINE,
        { strict: true },
      );

      const prefix = this.appConfig.getGlobalPrefix();
      const basePath = offlineOptions.basePath || '';
      const authPath = `auth?shop=${exception.shop}`;
      const redirectPath = joinUrl(prefix, basePath, authPath);
      const authUrl = new URL(redirectPath, domain).toString();

      res.redirect(authUrl);
    } else {
      res.json({
        message: 'No session found',
      });
    }
  }
}
