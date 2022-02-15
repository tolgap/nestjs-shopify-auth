import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SHOPIFY_AUTH_OFFLINE, SHOPIFY_AUTH_ONLINE } from './constants';
import { ShopifyAuthModuleOptions } from './interfaces';

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
    @Optional()
    @Inject(SHOPIFY_AUTH_ONLINE)
    private onlineOptions: ShopifyAuthModuleOptions,
    @Optional()
    @Inject(SHOPIFY_AUTH_OFFLINE)
    private offlineOptions: ShopifyAuthModuleOptions,
  ) {}

  catch(exception: ShopifyAuthException, host: ArgumentsHost) {
    const context = host.switchToHttp();

    const req = context.getRequest<Request>();
    const res = context.getResponse<Response>();

    const domain = `https://${req.hostname}`;

    if (exception instanceof ReauthHeaderException) {
      const status = exception.getStatus();
      const basePath = this.onlineOptions?.basePath || '';
      const baseUrl = new URL(basePath, domain).href;
      const authUrl = `${baseUrl}/auth?shop=${exception.shop}`;
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
      const basePath = this.offlineOptions?.basePath || '';
      const baseUrl = new URL(basePath, domain).href;
      const authUrl = `${baseUrl}/auth?shop=${exception.shop}`;
      res.redirect(authUrl);
    } else {
      res.json({
        message: 'No session found',
      });
    }
  }
}
