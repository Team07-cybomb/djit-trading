const Razorpay = require('razorpay');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async createOrder(orderData) {
    try {
      const order = await this.razorpay.orders.create(orderData);
      return order;
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Payment gateway error: ${error.error.description}`);
    }
  }

  verifySignature(orderId, paymentId, signature) {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Fetch payment details error:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  async initiateRefund(refundData) {
    try {
      const refund = await this.razorpay.payments.refund(refundData.paymentId, {
        amount: refundData.amount,
        notes: refundData.notes
      });
      return refund;
    } catch (error) {
      console.error('Refund initiation error:', error);
      throw new Error(`Refund failed: ${error.error.description}`);
    }
  }

  async getRefundStatus(refundId) {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      console.error('Fetch refund status error:', error);
      throw new Error('Failed to fetch refund status');
    }
  }

  // Alternative payment method for testing/demo
  async createTestOrder(amount) {
    // This is for demonstration purposes only
    // In production, use actual payment gateway
    return {
      id: `order_${Date.now()}_test`,
      amount: amount,
      currency: 'INR',
      status: 'created'
    };
  }

  verifyTestSignature(orderId, paymentId, signature) {
    // Simple verification for test mode
    return signature === 'test_signature_valid';
  }
}

module.exports = new PaymentService();