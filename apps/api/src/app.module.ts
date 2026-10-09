// apps/api/src/app.module.ts

// Root module — adds WebsocketModule (Global, so it loads early).

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import configuration from './config/configuration';
import { IdGenerator } from './common/utils/id-generator';
import { Counter, CounterSchema } from './common/utils/counter.schema';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { SalesModule } from './sales/sales.module';
import { SettingsModule } from './settings/settings.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
      cache: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
        autoIndex: true,
      }),
    }),

    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false, fallthrough: true },
    }),

    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),

    // ---- Global modules (load first) ----
    WebsocketModule,

    // ---- Feature modules ----
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    StockModule,
    SalesModule,
    SettingsModule,
    UploadsModule,
    ReceiptsModule,
    DashboardModule,
    ReportsModule,

    // Later:
    // MailModule,
  ],
  providers: [
    IdGenerator,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [IdGenerator],
})
export class AppModule {}
