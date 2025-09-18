export default () => ({
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'pio',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  
  cors: {
    origin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  },
  
  google: {
    oauth: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      authUri: process.env.GOOGLE_OAUTH_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: process.env.GOOGLE_OAUTH_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    },
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    sheetId: process.env.GOOGLE_SHEET_ID,
    sheetTab: process.env.GOOGLE_SHEET_TAB || 'fact_indicadores',
  },
  
  powerbi: {
    tenantId: process.env.POWERBI_TENANT_ID,
    clientId: process.env.POWERBI_CLIENT_ID,
    clientSecret: process.env.POWERBI_CLIENT_SECRET,
    groupId: process.env.POWERBI_GROUP_ID,
    datasetId: process.env.POWERBI_DATASET_ID,
    refreshEnabled: process.env.POWERBI_REFRESH_ENABLED === 'true',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  csrf: {
    secret: process.env.CSRF_SECRET || 'change-me-csrf-secret',
  },
  
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
    passwordMinLength: 8,
    requirePasswordChange: true,
  },
});

