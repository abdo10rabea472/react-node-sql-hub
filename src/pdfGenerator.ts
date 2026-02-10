import jsPDF from 'jspdf';

interface PdfInvoiceData {
  studioName: string;
  address?: string;
  phone?: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  createdAt?: string;
  createdBy: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  participants?: string;
  weddingDate?: string;
  venue?: string;
  items: { name: string; price: number }[];
  lang: 'ar' | 'en';
}

export const generateInvoicePdfBase64 = (data: PdfInvoiceData): string => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Helper for centered text
  const centerText = (text: string, yPos: number, size: number, style: string = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // Helper for right-aligned text
  const rightText = (text: string, yPos: number, size: number, style: string = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - margin - textWidth + 10, yPos);
  };

  // Studio Name
  doc.setTextColor(0, 0, 0);
  centerText(data.studioName, y, 18, 'bold');
  y += 8;

  // Address & Phone
  if (data.address) {
    doc.setTextColor(136, 136, 136);
    centerText(data.address, y, 9);
    y += 5;
  }
  if (data.phone) {
    doc.setTextColor(136, 136, 136);
    centerText(data.phone, y, 9);
    y += 5;
  }

  // Line
  y += 3;
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Invoice Number
  doc.setTextColor(136, 136, 136);
  centerText(data.lang === 'ar' ? 'Invoice No' : 'Invoice No', y, 9);
  y += 7;
  doc.setTextColor(0, 0, 0);
  centerText(data.invoiceNo, y, 20, 'bold');
  y += 10;

  // Date & Time
  if (data.createdAt) {
    const d = new Date(data.createdAt);
    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    doc.text('Date', margin, y);
    rightText('Time', y, 8);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(d.toLocaleDateString('en-US'), margin, y);
    rightText(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), y, 10, 'bold');
    y += 8;
  }

  // Wedding info
  if (data.weddingDate || data.venue) {
    doc.setDrawColor(221, 221, 221);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    doc.text('Wedding Date', margin, y);
    rightText('Venue', y, 8);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(data.weddingDate || '---', margin, y);
    rightText(data.venue || '---', y, 10, 'bold');
    y += 8;
  }

  // Line
  doc.setDrawColor(221, 221, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Customer info
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text('Customer', margin, y);
  rightText('Phone', y, 8);
  y += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.customerName, margin, y);
  rightText(data.customerPhone, y, 11, 'bold');
  y += 8;

  // Participants
  if (data.participants) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Participants: ${data.participants}`, margin, y);
    y += 7;
  }

  // Thick line before items
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Table header
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.setFont('helvetica', 'bold');
  doc.text('#', margin, y);
  doc.text('Item', margin + 12, y);
  rightText('Amount', y, 8, 'bold');
  y += 5;

  // Line
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  data.items.forEach((item, i) => {
    doc.setFontSize(9);
    doc.setTextColor(153, 153, 153);
    doc.text((i + 1).toString(), margin, y);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name || '---', margin + 12, y);
    rightText(`${item.price} ${data.currency}`, y, 10, 'bold');
    y += 7;
  });

  // Thick line after items
  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Totals
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 102, 102);
  doc.text('Total', margin, y);
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  rightText(`${data.totalAmount} ${data.currency}`, y, 13, 'bold');
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(40, 167, 69);
  doc.text(`Paid: ${data.paidAmount} ${data.currency}`, margin, y);
  
  const remColor = data.remainingAmount > 0 ? [220, 53, 69] : [40, 167, 69];
  doc.setTextColor(remColor[0], remColor[1], remColor[2]);
  rightText(`Remaining: ${data.remainingAmount} ${data.currency}`, y, 9, 'bold');
  y += 12;

  // Footer line
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Manager
  doc.setTextColor(153, 153, 153);
  centerText(`Manager: ${data.createdBy}`, y, 9);
  y += 8;

  // Thank you
  doc.setTextColor(0, 0, 0);
  centerText(data.lang === 'ar' ? 'Thank you ✦' : 'Thank you for choosing us ✦', y, 12, 'bold');
  y += 6;
  doc.setTextColor(153, 153, 153);
  centerText(data.studioName.toUpperCase(), y, 8, 'bold');

  // Return base64 without the data:... prefix
  const pdfOutput = doc.output('datauristring');
  // Extract pure base64 from data URI
  const base64 = pdfOutput.split(',')[1];
  return base64;
};
