import { Role } from '../constans/roles';
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

export type LoginInput = {
  email: string;
  password: string;
};
export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type JwtIdentity = { sub: number; email: string; roles: Role[] };
