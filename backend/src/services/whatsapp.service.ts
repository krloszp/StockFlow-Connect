import { prisma } from '../utils/prisma.js';
import { ordersService } from './orders.service.js';
import { createHmac, timingSafeEqual } from 'node:crypto';

type WhatsAppMessage = { from?: string; text?: { body?: string }; type?: string };

export class WhatsAppService {
  isConfigured() {
    return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  async sendText(to: string, body: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) throw new Error('WhatsApp Business no está configurado.');
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body } })
    });
    if (!response.ok) throw new Error(`WhatsApp API respondió ${response.status}: ${await response.text()}`);
  }

  async sendWelcomeTemplate(to: string, customerName: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_WELCOME_TEMPLATE;
    if (!token || !phoneId || !templateName) throw new Error('Configura token, número y plantilla aprobada de bienvenida de WhatsApp.');
    const business = await prisma.businessSettings.findFirst();
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_WELCOME_LANGUAGE || 'es_CO' },
          components: [{ type: 'body', parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: business?.name || 'la tienda' }
          ] }]
        }
      })
    });
    if (!response.ok) throw new Error(`WhatsApp API respondió ${response.status}: ${await response.text()}`);
  }

  async verifyWebhook(mode: string, token: string, challenge: string) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) return challenge;
    return null;
  }

  verifySignature(rawBody: Buffer | undefined, signature: string | undefined) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!rawBody || !signature || !appSecret || !signature.startsWith('sha256=')) return false;
    const expected = Buffer.from(`sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`);
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  async handleWebhook(payload: any) {
    const entries = payload?.entry || [];
    for (const entry of entries) for (const change of entry.changes || []) {
      const value = change.value;
      const products = await prisma.product.findMany({ where: { stock: { gt: 0 } }, orderBy: { name: 'asc' }, select: { id: true, name: true, description: true, sellingPrice: true, stock: true } });
      for (const message of (value?.messages || []) as WhatsAppMessage[]) {
        if (!message.from || message.type !== 'text' || !message.text?.body) continue;
        const phone = message.from.replace(/\D/g, '');
        const input = message.text.body.trim();
        const lower = input.toLocaleLowerCase('es');
        const contactName = value?.contacts?.[0]?.profile?.name;

        let customer = await prisma.customer.findFirst({ where: { phone: { contains: phone.slice(-10) } } });
        if (!customer) {
          let session = await prisma.whatsAppSession.findUnique({ where: { phone } });
          if (!session) {
            await prisma.whatsAppSession.create({ data: { phone, step: 'NOMBRE' } });
            await this.sendText(phone, 'Para consultar nuestro inventario, primero necesitamos registrarte. Escribe tu nombre completo.');
            continue;
          }
          if (session.step === 'NOMBRE') {
            if (input.length < 3 || input.length > 100 || /^hola|menu|menú$/i.test(lower)) {
              await this.sendText(phone, 'Escribe tu nombre y apellido para continuar con el registro.');
              continue;
            }
            await prisma.whatsAppSession.update({ where: { phone }, data: { step: 'CEDULA', pendingName: input } });
            await this.sendText(phone, `Gracias, ${input}. Ahora escribe tu número de cédula (solo números).`);
            continue;
          }
          const cedula = input.replace(/\D/g, '');
          if (cedula.length < 5 || cedula.length > 15) {
            await this.sendText(phone, 'La cédula debe tener entre 5 y 15 dígitos. Intenta de nuevo.');
            continue;
          }
          const existingCustomer = await prisma.customer.findUnique({ where: { cedula } });
          if (existingCustomer && existingCustomer.phone && existingCustomer.phone.replace(/\D/g, '').slice(-10) !== phone.slice(-10)) {
            await this.sendText(phone, 'Esa cédula ya está asociada a otro número. Comunícate con la tienda para actualizar tus datos.');
            continue;
          }
          if (existingCustomer) {
            customer = await prisma.customer.update({ where: { id: existingCustomer.id }, data: { phone } });
          } else {
            customer = await prisma.customer.create({ data: { cedula, name: session.pendingName || contactName || `Cliente ${phone}`, phone } });
          }
          await prisma.whatsAppSession.delete({ where: { phone } });
          await this.sendText(phone, `Registro completado, ${customer.name}. Ya puedes consultar nuestro inventario. Escribe “hola” para ver los productos disponibles.`);
          continue;
        }

        if (/^(hola|buenas|menu|menú|catalogo|catálogo|productos|inicio)$/i.test(lower)) {
          const listing = products.slice(0, 30).map((p, i) => `${i + 1}. ${p.name}${p.description ? ` — ${p.description}` : ''}\n   $${p.sellingPrice.toLocaleString('es-CO')} · Stock: ${p.stock}`).join('\n');
          const instruction = products.length > 30 ? '\n\nEscribe: PEDIR número x cantidad (ej. PEDIR 1x2, 3x1).' : '\n\nPara pedir, responde: PEDIR número x cantidad (ej. PEDIR 1x2, 3x1).';
          await this.sendText(phone, `¡Hola${contactName ? ` ${contactName}` : ''}! Este es nuestro catálogo disponible:\n\n${listing || 'Por ahora no hay productos disponibles.'}${products.length ? instruction : ''}`);
          continue;
        }

        if (/^(efectivo|1|transferencia|2)$/i.test(lower)) {
          const order = await prisma.order.findFirst({ where: { customerPhone: { contains: phone.slice(-10) }, source: 'WHATSAPP', status: 'LISTO', paymentMethod: null }, orderBy: { createdAt: 'desc' } });
          if (order) {
            const paymentMethod = /^(efectivo|1)$/i.test(lower) ? 'EFECTIVO' : 'TRANSFERENCIA';
            await prisma.order.update({ where: { id: order.id }, data: { paymentMethod } });
            await this.sendText(phone, `Gracias. Registramos ${paymentMethod === 'EFECTIVO' ? 'pago en efectivo' : 'pago por transferencia'} para el pedido #${order.id.slice(-8).toUpperCase()}. Ya puedes coordinar la entrega con la tienda.`);
          } else await this.sendText(phone, 'No tienes un pedido listo esperando medio de pago. Escribe “hola” para ver el catálogo.');
          continue;
        }

        const orderMatch = input.match(/^pedir\s+(.+)$/i);
        if (orderMatch) {
          const selections = orderMatch[1].split(/[,;\n]+/).map((part: string) => part.match(/^\s*(\d+)\s*(?:x|\*)\s*(\d+)\s*$/i));
          if (!selections.length || selections.some((s: RegExpMatchArray | null) => !s)) {
            await this.sendText(phone, 'Formato no reconocido. Usa PEDIR 1x2, 3x1 (número de producto x cantidad). Escribe “hola” para ver el catálogo.');
            continue;
          }
          const lines = (selections as RegExpMatchArray[]).map((s) => ({ product: products[Number(s[1]) - 1], quantity: Number(s[2]) }));
          if (lines.some((line: any) => !line.product || line.quantity < 1 || line.quantity > line.product.stock)) {
            await this.sendText(phone, 'Algún producto o cantidad ya no está disponible. Escribe “hola” para consultar el catálogo actualizado.');
            continue;
          }
          const order = await ordersService.createOrder({ customerId: customer.id, customerName: customer.name, customerPhone: phone, items: lines.map((line: any) => ({ productId: line.product.id, quantity: line.quantity })) });
          await prisma.order.update({ where: { id: order.order.id }, data: { source: 'WHATSAPP' } });
          await this.sendText(phone, `¡Pedido recibido y pendiente de preparación!\n${lines.map((line: any) => `${line.product.name} x${line.quantity}`).join('\n')}\nTotal: $${order.order.totalAmount.toLocaleString('es-CO')}\n\nTe avisaremos por aquí cuando esté listo.`);
          continue;
        }
        await this.sendText(phone, 'No entendí tu mensaje. Escribe “hola” para ver productos y precios, o PEDIR 1x2 para crear un pedido. Cuando te avisemos que está listo, responde 1 (efectivo) o 2 (transferencia).');
      }
    }
  }
}

export const whatsappService = new WhatsAppService();
