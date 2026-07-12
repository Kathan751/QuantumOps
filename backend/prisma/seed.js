import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash('Password123!', 12);

async function main() {
  await prisma.department.updateMany({ data: { headUserId: null } });
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.uploadedFile.deleteMany(),
    prisma.auditItem.deleteMany(),
    prisma.auditAssignment.deleteMany(),
    prisma.auditCycle.deleteMany(),
    prisma.maintenanceRequest.deleteMany(),
    prisma.resourceBooking.deleteMany(),
    prisma.bookableResource.deleteMany(),
    prisma.transferRequest.deleteMany(),
    prisma.assetAllocation.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.assetCategory.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany()
  ]);

  const engineering = await prisma.department.create({ data: { name: 'Engineering' } });
  const sales = await prisma.department.create({ data: { name: 'Sales' } });
  const operations = await prisma.department.create({ data: { name: 'Operations' } });

  const [admin, manager, manager2, head, head2, employee, employee2, employee3, auditor] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@assetflow.demo', passwordHash, name: 'Avery Admin', role: 'ADMIN', departmentId: operations.id } }),
    prisma.user.create({ data: { email: 'manager@assetflow.demo', passwordHash, name: 'Mina Manager', role: 'ASSET_MANAGER', departmentId: operations.id } }),
    prisma.user.create({ data: { email: 'ops.manager@assetflow.demo', passwordHash, name: 'Omar Ops', role: 'ASSET_MANAGER', departmentId: operations.id } }),
    prisma.user.create({ data: { email: 'depthead@assetflow.demo', passwordHash, name: 'Dev Department Head', role: 'DEPARTMENT_HEAD', departmentId: engineering.id } }),
    prisma.user.create({ data: { email: 'sales.head@assetflow.demo', passwordHash, name: 'Sara Sales Head', role: 'DEPARTMENT_HEAD', departmentId: sales.id } }),
    prisma.user.create({ data: { email: 'employee@assetflow.demo', passwordHash, name: 'Evan Employee', role: 'EMPLOYEE', departmentId: engineering.id, phone: '+1-555-0101' } }),
    prisma.user.create({ data: { email: 'nina@assetflow.demo', passwordHash, name: 'Nina Analyst', role: 'EMPLOYEE', departmentId: sales.id } }),
    prisma.user.create({ data: { email: 'lee@assetflow.demo', passwordHash, name: 'Lee Operator', role: 'EMPLOYEE', departmentId: operations.id } }),
    prisma.user.create({ data: { email: 'auditor@assetflow.demo', passwordHash, name: 'Ari Auditor', role: 'EMPLOYEE', departmentId: operations.id } })
  ]);

  await prisma.department.update({ where: { id: engineering.id }, data: { headUserId: head.id } });
  await prisma.department.update({ where: { id: sales.id }, data: { headUserId: head2.id } });

  const categories = await Promise.all([
    prisma.assetCategory.create({ data: { name: 'Electronics', customFieldsSchema: { warrantyMonths: true } } }),
    prisma.assetCategory.create({ data: { name: 'Furniture', customFieldsSchema: { ergonomicRating: true } } }),
    prisma.assetCategory.create({ data: { name: 'Vehicles', customFieldsSchema: { serviceIntervalKm: true } } }),
    prisma.assetCategory.create({ data: { name: 'Tools', customFieldsSchema: { calibrationRequired: true } } })
  ]);

  const assets = [];
  for (let i = 1; i <= 20; i += 1) {
    assets.push(await prisma.asset.create({
      data: {
        tag: `AF-${String(i).padStart(4, '0')}`,
        name: ['Laptop', 'Monitor', 'Printer', 'Desk', 'Van', 'Drill'][i % 6] + ` ${i}`,
        categoryId: categories[i % categories.length].id,
        serialNumber: `SN-AF-${String(i).padStart(4, '0')}`,
        acquisitionDate: new Date(2025, i % 12, 5),
        acquisitionCost: 400 + i * 75,
        condition: i % 5 === 0 ? 'Needs inspection' : 'Good',
        location: i % 3 === 0 ? 'HQ Floor 2' : i % 3 === 1 ? 'Engineering Lab' : 'Warehouse',
        departmentId: i % 2 === 0 ? engineering.id : operations.id,
        status: i === 6 ? 'UNDER_MAINTENANCE' : i === 9 ? 'RETIRED' : 'AVAILABLE',
        isSharedResource: i % 7 === 0
      }
    }));
  }

  const overdueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const allocations = await Promise.all([
    prisma.assetAllocation.create({ data: { assetId: assets[0].id, holderUserId: employee.id, expectedReturnDate: overdueDate } }),
    prisma.assetAllocation.create({ data: { assetId: assets[1].id, holderUserId: employee2.id, expectedReturnDate: futureDate } }),
    prisma.assetAllocation.create({ data: { assetId: assets[2].id, holderDepartmentId: engineering.id, expectedReturnDate: futureDate } }),
    prisma.assetAllocation.create({ data: { assetId: assets[3].id, holderUserId: employee3.id } }),
    prisma.assetAllocation.create({ data: { assetId: assets[4].id, holderDepartmentId: operations.id } }),
    prisma.assetAllocation.create({ data: { assetId: assets[5].id, holderUserId: employee.id } })
  ]);
  await prisma.asset.updateMany({ where: { id: { in: allocations.map((a) => a.assetId) } }, data: { status: 'ALLOCATED' } });
  await prisma.asset.update({ where: { id: assets[5].id }, data: { status: 'UNDER_MAINTENANCE' } });

  const transfer = await prisma.transferRequest.create({
    data: { assetId: assets[0].id, fromAllocationId: allocations[0].id, toUserId: employee3.id, requestedByUserId: employee.id }
  });

  const room = await prisma.bookableResource.create({ data: { name: 'Orion Meeting Room', type: 'Meeting Room', location: 'HQ Floor 1' } });
  const van = await prisma.bookableResource.create({ data: { name: 'Delivery Van A', type: 'Transport', location: 'Garage' } });
  const lab = await prisma.bookableResource.create({ data: { name: 'Prototype Lab', type: 'Lab', location: 'Engineering Lab' } });
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await Promise.all([
    prisma.resourceBooking.create({ data: { resourceId: room.id, bookedByUserId: employee.id, startTime: new Date(tomorrow.setHours(9, 0, 0, 0)), endTime: new Date(tomorrow.setHours(10, 0, 0, 0)) } }),
    prisma.resourceBooking.create({ data: { resourceId: room.id, bookedByUserId: employee2.id, startTime: new Date(tomorrow.setHours(10, 0, 0, 0)), endTime: new Date(tomorrow.setHours(11, 0, 0, 0)) } }),
    prisma.resourceBooking.create({ data: { resourceId: van.id, bookedByUserId: head.id, departmentId: engineering.id, startTime: new Date(tomorrow.setHours(13, 0, 0, 0)), endTime: new Date(tomorrow.setHours(15, 0, 0, 0)) } }),
    prisma.resourceBooking.create({ data: { resourceId: lab.id, bookedByUserId: manager.id, startTime: new Date(tomorrow.setHours(15, 0, 0, 0)), endTime: new Date(tomorrow.setHours(17, 0, 0, 0)) } }),
    prisma.resourceBooking.create({ data: { resourceId: room.id, bookedByUserId: employee3.id, startTime: new Date(Date.now() - 3_600_000), endTime: new Date(Date.now() - 1_800_000), status: 'COMPLETED' } })
  ]);

  await Promise.all([
    prisma.maintenanceRequest.create({ data: { assetId: assets[5].id, raisedByUserId: employee.id, issueDescription: 'Laptop battery swelling and overheating.', priority: 'HIGH', status: 'APPROVED', approvedByUserId: manager.id, approvedAt: new Date() } }),
    prisma.maintenanceRequest.create({ data: { assetId: assets[6].id, raisedByUserId: employee2.id, issueDescription: 'Monitor flickers intermittently.', priority: 'MEDIUM' } })
  ]);

  const audit = await prisma.auditCycle.create({
    data: {
      name: 'Q3 Engineering Asset Audit',
      scopeType: 'DEPARTMENT',
      scopeValue: String(engineering.id),
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdByUserId: admin.id,
      assignments: { create: [{ auditorUserId: auditor.id }, { auditorUserId: manager.id }] },
      items: { create: assets.filter((a) => a.departmentId === engineering.id).slice(0, 6).map((a, index) => ({ assetId: a.id, result: index === 0 ? 'VERIFIED' : 'PENDING', checkedByUserId: index === 0 ? auditor.id : null, checkedAt: index === 0 ? new Date() : null })) }
    }
  });

  await Promise.all([
    prisma.notification.create({ data: { userId: employee.id, type: 'ASSET_ASSIGNED', message: 'Laptop 1 assigned to you', relatedEntityType: 'AssetAllocation', relatedEntityId: allocations[0].id } }),
    prisma.notification.create({ data: { userId: manager.id, type: 'OVERDUE_RETURN_ALERT', message: 'Laptop 1 is overdue for return', relatedEntityType: 'AssetAllocation', relatedEntityId: allocations[0].id } }),
    prisma.notification.create({ data: { userId: employee.id, type: 'MAINTENANCE_APPROVED', message: 'Maintenance approved for Laptop 6', relatedEntityType: 'MaintenanceRequest', relatedEntityId: 1 } }),
    prisma.notification.create({ data: { userId: employee.id, type: 'BOOKING_CONFIRMED', message: 'Orion Meeting Room booking confirmed', relatedEntityType: 'ResourceBooking', relatedEntityId: 1 } }),
    prisma.notification.create({ data: { userId: admin.id, type: 'AUDIT_DISCREPANCY_FLAGGED', message: 'Audit cycle is ready for review', relatedEntityType: 'AuditCycle', relatedEntityId: audit.id } })
  ]);

  for (let i = 0; i < 10; i += 1) {
    await prisma.activityLog.create({ data: { actorUserId: i % 2 ? manager.id : admin.id, action: ['SEED_ASSET_CREATED', 'SEED_BOOKING_CREATED', 'SEED_AUDIT_CREATED'][i % 3], entityType: 'SeedData', entityId: i + 1, afterState: { demo: true, index: i } } });
  }

  console.log('AssetFlow seeded.');
  console.log('Demo users: admin@assetflow.demo, manager@assetflow.demo, depthead@assetflow.demo, employee@assetflow.demo');
  console.log('Password for all demo users: Password123!');
}

main().finally(async () => prisma.$disconnect());
