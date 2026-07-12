import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'assetflow-dev-secret-change-me';

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

export function verifyToken(token) {
  return jwt.verify(token, secret());
}
