export interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
}

export interface Session {
  id: number;
  email: string;
  roles: string[];
}
