import crypto from 'crypto';
import moment from 'moment-timezone';

export const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'B11RNKG4',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'QNK2U2RK502EADEH9YFOM2YTIIQ9C5S2',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payment/vnpay-return',
  vnp_IpnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/payments/vnpay/ipn',
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_CurrCode: 'VND',
  vnp_Locale: 'vn'
};

export function sortParams(obj: any) {
  const sortedObj = Object.entries(obj)
    .filter(
      ([key, value]) => value !== "" && value !== undefined && value !== null
    )
    .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
    .reduce((acc: any, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return sortedObj;
}

export interface VnpayPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  orderType?: string;
  ipAddr: string;
  bankCode?: string;
  language?: string;
  billMobile?: string;
  billEmail?: string;
  billFirstName?: string;
  billLastName?: string;
  billAddress?: string;
  billCity?: string;
  billCountry?: string;
  billState?: string;
}

export function createVnpayUrl(params: VnpayPaymentParams) {
  // Set timezone
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  
  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');
  
  let vnp_Params: any = {
    vnp_Version: vnpayConfig.vnp_Version,
    vnp_Command: vnpayConfig.vnp_Command,
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_Locale: params.language || vnpayConfig.vnp_Locale,
    vnp_CurrCode: vnpayConfig.vnp_CurrCode,
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: params.orderType || 'topup',
    vnp_Amount: params.amount * 100,
    vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  // Add optional billing information
  if (params.billMobile) vnp_Params.vnp_Bill_Mobile = params.billMobile;
  if (params.billEmail) vnp_Params.vnp_Bill_Email = params.billEmail;
  if (params.billFirstName) vnp_Params.vnp_Bill_FirstName = params.billFirstName;
  if (params.billLastName) vnp_Params.vnp_Bill_LastName = params.billLastName;
  if (params.billAddress) vnp_Params.vnp_Bill_Address = params.billAddress;
  if (params.billCity) vnp_Params.vnp_Bill_City = params.billCity;
  if (params.billCountry) vnp_Params.vnp_Bill_Country = params.billCountry;
  if (params.billState) vnp_Params.vnp_Bill_State = params.billState;
  
  // Add bank code if specified
  if (params.bankCode) vnp_Params.vnp_BankCode = params.bankCode;

  // Sort params
  const sortedParams = sortParams(vnp_Params);
  
  // Create URLSearchParams for query string
  const urlParams = new URLSearchParams();
  for (let [key, value] of Object.entries(sortedParams)) {
    urlParams.append(key, String(value));
  }
  
  // Create signature
  const querystring = urlParams.toString();
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(querystring).digest('hex');
  
  // Add signature to params
  urlParams.append('vnp_SecureHash', signed);
  
  // Build final URL
  const paymentUrl = `${vnpayConfig.vnp_Url}?${urlParams.toString()}`;
  
  return paymentUrl;
}

export function verifyVnpayReturn(vnp_Params: any) {
  const secureHash = vnp_Params.vnp_SecureHash;
  
  console.log('Verifying VNPAY signature...');
  console.log('Received SecureHash:', secureHash);
  
  // Make a copy to avoid modifying original
  const params = { ...vnp_Params };
  
  // Remove hash params
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  
  // Sort params
  const sortedParams = sortParams(params);
  
  // Create URLSearchParams for query string
  const urlParams = new URLSearchParams();
  for (let [key, value] of Object.entries(sortedParams)) {
    urlParams.append(key, String(value));
  }
  
  // Create signature
  const querystring = urlParams.toString();
  console.log('Query string for verification:', querystring);
  
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(querystring).digest('hex');
  
  console.log('Calculated hash:', signed);
  console.log('Signature match:', secureHash === signed);
  
  return secureHash === signed;
}

export function getClientIp(req: any): string {
  let ip = req.headers['x-forwarded-for'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  
  // Convert IPv6 to IPv4 if needed
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  } else if (ip.includes('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  
  // Get first IP if multiple
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  return ip;
}