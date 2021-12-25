import {
  Controller,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { ShopifyAuthExceptionFilter } from '../exceptions';
import { ShopifyAuthGuard } from '../guard';

@Controller('graphql')
export class ShopifyGraphQLController {
  @Post()
  @UseFilters(ShopifyAuthExceptionFilter)
  @UseGuards(ShopifyAuthGuard)
  async graphql(@Req() req: Request, @Res() res: Response) {
    await Shopify.Utils.graphqlProxy(req, res);
  }
}
