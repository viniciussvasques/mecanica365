export default function appConfig() {
  return {
    app: {
      name: process.env.APP_NAME || 'Mecânica365 API',
      version: process.env.APP_VERSION || '1.0.0',
      port: Number.parseInt(process.env.PORT || '3001', 10),
      env: process.env.NODE_ENV || 'development',
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    vehicleHistory: {
      apiUrl: process.env.VEHICLE_HISTORY_API_URL || 'http://localhost:3002',
      apiKey: process.env.VEHICLE_HISTORY_API_KEY,
    },
  };
}
