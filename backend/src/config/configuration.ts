export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL,
  },
});

export interface ServerConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
}

export interface DatabaseConfig {
  url: string;
}
