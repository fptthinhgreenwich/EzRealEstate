import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function importFullLocations() {
  try {
    console.log('🚀 Bắt đầu import đầy đủ dữ liệu tỉnh thành...');
    
    // Lấy danh sách tỉnh thành với đầy đủ quận/huyện và xã/phường (depth=3)
    console.log('📥 Đang tải dữ liệu từ API...');
    const response = await axios.get('https://provinces.open-api.vn/api/?depth=3');
    const provinces = response.data;
    
    console.log(`📍 Tìm thấy ${provinces.length} tỉnh/thành phố`);
    
    let provinceCount = 0;
    let districtCount = 0;
    let wardCount = 0;
    let skipProvince = 0;
    let skipDistrict = 0;
    let skipWard = 0;
    
    // Import từng tỉnh thành
    for (const province of provinces) {
      try {
        console.log(`\n🏛️ Đang xử lý: ${province.name}`);
        
        // Tạo hoặc lấy tỉnh
        let provinceRecord = await prisma.province.findUnique({
          where: { code: String(province.code) }
        });
        
        if (!provinceRecord) {
          // Kiểm tra theo tên nếu không tìm thấy theo code
          provinceRecord = await prisma.province.findUnique({
            where: { name: province.name }
          });
          
          if (!provinceRecord) {
            provinceRecord = await prisma.province.create({
              data: {
                name: province.name,
                code: String(province.code)
              }
            });
            provinceCount++;
            console.log(`  ✅ Đã thêm tỉnh: ${province.name}`);
          } else {
            // Cập nhật code nếu tỉnh đã tồn tại với tên
            await prisma.province.update({
              where: { id: provinceRecord.id },
              data: { code: String(province.code) }
            });
            skipProvince++;
            console.log(`  ⏭️ Tỉnh đã tồn tại: ${province.name}`);
          }
        } else {
          skipProvince++;
          console.log(`  ⏭️ Tỉnh đã tồn tại: ${province.name}`);
        }
        
        // Import quận/huyện
        if (province.districts && Array.isArray(province.districts)) {
          console.log(`  📂 Xử lý ${province.districts.length} quận/huyện...`);
          
          for (const district of province.districts) {
            try {
              // Kiểm tra quận/huyện
              let districtRecord = await prisma.district.findFirst({
                where: {
                  code: String(district.code),
                  provinceId: provinceRecord.id
                }
              });
              
              if (!districtRecord) {
                districtRecord = await prisma.district.create({
                  data: {
                    name: district.name,
                    code: String(district.code),
                    provinceId: provinceRecord.id
                  }
                });
                districtCount++;
              } else {
                skipDistrict++;
              }
              
              // Import xã/phường
              if (district.wards && Array.isArray(district.wards)) {
                for (const ward of district.wards) {
                  try {
                    // Kiểm tra xã/phường
                    const existingWard = await prisma.ward.findFirst({
                      where: {
                        code: String(ward.code),
                        districtId: districtRecord.id
                      }
                    });
                    
                    if (!existingWard) {
                      await prisma.ward.create({
                        data: {
                          name: ward.name,
                          code: String(ward.code),
                          districtId: districtRecord.id
                        }
                      });
                      wardCount++;
                    } else {
                      skipWard++;
                    }
                  } catch (wardError: any) {
                    console.error(`    ❌ Lỗi xã/phường ${ward.name}: ${wardError.message}`);
                  }
                }
              }
            } catch (districtError: any) {
              console.error(`    ❌ Lỗi quận/huyện ${district.name}: ${districtError.message}`);
            }
          }
        }
        
        console.log(`  ✅ Hoàn thành ${province.name}`);
        
      } catch (provinceError: any) {
        console.error(`❌ Lỗi tỉnh ${province.name}: ${provinceError.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ IMPORT:');
    console.log('='.repeat(50));
    console.log(`✅ Đã thêm mới:`);
    console.log(`   • ${provinceCount} tỉnh/thành phố`);
    console.log(`   • ${districtCount} quận/huyện`);
    console.log(`   • ${wardCount} xã/phường`);
    console.log(`⏭️ Đã tồn tại:`);
    console.log(`   • ${skipProvince} tỉnh/thành phố`);
    console.log(`   • ${skipDistrict} quận/huyện`);
    console.log(`   • ${skipWard} xã/phường`);
    console.log('='.repeat(50));
    console.log('🎉 Import dữ liệu hoàn tất!');
    
  } catch (error: any) {
    console.error('❌ Lỗi nghiêm trọng:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
importFullLocations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });