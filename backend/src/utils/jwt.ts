import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stockflow_secret_key_super_secure_jwt_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export interface JwtPayloadData {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JwtPayloadData): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): JwtPayloadData => {
  return jwt.verify(token, JWT_SECRET) as JwtPayloadData;
};
