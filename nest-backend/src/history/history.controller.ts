import { Controller, Get, UseGuards, Request, Logger, Param, Delete } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('history')
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(private readonly historyService: HistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getHistory(@Request() req: any) {
    this.logger.log(`Fetching history for user: ${req.user.uid}`);
    return this.historyService.getUserHistory(req.user.uid);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getHistoryById(@Request() req: any, @Param('id') id: string) {
    this.logger.log(`Fetching history details for user: ${req.user.uid}, job: ${id}`);
    return this.historyService.getHistoryById(req.user.uid, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteHistory(@Request() req: any, @Param('id') id: string) {
    this.logger.log(`Deleting history for user: ${req.user.uid}, job: ${id}`);
    return this.historyService.deleteHistory(req.user.uid, id);
  }
}
