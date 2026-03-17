export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL,
  },
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: process.env.STRAVA_REDIRECT_URI,
  }, // later in stravaservice: configService.get('strava.clientId')
});

export interface ServerConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
}

export interface DatabaseConfig {
  url: string;
}

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
