// apps/api/src/dashboard/dashboard.controller.ts

// Dashboard HTTP endpoints.
// All routes are protected by the global JWT guard.

import { Controller, Get, Query } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import {
  dashboardLimitQuerySchema,
  dashboardChartQuerySchema,
  type DashboardLimitQuery,
  type DashboardChartQuery,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /api/dashboard/stats
  @Get('stats')
  async stats() {
    const stats = await this.dashboardService.getStats();
    return { stats };
  }

  // GET /api/dashboard/recent-activity?limit=10
  @Get('recent-activity')
  async recentActivity(
    @Query(new ZodValidationPipe(dashboardLimitQuerySchema))
    query: DashboardLimitQuery,
  ) {
    const items = await this.dashboardService.getRecentActivity(query.limit);
    return { items };
  }

  // GET /api/dashboard/low-stock?limit=10
  @Get('low-stock')
  async lowStock(
    @Query(new ZodValidationPipe(dashboardLimitQuerySchema))
    query: DashboardLimitQuery,
  ) {
    const items = await this.dashboardService.getLowStock(query.limit);
    return { items };
  }

  // GET /api/dashboard/sales-chart?days=7
  @Get('sales-chart')
  async salesChart(
    @Query(new ZodValidationPipe(dashboardChartQuerySchema))
    query: DashboardChartQuery,
  ) {
    const points = await this.dashboardService.getSalesChart(query.days);
    return { points };
  }
}
