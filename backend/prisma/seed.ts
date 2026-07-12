import { PrismaClient, Role, ActiveStatus, AssetStatus, AllocationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditCycleAuditor.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.resourceBooking.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.assetAllocation.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});

  // 2. Hash password
  const passwordHash = bcrypt.hashSync('password123', 10);

  // 3. Create Locations
  const locHQ = await prisma.location.create({ data: { name: 'HQ Building' } });
  const locWarehouse = await prisma.location.create({ data: { name: 'Warehouse Alpha' } });
  const locRemote = await prisma.location.create({ data: { name: 'Remote Office' } });

  // 4. Create Asset Categories
  const catLaptops = await prisma.assetCategory.create({
    data: {
      name: 'Laptops',
      description: 'Corporate laptops and notebooks',
      customFieldsSchema: [
        { name: 'RAM', type: 'string', required: true },
        { name: 'Storage', type: 'string', required: true },
        { name: 'Processor', type: 'string', required: false }
      ]
    }
  });

  const catMobile = await prisma.assetCategory.create({
    data: {
      name: 'Mobile Devices',
      description: 'Smartphones and tablets',
      customFieldsSchema: [
        { name: 'OS', type: 'string', required: true },
        { name: 'Storage', type: 'string', required: true }
      ]
    }
  });

  const catFurniture = await prisma.assetCategory.create({
    data: {
      name: 'Office Furniture',
      description: 'Desks, chairs, and other office equipment',
      customFieldsSchema: [
        { name: 'Material', type: 'string', required: false },
        { name: 'Color', type: 'string', required: false }
      ]
    }
  });

  const catVehicles = await prisma.assetCategory.create({
    data: {
      name: 'Vehicles',
      description: 'Company cars and delivery vans',
      customFieldsSchema: [
        { name: 'Model Year', type: 'number', required: true },
        { name: 'License Plate', type: 'string', required: true }
      ]
    }
  });

  // 5. Create Departments (initially without heads)
  const deptIT = await prisma.department.create({ data: { name: 'IT Department' } });
  const deptHR = await prisma.department.create({ data: { name: 'Human Resources' } });
  const deptOps = await prisma.department.create({ data: { name: 'Operations' } });

  // 6. Create Employees
  // Admin
  const adminEmp = await prisma.employee.create({
    data: {
      name: 'System Admin',
      email: 'admin@assetflow.local',
      passwordHash,
      role: 'ADMIN',
      departmentId: deptIT.id
    }
  });

  // Asset Manager
  const managerEmp = await prisma.employee.create({
    data: {
      name: 'Asset Manager',
      email: 'manager@assetflow.local',
      passwordHash,
      role: 'ASSET_MANAGER',
      departmentId: deptOps.id
    }
  });

  // Department Heads
  const headIT = await prisma.employee.create({
    data: {
      name: 'IT Head',
      email: 'head.it@assetflow.local',
      passwordHash,
      role: 'DEPARTMENT_HEAD',
      departmentId: deptIT.id
    }
  });

  const headHR = await prisma.employee.create({
    data: {
      name: 'HR Head',
      email: 'head.hr@assetflow.local',
      passwordHash,
      role: 'DEPARTMENT_HEAD',
      departmentId: deptHR.id
    }
  });

  const headOps = await prisma.employee.create({
    data: {
      name: 'Ops Head',
      email: 'head.ops@assetflow.local',
      passwordHash,
      role: 'DEPARTMENT_HEAD',
      departmentId: deptOps.id
    }
  });

  // Regular Employees
  const emp1 = await prisma.employee.create({
    data: { name: 'Alice Smith', email: 'alice@assetflow.local', passwordHash, role: 'EMPLOYEE', departmentId: deptIT.id }
  });
  const emp2 = await prisma.employee.create({
    data: { name: 'Bob Jones', email: 'bob@assetflow.local', passwordHash, role: 'EMPLOYEE', departmentId: deptIT.id }
  });
  const emp3 = await prisma.employee.create({
    data: { name: 'Charlie Brown', email: 'charlie@assetflow.local', passwordHash, role: 'EMPLOYEE', departmentId: deptHR.id }
  });
  const emp4 = await prisma.employee.create({
    data: { name: 'Diana Prince', email: 'diana@assetflow.local', passwordHash, role: 'EMPLOYEE', departmentId: deptOps.id }
  });
  const emp5 = await prisma.employee.create({
    data: { name: 'Evan Wright', email: 'evan@assetflow.local', passwordHash, role: 'EMPLOYEE', departmentId: deptOps.id }
  });

  // 7. Update Department Heads
  await prisma.department.update({
    where: { id: deptIT.id },
    data: { departmentHeadId: headIT.id }
  });
  await prisma.department.update({
    where: { id: deptHR.id },
    data: { departmentHeadId: headHR.id }
  });
  await prisma.department.update({
    where: { id: deptOps.id },
    data: { departmentHeadId: headOps.id }
  });

  // 8. Create Assets (~20 assets)
  const assetsData = [
    { name: 'MacBook Pro 16"', categoryId: catLaptops.id, condition: 'New', locationId: locHQ.id, status: 'AVAILABLE', customFieldValues: { RAM: '32GB', Storage: '1TB', Processor: 'M3 Max' } },
    { name: 'ThinkPad X1 Carbon', categoryId: catLaptops.id, condition: 'Good', locationId: locHQ.id, status: 'ALLOCATED', customFieldValues: { RAM: '16GB', Storage: '512GB', Processor: 'Intel i7' } },
    { name: 'Dell XPS 15', categoryId: catLaptops.id, condition: 'Good', locationId: locRemote.id, status: 'ALLOCATED', customFieldValues: { RAM: '32GB', Storage: '1TB', Processor: 'Intel i9' } },
    { name: 'iPhone 15 Pro', categoryId: catMobile.id, condition: 'New', locationId: locHQ.id, status: 'AVAILABLE', customFieldValues: { OS: 'iOS', Storage: '256GB' } },
    { name: 'Samsung Galaxy S24', categoryId: catMobile.id, condition: 'New', locationId: locWarehouse.id, status: 'AVAILABLE', customFieldValues: { OS: 'Android', Storage: '256GB' } },
    { name: 'iPad Pro 12.9"', categoryId: catMobile.id, condition: 'Good', locationId: locHQ.id, status: 'ALLOCATED', customFieldValues: { OS: 'iPadOS', Storage: '128GB' } },
    { name: 'Ergonomic Mesh Chair 1', categoryId: catFurniture.id, condition: 'Good', locationId: locHQ.id, status: 'AVAILABLE', customFieldValues: { Material: 'Mesh', Color: 'Black' } },
    { name: 'Ergonomic Mesh Chair 2', categoryId: catFurniture.id, condition: 'Good', locationId: locHQ.id, status: 'ALLOCATED', customFieldValues: { Material: 'Mesh', Color: 'Black' } },
    { name: 'Standing Desk A', categoryId: catFurniture.id, condition: 'Good', locationId: locHQ.id, status: 'AVAILABLE', customFieldValues: { Material: 'Wood/Metal', Color: 'Oak' } },
    { name: 'Standing Desk B', categoryId: catFurniture.id, condition: 'Good', locationId: locRemote.id, status: 'ALLOCATED', customFieldValues: { Material: 'Wood/Metal', Color: 'White' } },
    { name: 'Conference Room Table', categoryId: catFurniture.id, condition: 'Good', locationId: locHQ.id, status: 'RESERVED', isBookable: true, customFieldValues: { Material: 'Mahogany', Color: 'Brown' } },
    { name: 'Company Delivery Van', categoryId: catVehicles.id, condition: 'Good', locationId: locWarehouse.id, status: 'AVAILABLE', isBookable: true, customFieldValues: { 'Model Year': 2021, 'License Plate': 'CA-987-XYZ' } },
    { name: 'Sales Team Sedan', categoryId: catVehicles.id, condition: 'Fair', locationId: locHQ.id, status: 'UNDER_MAINTENANCE', customFieldValues: { 'Model Year': 2019, 'License Plate': 'CA-123-ABC' } },
    { name: 'Projector Epson 4K', categoryId: catMobile.id, condition: 'Good', locationId: locHQ.id, status: 'AVAILABLE', isBookable: true, customFieldValues: { OS: 'N/A', Storage: 'N/A' } },
    { name: 'MacBook Air 13"', categoryId: catLaptops.id, condition: 'Good', locationId: locRemote.id, status: 'ALLOCATED', customFieldValues: { RAM: '8GB', Storage: '256GB', Processor: 'M1' } },
    { name: 'Dell Latitude 5420', categoryId: catLaptops.id, condition: 'Fair', locationId: locWarehouse.id, status: 'LOST', customFieldValues: { RAM: '16GB', Storage: '256GB', Processor: 'Intel i5' } },
    { name: 'iPhone 13', categoryId: catMobile.id, condition: 'Fair', locationId: locWarehouse.id, status: 'RETIRED', customFieldValues: { OS: 'iOS', Storage: '128GB' } },
    { name: 'Office Sofa', categoryId: catFurniture.id, condition: 'Good', locationId: locHQ.id, status: 'AVAILABLE', customFieldValues: { Material: 'Fabric', Color: 'Grey' } },
    { name: 'Monitors Setup 27" x2', categoryId: catLaptops.id, condition: 'New', locationId: locHQ.id, status: 'AVAILABLE', customFieldValues: { RAM: 'N/A', Storage: 'N/A', Processor: 'N/A' } },
    { name: 'Company SUV', categoryId: catVehicles.id, condition: 'Good', locationId: locHQ.id, status: 'AVAILABLE', isBookable: true, customFieldValues: { 'Model Year': 2022, 'License Plate': 'CA-555-SUV' } }
  ];

  const assets: any[] = [];
  for (let i = 0; i < assetsData.length; i++) {
    const item = assetsData[i];
    const tagIndex = i + 1;
    const assetTag = `AF-${String(tagIndex).padStart(4, '0')}`;
    const asset = await prisma.asset.create({
      data: {
        assetTag,
        name: item.name,
        categoryId: item.categoryId,
        condition: item.condition,
        locationId: item.locationId,
        status: item.status as AssetStatus,
        isBookable: item.isBookable || false,
        qrCodeValue: assetTag,
        customFieldValues: item.customFieldValues,
        registeredById: adminEmp.id
      }
    });
    assets.push(asset);
  }

  // 9. Create Allocations for ALLOCATED assets
  // ThinkPad allocated to Alice
  await prisma.assetAllocation.create({
    data: {
      assetId: assets[1].id,
      employeeId: emp1.id,
      departmentId: deptIT.id,
      allocatedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      expectedReturnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // in 10 days
      status: 'ACTIVE',
      conditionAtAllocation: 'Good'
    }
  });

  // Dell XPS allocated to Bob
  await prisma.assetAllocation.create({
    data: {
      assetId: assets[2].id,
      employeeId: emp2.id,
      departmentId: deptIT.id,
      allocatedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      conditionAtAllocation: 'Good'
    }
  });

  // iPad Pro allocated to Charlie
  await prisma.assetAllocation.create({
    data: {
      assetId: assets[5].id,
      employeeId: emp3.id,
      departmentId: deptHR.id,
      allocatedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // OVERDUE by 2 days!
      status: 'ACTIVE',
      conditionAtAllocation: 'Good'
    }
  });

  // Mesh Chair 2 allocated to IT Department overall
  await prisma.assetAllocation.create({
    data: {
      assetId: assets[7].id,
      departmentId: deptIT.id,
      allocatedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      conditionAtAllocation: 'Good'
    }
  });

  // Standing Desk B allocated to Diana (Remote)
  await prisma.assetAllocation.create({
    data: {
      assetId: assets[9].id,
      employeeId: emp4.id,
      departmentId: deptOps.id,
      allocatedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      conditionAtAllocation: 'Good'
    }
  });

  // MacBook Air allocated to Evan
  await prisma.assetAllocation.create({
    data: {
      assetId: assets[14].id,
      employeeId: emp5.id,
      departmentId: deptOps.id,
      allocatedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      conditionAtAllocation: 'Good'
    }
  });

  // 10. Seed a few Bookings (Track B)
  // Conference Room Table Table (assets[10]) is RESERVED/bookable
  await prisma.resourceBooking.create({
    data: {
      assetId: assets[10].id,
      bookedById: emp1.id,
      departmentId: deptIT.id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
      purpose: 'Sprint Planning Meeting',
      status: 'UPCOMING'
    }
  });

  // Company SUV (assets[19])
  await prisma.resourceBooking.create({
    data: {
      assetId: assets[19].id,
      bookedById: emp5.id,
      departmentId: deptOps.id,
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // tomorrow at 9 AM
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // tomorrow at 5 PM
      purpose: 'Client Site Visit',
      status: 'UPCOMING'
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
