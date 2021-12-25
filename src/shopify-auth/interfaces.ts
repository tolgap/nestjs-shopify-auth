import { ModuleMetadata, Type } from '@nestjs/common';
import { SessionInterface } from '@shopify/shopify-api';
import { IncomingMessage, ServerResponse } from 'http';

export enum AccessMode {
  Online = 'online',
  Offline = 'offline',
}

export interface ShopifyAuthModuleOptions {
  basePath?: string;
  afterAuthHandler?: ShopifyAuthAfterHandler;
}

export interface ShopifyAuthOptionsFactory {
  createShopifyAuthOptions():
    | Promise<ShopifyAuthModuleOptions>
    | ShopifyAuthModuleOptions;
}

export interface ShopifyAuthAfterHandler<
  T extends IncomingMessage = IncomingMessage,
  R extends ServerResponse = ServerResponse,
> {
  afterAuth(req: T, res: R, session: SessionInterface): Promise<void>;
}

export interface ShopifyAuthModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  useExisting?: Type<ShopifyAuthOptionsFactory>;
  useClass?: Type<ShopifyAuthOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<ShopifyAuthModuleOptions> | ShopifyAuthModuleOptions;
  inject?: any[];
}
