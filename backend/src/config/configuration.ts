export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    hashLength: parseInt(process.env.AUTH_HASH_LENGTH || '32'),
    timeCost: parseInt(process.env.AUTH_HASH_TIME_COST || '6'),
    memoryCost: parseInt(process.env.AUTH_HASH_MEMORY_COST || '65536'),
    jwt: {
      expirationInterval:
        Number(process.env.AUTH_JWT_EXPIRATION_INTERVAL) || 3600,
      secret: process.env.AUTH_JWT_SECRET || '',
      audience: process.env.AUTH_JWT_AUDIENCE || 'stridewise-users',
      issuer: process.env.AUTH_JWT_ISSUER || 'stridewise-api',
    },
  },
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: process.env.STRAVA_REDIRECT_URI,
  },
});

export interface ServerConfig {
  env: string;
  port: number;
  frontendUrl: string;
  database: DatabaseConfig;
  auth: AuthConfig;
  strava: StravaConfig;
}

export interface DatabaseConfig {
  url: string;
}

export interface JwtConfig {
  expirationInterval: number;
  secret: string;
  audience: string;
  issuer: string;
}

export interface AuthConfig {
  hashLength: number;
  timeCost: number;
  memoryCost: number;
  jwt: JwtConfig;
  maxDelay: number;
}

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
