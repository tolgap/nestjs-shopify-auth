import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { AccessMode, ShopifyAuthModuleAsyncOptions } from './interfaces';
import { createShopifyAuthAsyncOptionsProviders } from './providers';
import {
  ShopifyGraphQLController,
  ShopifyOnlineAuthController,
  ShopifyOfflineAuthController,
} from './controllers';

@Module({})
export class ShopifyAuthModule implements OnModuleInit {
  static registerOnlineAuthAsync(
    options: ShopifyAuthModuleAsyncOptions,
  ): Promise<DynamicModule> | DynamicModule {
    return {
      module: ShopifyAuthModule,
      imports: options.imports || [],
      providers: [
        ...(options.providers || []),
        ...createShopifyAuthAsyncOptionsProviders(options, AccessMode.Online),
      ],
      controllers: [ShopifyOnlineAuthController, ShopifyGraphQLController],
    };
  }

  static registerOfflineAuthAsync(
    options: ShopifyAuthModuleAsyncOptions,
  ): Promise<DynamicModule> | DynamicModule {
    return {
      module: ShopifyAuthModule,
      imports: options.imports || [],
      providers: [
        ...(options.providers || []),
        ...createShopifyAuthAsyncOptionsProviders(options, AccessMode.Offline),
      ],
      controllers: [ShopifyOfflineAuthController],
    };
  }

  onModuleInit() {
    Shopify.Context.throwIfUninitialized();
  }
}
