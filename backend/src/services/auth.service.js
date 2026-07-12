import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { comparePassword, hashPassword, signToken } from '../lib/auth.js';
import { ApiError } from '../lib/errors.js';
import { logActivity } from '../lib/audit.js';

export function normalizeSignupRole() {
  return 'EMPLOYEE';
}

function safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function signup(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'Email is already registered');
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      name: data.name,
      phone: data.phone || null,
      departmentId: data.departmentId ? Number(data.departmentId) : null,
      role: normalizeSignupRole(data.role)
    },
    include: { department: true }
  });
  await logActivity({ actorUserId: user.id, action: 'USER_SIGNUP', entityType: 'User', entityId: user.id, afterState: { role: user.role, email: user.email } });
  return { token: signToken(user), user: safeUser(user) };
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { department: true } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'Account is inactive');
  return { token: signToken(user), user: safeUser(user) };
}

export function currentUser(user) {
  return safeUser(user);
}

export async function forgotPassword(email) {
  const token = crypto.randomBytes(24).toString('hex');
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    await logActivity({ actorUserId: user.id, action: 'PASSWORD_RESET_TOKEN_GENERATED', entityType: 'User', entityId: user.id, afterState: { tokenPreview: token.slice(0, 8) } });
    console.log(`Password reset token for ${email}: ${token}`);
  }
  return { message: 'If an account exists, a password reset token was generated on the server for this demo.' };
}
