import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { AccessMode, ShopifyAuthModuleAsyncOptions } from './interfaces';
import { createShopifyAuthAsyncOptionsProviders } from './providers';
import {
  ShopifyGraphQLController,
  ShopifyOnlineAuthController,
  ShopifyOfflineAuthController,
} from './controllers';
import { getShopifyAuthProviderToken } from './constants';

@Module({})
export class ShopifyAuthModule implements OnModuleInit {
  static registerOnlineAuthAsync(
    options: ShopifyAuthModuleAsyncOptions,
  ): Promise<DynamicModule> | DynamicModule {
    return {
      module: ShopifyAuthModule,
      global: true,
      imports: options.imports || [],
      providers: [
        ...(options.providers || []),
        ...createShopifyAuthAsyncOptionsProviders(options, AccessMode.Online),
      ],
      controllers: [ShopifyOnlineAuthController, ShopifyGraphQLController],
      exports: [getShopifyAuthProviderToken(AccessMode.Online)],
    };
  }

  static registerOfflineAuthAsync(
    options: ShopifyAuthModuleAsyncOptions,
  ): Promise<DynamicModule> | DynamicModule {
    return {
      module: ShopifyAuthModule,
      global: true,
      imports: options.imports || [],
      providers: [
        ...(options.providers || []),
        ...createShopifyAuthAsyncOptionsProviders(options, AccessMode.Offline),
      ],
      controllers: [ShopifyOfflineAuthController],
      exports: [getShopifyAuthProviderToken(AccessMode.Offline)],
    };
  }

  onModuleInit() {
    Shopify.Context.throwIfUninitialized();
  }
}
