import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

// Create transporter function to ensure env vars are loaded
let transporter: Mail | null = null;

const getTransporter = () => {
  if (!transporter) {
    console.log('Creating email transporter with:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      passLength: process.env.SMTP_PASS?.length || 0
    });
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for port 465 (SSL)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
  }
  return transporter;
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const mailTransporter = getTransporter();
    
    const mailOptions = {
      from: `"EZ Real Estate" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    console.log('Sending email to:', options.to);
    const info = await mailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    console.log('Response:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendPropertyApprovalEmail = async (
  sellerEmail: string,
  sellerName: string,
  propertyTitle: string,
  propertyId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
) => {
  const subject = status === 'APPROVED' 
    ? `Tin đăng "${propertyTitle}" đã được duyệt`
    : `Tin đăng "${propertyTitle}" đã bị từ chối`;

  const html = status === 'APPROVED' ? `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f0f0f0; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Tin Đăng Đã Được Duyệt!</h1>
        </div>
        <div class="content">
          <p>Xin chào ${sellerName},</p>
          
          <p>Chúng tôi vui mừng thông báo rằng tin đăng bất động sản của bạn đã được duyệt thành công:</p>
          
          <h3 style="color: #4CAF50;">📍 ${propertyTitle}</h3>
          
          <p>Tin đăng của bạn hiện đã được hiển thị trên website và người mua có thể xem được.</p>
          
          <p><strong>Một số lưu ý:</strong></p>
          <ul>
            <li>✅ Hãy đảm bảo thông tin liên hệ của bạn luôn cập nhật</li>
            <li>✅ Trả lời tin nhắn từ khách hàng kịp thời</li>
            <li>✅ Cập nhật trạng thái bất động sản khi đã bán/cho thuê</li>
          </ul>
          
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/property/${propertyId}" class="button">Xem Chi Tiết BĐS</a>
          </center>
          
          <p>Chúc bạn sớm tìm được khách hàng phù hợp!</p>
          
          <p>Trân trọng,<br><strong>Đội ngũ EZ Real Estate</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 EZ Real Estate. Tất cả quyền được bảo lưu.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .reason { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f0f0f0; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Tin Đăng Cần Chỉnh Sửa</h1>
        </div>
        <div class="content">
          <p>Xin chào ${sellerName},</p>
          
          <p>Rất tiếc, tin đăng bất động sản của bạn chưa được duyệt:</p>
          
          <h3 style="color: #f44336;">📍 ${propertyTitle}</h3>
          
          <div class="reason">
            <strong>📝 Lý do từ chối:</strong>
            <p>${rejectionReason || 'Tin đăng không đáp ứng tiêu chuẩn của chúng tôi.'}</p>
          </div>
          
          <p><strong>Bạn có thể:</strong></p>
          <ul>
            <li>📝 Chỉnh sửa tin đăng theo phản hồi trên</li>
            <li>📷 Cập nhật thông tin và hình ảnh cho phù hợp</li>
            <li>🔄 Gửi lại để được xét duyệt</li>
          </ul>
          
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/edit-property/${propertyId}" class="button">Chỉnh Sửa Tin Đăng</a>
          </center>
          
          <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.</p>
          
          <p>Trân trọng,<br><strong>Đội ngũ EZ Real Estate</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 EZ Real Estate. Tất cả quyền được bảo lưu.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`Preparing to send ${status} email to ${sellerEmail}...`);
  
  return sendEmail({
    to: sellerEmail,
    subject,
    html
  });
};

// Verify email configuration
export const verifyEmailConfiguration = async () => {
  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};