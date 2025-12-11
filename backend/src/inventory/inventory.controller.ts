import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('my')
  async getMyInventory(@CurrentUser() user: any) {
    return this.inventoryService.getUserInventory(user.id);
  }

  @Post('add')
  async addItem(
    @CurrentUser() user: any,
    @Body() data: { skinId: number; rarity?: string },
  ) {
    return this.inventoryService.addItem(user.id, data.skinId, data.rarity);
  }

  @Post(':id/toggle-equip')
  async toggleEquip(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.inventoryService.toggleEquip(user.id, parseInt(id));
  }

  @Post(':id/repair')
  async repairItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { repairType: 'PARTIAL' | 'FULL' },
  ) {
    return this.inventoryService.repairItem(user.id, parseInt(id), data.repairType);
  }
}

