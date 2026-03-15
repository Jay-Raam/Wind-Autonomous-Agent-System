export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
