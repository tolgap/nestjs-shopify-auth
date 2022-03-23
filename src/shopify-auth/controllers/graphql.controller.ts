import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { UseShopifyAuth } from '../decorators';

@Controller('graphql')
export class ShopifyGraphQLController {
  @Post()
  @UseShopifyAuth()
  async graphql(@Req() req: Request, @Res() res: Response) {
    const session = await Shopify.Utils.loadCurrentSession(req, res);

    if (!session) {
      throw new UnauthorizedException('Cannot proxy query. No session found.');
    }

    const { shop, accessToken } = session;
    if (!accessToken) {
      throw new UnauthorizedException(
        'Cannot proxy query. Session not authenticated.',
      );
    }

    const data = req.body;
    const client = new Shopify.Clients.Graphql(shop, accessToken);
    const response = await client.query({
      data,
    });

    res.status(200).send(response.body);
  }
}
