import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ezrealestate.com' },
    update: {},
    create: {
      email: 'admin@ezrealestate.com',
      password: adminPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // Create sample seller
  const sellerPassword = await bcrypt.hash('seller123', 12)
  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      password: sellerPassword,
      fullName: 'John Seller',
      role: 'SELLER',
      phone: '0901234567',
      isVerified: true,
    },
  })

  // Create sample buyer
  const buyerPassword = await bcrypt.hash('buyer123', 12)
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      password: buyerPassword,
      fullName: 'Jane Buyer',
      role: 'BUYER',
      phone: '0907654321',
      isVerified: true,
    },
  })

  // Create provinces
  const hcm = await prisma.province.upsert({
    where: { code: '79' },
    update: {},
    create: {
      name: 'Thành phố Hồ Chí Minh',
      code: '79',
    },
  })

  const hanoi = await prisma.province.upsert({
    where: { code: '01' },
    update: {},
    create: {
      name: 'Thành phố Hà Nội',
      code: '01',
    },
  })

  // Create districts for HCM
  const district1 = await prisma.district.upsert({
    where: { code_provinceId: { code: '760', provinceId: hcm.id } },
    update: {},
    create: {
      name: 'Quận 1',
      code: '760',
      provinceId: hcm.id,
    },
  })

  const district7 = await prisma.district.upsert({
    where: { code_provinceId: { code: '769', provinceId: hcm.id } },
    update: {},
    create: {
      name: 'Quận 7',
      code: '769',
      provinceId: hcm.id,
    },
  })

  // Create wards
  const ward1 = await prisma.ward.upsert({
    where: { code_districtId: { code: '26734', districtId: district1.id } },
    update: {},
    create: {
      name: 'Phường Bến Nghé',
      code: '26734',
      districtId: district1.id,
    },
  })

  const ward2 = await prisma.ward.upsert({
    where: { code_districtId: { code: '26860', districtId: district7.id } },
    update: {},
    create: {
      name: 'Phường Tân Thuận Đông',
      code: '26860',
      districtId: district7.id,
    },
  })

  // Create sample properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Căn hộ cao cấp view sông Sài Gòn',
      description: 'Căn hộ 2 phòng ngủ, 2 phòng tắm, view đẹp, đầy đủ nội thất',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      price: 5500000000, // 5.5 tỷ
      area: 75.5,
      bedrooms: 2,
      bathrooms: 2,
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      provinceId: hcm.id,
      districtId: district1.id,
      wardId: ward1.id,
      sellerId: seller.id,
      images: JSON.stringify([
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ]),
      slug: 'can-ho-cao-cap-view-song-sai-gon',
      latitude: 10.7764,
      longitude: 106.7009,
      premiumStatus: 'ACTIVE',
      premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  const property2 = await prisma.property.create({
    data: {
      title: 'Nhà phố 3 tầng mặt tiền đường lớn',
      description: 'Nhà phố 4x15m, 3 tầng, mặt tiền đường 12m, thích hợp kinh doanh',
      type: 'HOUSE',
      status: 'AVAILABLE',
      price: 8200000000, // 8.2 tỷ
      area: 60,
      bedrooms: 4,
      bathrooms: 3,
      floors: 3,
      address: '456 Nguyễn Thị Thập, Phường Tân Thuận Đông, Quận 7, TP.HCM',
      provinceId: hcm.id,
      districtId: district7.id,
      wardId: ward2.id,
      sellerId: seller.id,
      images: JSON.stringify([
        'https://example.com/house1.jpg',
        'https://example.com/house2.jpg',
      ]),
      slug: 'nha-pho-3-tang-mat-tien-duong-lon',
      latitude: 10.7378,
      longitude: 106.7172,
    },
  })

  // Create system configs
  await prisma.systemConfig.upsert({
    where: { key: 'premium_price_monthly' },
    update: { value: '500000' }, // 500k VND/month
    create: {
      key: 'premium_price_monthly',
      value: '500000',
    },
  })

  await prisma.systemConfig.upsert({
    where: { key: 'top_seller_min_sales' },
    update: { value: '10' },
    create: {
      key: 'top_seller_min_sales',
      value: '10',
    },
  })

  console.log('Seeding completed!')
  console.log('Created users:', { admin, seller, buyer })
  console.log('Created properties:', { property1, property2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
