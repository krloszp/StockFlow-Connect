import React from 'react';
import { Download, Printer, Share2 } from 'lucide-react';

interface ReceiptActionsProps {
  onWhatsApp: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
}

export const ReceiptActions: React.FC<ReceiptActionsProps> = ({ onWhatsApp, onDownloadPdf, onPrint }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', width: '100%' }}>
    <button
      className="btn btn-primary"
      type="button"
      onClick={onWhatsApp}
      style={{ minWidth: 0, padding: '0.7rem 0.45rem', background: '#25D366', borderColor: '#25D366', color: '#fff', justifyContent: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
    >
      <Share2 size={16} /> WhatsApp
    </button>
    <button className="btn btn-secondary" type="button" onClick={onDownloadPdf} style={{ minWidth: 0, padding: '0.7rem 0.45rem', justifyContent: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
      <Download size={16} /> PDF
    </button>
    <button className="btn btn-secondary" type="button" onClick={onPrint} style={{ minWidth: 0, padding: '0.7rem 0.45rem', justifyContent: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
      <Printer size={16} /> Imprimir
    </button>
  </div>
);
