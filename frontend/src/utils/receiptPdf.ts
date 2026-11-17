type ReceiptItem = { product: { name: string }; quantity: number; unitPrice?: number; subtotal: number };

export interface ReceiptSale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  cashGiven?: number | null;
  changeGiven?: number | null;
  pendingAmount?: number | null;
  customerName?: string | null;
  customerCedula?: string | null;
  customerPhone?: string | null;
  customerNote?: string | null;
  createdAt?: string;
  items: ReceiptItem[];
}

const money = (value: number, currency = 'COP') => `$${value.toLocaleString('es-CO')} ${currency}`;
const paymentLabel: Record<string, string> = {
  EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Nequi / transferencia', TARJETA: 'Tarjeta', CREDITO: 'Crédito'
};

const WIN_ANSI_SPECIAL: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f
};

function pdfHex(value: string) {
  const bytes = Array.from(value, char => {
    const code = char.codePointAt(0)!;
    return code <= 0xff ? code : (WIN_ANSI_SPECIAL[code] ?? 0x3f);
  });
  return `<${bytes.map(byte => byte.toString(16).padStart(2, '0')).join('')}>`;
}

/** Build a compact, one-page thermal-ticket style PDF using only browser APIs. */
export function createReceiptPdf(sale: ReceiptSale, business: any, adminName?: string): File {
  const currency = business?.currency || 'COP';
  const ref = sale.id.slice(-8).toUpperCase();
  const lines: { text: string; size: number; bold?: boolean; center?: boolean; gap?: number }[] = [];
  const add = (text: string, opts: Partial<typeof lines[number]> = {}) => lines.push({ text, size: 9, ...opts });
  const addWrapped = (text: string, opts: Partial<typeof lines[number]> = {}, maxChars = 42) => {
    const words = text.split(/\s+/);
    let row = '';
    for (const word of words) {
      if (row && `${row} ${word}`.length > maxChars) { add(row, opts); row = word; }
      else row = row ? `${row} ${word}` : word;
    }
    if (row) add(row, opts);
  };
  add('Factura Electrónica de Venta', { size: 10, bold: true, center: true });
  addWrapped((business?.name || 'Supermercado StockFlow').toUpperCase(), { size: 12, bold: true, center: true }, 32);
  if (business?.documentNumber) add(`${business.documentType || 'NIT'}: ${business.documentNumber}`, { center: true });
  if (business?.address) addWrapped(business.address, { center: true });
  if (business?.city) addWrapped(business.city, { center: true });
  if (business?.phone) add(`Teléfono: ${business.phone}`, { center: true });
  add('------------------------------------------------', { gap: 5 });
  const date = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const dateText = date.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  addWrapped(`Fecha: ${dateText}`, { size: 8 });
  add(`Recibo #${ref}`, { size: 8 });
  if (adminName) addWrapped(`Atendió: ${adminName}`, { size: 8 });
  if (sale.customerName) addWrapped(`Cliente: ${sale.customerName}${sale.customerCedula ? ` (CC: ${sale.customerCedula})` : ''}`, { size: 8 });
  add('------------------------------------------------', { gap: 5 });
  add('Detalle de productos:', { bold: true });
  sale.items.forEach(item => {
    addWrapped(`${item.quantity} x ${item.product.name} — ${money(item.subtotal, currency)}`);
  });
  add('------------------------------------------------', { gap: 5 });
  add(`TOTAL: ${money(sale.totalAmount, currency)}`, { size: 11, bold: true });
  add(`Pago: ${paymentLabel[sale.paymentMethod] || sale.paymentMethod}`, { size: 8 });
  if (sale.cashGiven != null && sale.paymentMethod === 'EFECTIVO') add(`Recibido: ${money(sale.cashGiven, currency)}`, { size: 8 });
  if (sale.changeGiven && sale.changeGiven > 0) add(`Cambio / vuelto: ${money(sale.changeGiven, currency)}`, { size: 8 });
  if (sale.pendingAmount && sale.pendingAmount > 0) add(`Saldo pendiente: ${money(sale.pendingAmount, currency)}`, { size: 8 });
  if (sale.customerNote) add(`Nota: ${sale.customerNote}`, { size: 8, gap: 4 });
  add('------------------------------------------------', { gap: 7 });
  addWrapped(business?.receiptMessage || 'Gracias por su compra! Vuelva pronto.', { size: 9, center: true });
  add('StockFlow Connect POS - Software de Gestion', { size: 7, center: true, gap: 5 });

  const width = 300, left = 20, top = 28;
  let y = top;
  for (const line of lines) y += (line.gap || 0) + line.size + 3;
  const height = y + 22;
  // Rebuild text positions from top to bottom in PDF's bottom-up coordinate system.
  y = top;
  const positioned = lines.map(line => {
    y += line.gap || 0;
    const baseline = height - y - line.size;
    const x = line.center ? Math.max(left, (width - line.text.length * line.size * 0.52) / 2) : left;
    const command = `BT /${line.bold ? 'F2' : 'F1'} ${line.size} Tf 1 0 0 1 ${x.toFixed(1)} ${baseline.toFixed(1)} Tm ${pdfHex(line.text)} Tj ET`;
    y += line.size + 3;
    return command;
  }).join('\n');
  const stream = `0.08 0.1 0.15 rg\n${positioned}`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => { offsets.push(new TextEncoder().encode(pdf).length); pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([new TextEncoder().encode(pdf)], `Recibo-${ref}.pdf`, { type: 'application/pdf' });
}

export function buildReceiptWhatsAppText(sale: ReceiptSale, business: any, adminName?: string) {
  const currency = business?.currency || 'COP';
  const ref = sale.id.slice(-8).toUpperCase();
  const date = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const lines = ['Factura Electrónica de Venta', business?.name || 'Supermercado StockFlow'];
  if (business?.documentNumber) lines.push(`${business.documentType || 'NIT'}: ${business.documentNumber}`);
  if (business?.address) lines.push(`Dirección: ${business.address}`);
  if (business?.city) lines.push(business.city);
  if (business?.phone) lines.push(`Teléfono: ${business.phone}`);
  lines.push('', `Fecha: ${date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`, `Recibo #${ref}`);
  if (adminName) lines.push(`Atendió: ${adminName}`);
  if (sale.customerName) lines.push(`Cliente: ${sale.customerName}${sale.customerCedula ? ` (CC: ${sale.customerCedula})` : ''}`);
  lines.push('', 'Detalle de productos:');
  sale.items.forEach(item => lines.push(`${item.quantity} x ${item.product.name} — ${money(item.subtotal, currency)}`));
  lines.push('', `TOTAL: ${money(sale.totalAmount, currency)}`, `Pago: ${paymentLabel[sale.paymentMethod] || sale.paymentMethod}`);
  if (sale.cashGiven != null && sale.paymentMethod === 'EFECTIVO') lines.push(`Recibido: ${money(sale.cashGiven, currency)}`);
  if (sale.changeGiven && sale.changeGiven > 0) lines.push(`Cambio / vuelto: ${money(sale.changeGiven, currency)}`);
  if (sale.pendingAmount && sale.pendingAmount > 0) lines.push(`Saldo pendiente: ${money(sale.pendingAmount, currency)}`);
  if (sale.customerNote) lines.push(`Nota: ${sale.customerNote}`);
  lines.push('', business?.receiptMessage || '¡Gracias por tu compra! Vuelve pronto.');
  return lines.join('\n').replace(/\uFFFD/g, '');
}

export function sendReceiptByWhatsApp(sale: ReceiptSale, business: any, adminName?: string) {
  const text = encodeURIComponent(buildReceiptWhatsAppText(sale, business, adminName));
  const phone = sale.customerPhone?.replace(/\D/g, '') || '';
  const targetPhone = phone ? (phone.startsWith('57') ? phone : `57${phone}`) : '';
  window.open(targetPhone ? `https://wa.me/${targetPhone}?text=${text}` : `https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  return Boolean(targetPhone);
}

export function downloadReceiptPdf(sale: ReceiptSale, business: any, adminName?: string) {
  const file = createReceiptPdf(sale, business, adminName);
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
