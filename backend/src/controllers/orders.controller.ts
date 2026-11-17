import { Request, Response, NextFunction } from 'express';
import { ordersService } from '../services/orders.service.js';

export const getPublicCatalogController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await ordersService.getPublicCatalog();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

export const createOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ordersService.createOrder(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const createAdminWhatsAppOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await ordersService.createAdminWhatsAppOrder(req.body);
    res.status(201).json({ message: 'Pedido de WhatsApp registrado como pendiente de recogida.', order });
  } catch (error) { next(error); }
};

export const updateOrderPaymentMethodController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await ordersService.setOrderPaymentMethod(id, req.body.paymentMethod);
    res.status(200).json({ order });
  } catch (error) { next(error); }
};

export const createOrderFromWhatsAppCodeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ordersService.createOrderFromWhatsAppCode(String(req.body.code || ''));
    res.status(result.alreadyRegistered ? 200 : 201).json({ message: result.alreadyRegistered ? 'Este pedido ya estaba registrado.' : 'Pedido guardado como pendiente.', ...result });
  } catch (error) { next(error); }
};

export const getAdminOrdersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await ordersService.getAdminOrders();
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const order = await ordersService.updateOrderStatus(id, status);
    res.status(200).json({ message: 'Estado del pedido actualizado.', order });
  } catch (error) {
    next(error);
  }
};

export const deleteCancelledOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await ordersService.deleteCancelledOrder(id);
    res.status(200).json(result);
  } catch (error) { next(error); }
};

export const verifyWhatsAppWebhookController = async (req: Request, res: Response): Promise<void> => {
  const { whatsappService } = await import('../services/whatsapp.service.js');
  const challenge = await whatsappService.verifyWebhook(String(req.query['hub.mode'] || ''), String(req.query['hub.verify_token'] || ''), String(req.query['hub.challenge'] || ''));
  if (challenge) res.status(200).send(challenge);
  else res.sendStatus(403);
};

export const receiveWhatsAppWebhookController = async (req: Request, res: Response): Promise<void> => {
  const { whatsappService } = await import('../services/whatsapp.service.js');
  if (!whatsappService.verifySignature((req as Request & { rawBody?: Buffer }).rawBody, req.header('x-hub-signature-256'))) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200);
  try { await whatsappService.handleWebhook(req.body); }
  catch (error) { console.error('Error procesando webhook de WhatsApp:', error); }
};

export const getClientOrdersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.query;
    const result = await ordersService.getOrdersByPhone(phone as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
