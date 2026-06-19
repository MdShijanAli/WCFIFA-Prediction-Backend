import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = (req as any).user;

    const existing = await prisma.payment.findUnique({ where: { userId } });
    if (existing?.status === 'COMPLETED') {
      res.status(400).json({ message: 'Already paid' });
      return;
    }

    const transactionId = `NBWC-${uuidv4().slice(0, 8).toUpperCase()}`;

    const payment = await prisma.payment.upsert({
      where: { userId },
      create: {
        userId,
        amount: config.registrationFee,
        status: 'PENDING',
        transactionId,
      },
      update: {
        status: 'PENDING',
        transactionId,
      },
    });

    // In development, simulate a payment URL
    if (config.nodeEnv === 'development') {
      res.json({
        paymentUrl: `${config.frontendUrl}/payment/confirm?txnId=${transactionId}&demo=true`,
        transactionId,
        amount: config.registrationFee,
        currency: 'BDT',
      });
      return;
    }

    // SSLCommerz integration
    const SSLCommerzPayment = require('sslcommerz-lts');
    const sslcz = new SSLCommerzPayment(
      config.sslcz.storeId,
      config.sslcz.storePassword,
      config.sslcz.isLive
    );

    const data = {
      total_amount: config.registrationFee,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${config.frontendUrl}/payment/success`,
      fail_url: `${config.frontendUrl}/payment/failed`,
      cancel_url: `${config.frontendUrl}/payment/cancel`,
      ipn_url: `${req.protocol}://${req.get('host')}/api/payments/ipn`,
      product_name: 'NBWC Prediction Registration',
      product_category: 'Gaming',
      product_profile: 'general',
      cus_name: user.name,
      cus_email: user.email || 'noemail@nbwc.com',
      cus_add1: 'Bangladesh',
      cus_phone: user.phone,
      shipping_method: 'NO',
      num_of_item: 1,
      ship_name: user.name,
      ship_add1: 'Bangladesh',
      ship_city: 'Dhaka',
      ship_country: 'Bangladesh',
    };

    const apiResponse = await sslcz.init(data);
    if (apiResponse?.GatewayPageURL) {
      res.json({ paymentUrl: apiResponse.GatewayPageURL, transactionId });
    } else {
      res.status(500).json({ message: 'Payment gateway error' });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
};

export const confirmDemoPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.body;
    const userId = (req as any).userId;

    const payment = await prisma.payment.findFirst({
      where: { transactionId, userId },
    });

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', gatewayResponse: { demo: true, confirmedAt: new Date() } },
    });

    res.json({ message: 'Payment confirmed successfully', status: 'COMPLETED' });
  } catch (error) {
    console.error('Demo payment confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
};

export const paymentIPN = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tran_id, status, val_id } = req.body;

    if (status === 'VALID' || status === 'VALIDATED') {
      await prisma.payment.update({
        where: { transactionId: tran_id },
        data: {
          status: 'COMPLETED',
          gatewayResponse: req.body,
        },
      });
    } else if (status === 'FAILED') {
      await prisma.payment.update({
        where: { transactionId: tran_id },
        data: { status: 'FAILED', gatewayResponse: req.body },
      });
    }

    res.json({ message: 'IPN received' });
  } catch (error) {
    console.error('IPN error:', error);
    res.status(500).json({ message: 'IPN processing failed' });
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const payment = await prisma.payment.findUnique({
      where: { userId },
      select: { status: true, amount: true, currency: true, transactionId: true, createdAt: true },
    });

    res.json({ payment: payment || null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
};
