// Centralized typed configuration loader.
// Reads process.env once at startup and exposes a typed object.

export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  mongoUri: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  upload: {
    dir: string;
    maxFileSize: number;
    publicUrl: string;
  };
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  scheduler: {
    lowStockCron: string;
  };
  adminSeed: {
    name: string;
    email: string;
    password: string;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/inventory',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  upload: {
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '5242880', 10),
    publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:4000',
  },
  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Inventory <noreply@example.com>',
  },
  scheduler: {
    lowStockCron: process.env.LOW_STOCK_CRON ?? '0 9 * * *',
  },
  adminSeed: {
    name: process.env.ADMIN_NAME ?? 'Admin',
    email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.ADMIN_PASSWORD ?? 'Admin@123456',
  },
});
