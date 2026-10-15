/**
 * Razorpay Standard Checkout & RazorpayX Payout Service
 * 
 * In production:
 * // swap with real API:
 * // const Razorpay = require('razorpay');
 * // const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
 * // const order = await rzp.orders.create({ amount: amountInPaise, currency: 'INR', receipt: `rcpt_${jobId}` });
 */

export interface CreateOrderParams {
  jobId: string;
  employerId: string;
  amountInr: number;
  platformFeeInr: number;
  wageAmountInr: number;
  currency?: string;
}

export interface RazorpayOrderResult {
  orderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export interface PaymentVerificationParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PayoutDisbursementParams {
  jobId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  amountInr: number;
  mode: 'UPI' | 'NEFT' | 'IMPS';
  vpaOrAccount: string;
}

export interface PayoutResult {
  payoutId: string;
  status: 'processed' | 'pending' | 'failed';
  utr: string;
  amountInr: number;
  timestamp: string;
}

export const razorpayService = {
  /**
   * Create an escrow order for worker wages + platform fee
   */
  createOrder: async (params: CreateOrderParams): Promise<RazorpayOrderResult> => {
    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 250));

    // In production:
    // // swap with real API:
    // // const order = await razorpay.orders.create({
    // //   amount: Math.round(params.amountInr * 100),
    // //   currency: 'INR',
    // //   receipt: `job_${params.jobId}`,
    // //   notes: { employerId: params.employerId, wageAmount: params.wageAmountInr }
    // // });

    const orderId = `order_${params.jobId.slice(-6)}_${Date.now().toString().slice(-6)}`;
    return {
      orderId,
      amountInPaise: Math.round(params.amountInr * 100),
      currency: 'INR',
      keyId: 'rzp_test_SkillBridgeDemoKey'
    };
  },

  /**
   * Simulated HMAC-SHA256 signature verification
   * In production:
   * // swap with real API:
   * // const crypto = require('crypto');
   * // const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
   * //   .update(`${orderId}|${paymentId}`)
   * //   .digest('hex');
   * // return expectedSignature === signature;
   */
  verifyPaymentSignature: async (params: PaymentVerificationParams): Promise<{ verified: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!params.orderId || !params.paymentId) {
      return { verified: false, message: 'Invalid payment parameters.' };
    }

    // In mock mode, check format
    if (params.signature && params.signature.startsWith('sig_mock_')) {
      return { verified: true, message: 'HMAC signature authenticated successfully. Escrow held securely.' };
    }

    return {
      verified: true,
      message: 'Payment verified and captured into RBI-compliant escrow account.'
    };
  },

  /**
   * Disburse wage from escrow to worker bank account or UPI via RazorpayX
   * In production:
   * // swap with real API:
   * // const payout = await fetch('https://api.razorpay.com/v1/payouts', {
   * //   method: 'POST',
   * //   headers: { Authorization: `Basic ${Buffer.from(KEY + ':' + SECRET).toString('base64')}` },
   * //   body: JSON.stringify({ account_number: RAZORPAYX_ACC, fund_account_id, amount, mode, purpose: 'wage' })
   * // });
   */
  disbursePayout: async (params: PayoutDisbursementParams): Promise<PayoutResult> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const payoutId = `pout_${Date.now().toString().slice(-8)}`;
    const utr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    return {
      payoutId,
      status: 'processed',
      utr,
      amountInr: params.amountInr,
      timestamp: new Date().toISOString()
    };
  }
};
