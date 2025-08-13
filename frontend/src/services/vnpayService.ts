import axios from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

interface CreatePaymentRequest {
  amount: number;
  bankCode?: string;
  language?: 'vn' | 'en';
  orderType?: string;
}

interface CreatePaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;
    orderId: string;
    amount: number;
  };
  message?: string;
}

interface TransactionStatus {
  success: boolean;
  data?: {
    orderId: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    description: string;
    createdAt: string;
  };
  message?: string;
}

export const vnpayService = {
  async createPayment(params: CreatePaymentRequest | number): Promise<CreatePaymentResponse> {
    try {
      const token = localStorage.getItem('token');
      
      // Support both simple amount or full params object
      const requestData = typeof params === 'number' 
        ? { amount: params } 
        : params;
      
      const response = await axios.post(
        `${API_URL}/payments/vnpay/create-payment`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating VNPay payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo thanh toán'
      };
    }
  },

  async checkTransactionStatus(orderId: string): Promise<TransactionStatus> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/payments/vnpay/check-status/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error checking transaction status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi kiểm tra trạng thái giao dịch'
      };
    }
  },

  redirectToPayment(paymentUrl: string): void {
    window.location.href = paymentUrl;
  },

  parseReturnUrl(): {
    status: string | null;
    amount: string | null;
  } {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      status: urlParams.get('status'),
      amount: urlParams.get('amount')
    };
  }
};