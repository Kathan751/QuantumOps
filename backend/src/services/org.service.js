import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logActivity, notify } from '../lib/audit.js';

export async function listDepartments() {
  return prisma.department.findMany({ include: { head: true, parent: true }, orderBy: { name: 'asc' } });
}

export async function saveDepartment(user, data, id = null) {
  const payload = {
    name: data.name,
    parentDepartmentId: data.parentDepartmentId ? Number(data.parentDepartmentId) : null,
    headUserId: data.headUserId ? Number(data.headUserId) : null,
    status: data.status || 'ACTIVE'
  };
  const before = id ? await prisma.department.findUnique({ where: { id: Number(id) } }) : null;
  const department = id
    ? await prisma.department.update({ where: { id: Number(id) }, data: payload, include: { head: true, parent: true } })
    : await prisma.department.create({ data: payload, include: { head: true, parent: true } });
  await logActivity({ actorUserId: user.id, action: id ? 'DEPARTMENT_UPDATED' : 'DEPARTMENT_CREATED', entityType: 'Department', entityId: department.id, beforeState: before, afterState: department });
  return department;
}

export async function listCategories() {
  return prisma.assetCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function saveCategory(user, data, id = null) {
  const payload = { name: data.name, status: data.status || 'ACTIVE', customFieldsSchema: data.customFieldsSchema || null };
  const before = id ? await prisma.assetCategory.findUnique({ where: { id: Number(id) } }) : null;
  const category = id ? await prisma.assetCategory.update({ where: { id: Number(id) }, data: payload }) : await prisma.assetCategory.create({ data: payload });
  await logActivity({ actorUserId: user.id, action: id ? 'CATEGORY_UPDATED' : 'CATEGORY_CREATED', entityType: 'AssetCategory', entityId: category.id, beforeState: before, afterState: category });
  return category;
}

export async function listUsers() {
  return prisma.user.findMany({ include: { department: true }, orderBy: { name: 'asc' } });
}

export async function updateUser(user, id, data) {
  const before = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!before) throw new ApiError(404, 'User not found');
  const allowedRoles = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'];
  if (data.role && !allowedRoles.includes(data.role)) throw new ApiError(400, 'Invalid role');
  const updated = await prisma.user.update({
    where: { id: Number(id) },
    data: {
      role: data.role || before.role,
      status: data.status || before.status,
      departmentId: data.departmentId === undefined ? before.departmentId : (data.departmentId ? Number(data.departmentId) : null)
    },
    include: { department: true }
  });
  await logActivity({ actorUserId: user.id, action: 'USER_UPDATED', entityType: 'User', entityId: updated.id, beforeState: { role: before.role, status: before.status, departmentId: before.departmentId }, afterState: { role: updated.role, status: updated.status, departmentId: updated.departmentId } });
  if (before.role !== updated.role) await notify({ userId: updated.id, type: 'ROLE_CHANGED', message: `Your role changed to ${updated.role.replaceAll('_', ' ')}`, relatedEntityType: 'User', relatedEntityId: updated.id });
  return updated;
}
