import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
  districts: District[];
}

interface District {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
  wards: Ward[];
}

interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
}

async function importLocations() {
  try {
    console.log('🚀 Bắt đầu import dữ liệu tỉnh thành...');
    
    // Lấy danh sách tỉnh thành với đầy đủ quận/huyện và xã/phường
    const response = await axios.get('https://provinces.open-api.vn/api/p/?depth=3');
    const provinces: Province[] = response.data;
    
    console.log(`📍 Tìm thấy ${provinces.length} tỉnh/thành phố`);
    
    let provinceCount = 0;
    let districtCount = 0;
    let wardCount = 0;
    
    // Import từng tỉnh thành
    for (const province of provinces) {
      try {
        // Kiểm tra xem tỉnh đã tồn tại chưa
        const existingProvince = await prisma.province.findUnique({
          where: { code: province.code.toString() }
        });
        
        let provinceRecord;
        
        if (existingProvince) {
          console.log(`✓ Tỉnh ${province.name} đã tồn tại, bỏ qua...`);
          provinceRecord = existingProvince;
        } else {
          // Tạo tỉnh mới
          provinceRecord = await prisma.province.create({
            data: {
              name: province.name,
              code: province.code.toString()
            }
          });
          provinceCount++;
          console.log(`✅ Đã thêm tỉnh: ${province.name}`);
        }
        
        // Import quận/huyện
        if (province.districts) {
          for (const district of province.districts) {
            try {
              // Kiểm tra quận/huyện đã tồn tại chưa
              const existingDistrict = await prisma.district.findFirst({
                where: {
                  code: district.code.toString(),
                  provinceId: provinceRecord.id
                }
              });
              
              let districtRecord;
              
              if (existingDistrict) {
                districtRecord = existingDistrict;
              } else {
                // Tạo quận/huyện mới
                districtRecord = await prisma.district.create({
                  data: {
                    name: district.name,
                    code: district.code.toString(),
                    provinceId: provinceRecord.id
                  }
                });
                districtCount++;
              }
              
              // Import xã/phường
              if (district.wards) {
                for (const ward of district.wards) {
                  try {
                    // Kiểm tra xã/phường đã tồn tại chưa
                    const existingWard = await prisma.ward.findFirst({
                      where: {
                        code: ward.code.toString(),
                        districtId: districtRecord.id
                      }
                    });
                    
                    if (!existingWard) {
                      // Tạo xã/phường mới
                      await prisma.ward.create({
                        data: {
                          name: ward.name,
                          code: ward.code.toString(),
                          districtId: districtRecord.id
                        }
                      });
                      wardCount++;
                    }
                  } catch (error) {
                    console.error(`❌ Lỗi khi import xã/phường ${ward.name}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error(`❌ Lỗi khi import quận/huyện ${district.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Lỗi khi import tỉnh ${province.name}:`, error);
      }
    }
    
    console.log('\n📊 Kết quả import:');
    console.log(`✅ Đã thêm ${provinceCount} tỉnh/thành phố`);
    console.log(`✅ Đã thêm ${districtCount} quận/huyện`);
    console.log(`✅ Đã thêm ${wardCount} xã/phường`);
    console.log('🎉 Import dữ liệu thành công!');
    
  } catch (error) {
    console.error('❌ Lỗi khi import dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
importLocations().catch(console.error);