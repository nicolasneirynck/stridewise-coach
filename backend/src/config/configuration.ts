export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL,
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
  strava: StravaConfig;
}

export interface DatabaseConfig {
  url: string;
}

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
