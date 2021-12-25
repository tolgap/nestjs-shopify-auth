import { Provider } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { AccessMode } from './interfaces';
import {
  getShopifyAuthProviderToken,
  getShopifyAuthControllerHackToken,
} from './constants';
import {
  ShopifyAuthModuleAsyncOptions,
  ShopifyAuthOptionsFactory,
  ShopifyAuthModuleOptions,
} from './interfaces';
import {
  ShopifyOnlineAuthController,
  ShopifyOfflineAuthController,
} from './controllers';

export function createShopifyAuthAsyncOptionsProviders(
  options: ShopifyAuthModuleAsyncOptions,
  accessMode: AccessMode,
): Provider[] {
  if (options.useExisting || options.useFactory) {
    return [
      createShopifyAuthAsyncOptionsProvider(options, accessMode),
      createShopifyAuthControllerPathProvider(accessMode),
    ];
  }

  if (options.useClass) {
    return [
      createShopifyAuthAsyncOptionsProvider(options, accessMode),
      { provide: options.useClass, useClass: options.useClass },
    ];
  }

  throw new Error(
    'Invalid ShopifyAuth options: one of `useClass`, `useExisting` or `useFactory` should be defined.',
  );
}

export function createShopifyAuthAsyncOptionsProvider(
  options: ShopifyAuthModuleAsyncOptions,
  accessMode: AccessMode,
): Provider {
  if (options.useFactory) {
    return {
      provide: getShopifyAuthProviderToken(accessMode),
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }

  const inject = [];

  if (options.useClass || options.useExisting) {
    inject.push(options.useClass ?? options.useExisting);
  }

  return {
    provide: getShopifyAuthProviderToken(accessMode),
    useFactory: async (optionsFactory: ShopifyAuthOptionsFactory) =>
      await optionsFactory.createShopifyAuthOptions(),
    inject,
  };
}

export function createShopifyAuthControllerPathProvider(
  accessMode: AccessMode,
): Provider {
  let controller:
    | typeof ShopifyOnlineAuthController
    | typeof ShopifyOfflineAuthController = ShopifyOnlineAuthController;

  if (accessMode === AccessMode.Offline) {
    controller = ShopifyOfflineAuthController;
  }

  return {
    provide: getShopifyAuthControllerHackToken(accessMode),
    useFactory: (options: ShopifyAuthModuleOptions) => {
      if (options.basePath) {
        Reflect.defineMetadata(PATH_METADATA, options.basePath, controller);
      }
    },
    inject: [getShopifyAuthProviderToken(accessMode)],
  };
}
