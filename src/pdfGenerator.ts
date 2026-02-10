import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const buildInvoiceHTML = (data: PdfInvoiceData): string => {
  const isAr = data.lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const align = isAr ? 'right' : 'left';
  const alignOpp = isAr ? 'left' : 'right';

  const labels = isAr ? {
    invoiceNo: 'رقم الفاتورة',
    customer: 'العميل',
    phone: 'الهاتف',
    date: 'التاريخ',
    time: 'الوقت',
    weddingDate: 'تاريخ الفرح',
    venue: 'المكان',
    item: 'الصنف',
    amount: 'المبلغ',
    total: 'الإجمالي',
    paid: 'المدفوع',
    remaining: 'المتبقي',
    manager: 'المسؤول',
    participants: 'المشاركين',
    thankYou: 'شكراً لتعاملكم معنا ✦',
  } : {
    invoiceNo: 'Invoice No',
    customer: 'Customer',
    phone: 'Phone',
    date: 'Date',
    time: 'Time',
    weddingDate: 'Wedding Date',
    venue: 'Venue',
    item: 'Item',
    amount: 'Amount',
    total: 'Total',
    paid: 'Paid',
    remaining: 'Remaining',
    manager: 'Manager',
    participants: 'Participants',
    thankYou: 'Thank you for choosing us ✦',
  };

  const itemsHTML = data.items.map((it, i) => `
    <tr>
      <td style="padding:3px 4px;font-size:10px;color:#999;text-align:center;">${i + 1}</td>
      <td style="padding:3px 4px;font-size:11px;font-weight:bold;">${it.name || '---'}</td>
      <td style="padding:3px 4px;font-size:11px;font-weight:bold;text-align:${alignOpp};">${it.price} ${data.currency}</td>
    </tr>
  `).join('');

  let dateSection = '';
  if (data.createdAt) {
    const d = new Date(data.createdAt);
    dateSection = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <div><span style="font-size:8px;color:#888;">${labels.date}</span><br><b style="font-size:10px;">${d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</b></div>
        <div style="text-align:${alignOpp};"><span style="font-size:8px;color:#888;">${labels.time}</span><br><b style="font-size:10px;">${d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</b></div>
      </div>
    `;
  }

  let weddingSection = '';
  if (data.weddingDate || data.venue) {
    weddingSection = `
      <div style="border-top:1px solid #ddd;padding-top:5px;margin-bottom:6px;display:flex;justify-content:space-between;">
        <div><span style="font-size:8px;color:#888;">${labels.weddingDate}</span><br><b style="font-size:10px;">${data.weddingDate || '---'}</b></div>
        <div style="text-align:${alignOpp};"><span style="font-size:8px;color:#888;">${labels.venue}</span><br><b style="font-size:10px;">${data.venue || '---'}</b></div>
      </div>
    `;
  }

  const remColor = data.remainingAmount > 0 ? '#dc3545' : '#28a745';

  return `
    <div id="pdf-invoice" dir="${dir}" style="width:340px;padding:12px 10px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#fff;color:#000;text-align:${align};line-height:1.4;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:6px;">
        <div style="font-size:16px;font-weight:bold;">${data.studioName}</div>
        ${data.address ? `<div style="font-size:8px;color:#888;">${data.address}</div>` : ''}
        ${data.phone ? `<div style="font-size:8px;color:#888;">${data.phone}</div>` : ''}
      </div>

      <hr style="border:none;border-top:1px solid #ddd;margin:6px 0;">

      <!-- Invoice No -->
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:8px;color:#888;">${labels.invoiceNo}</div>
        <div style="font-size:18px;font-weight:bold;">${data.invoiceNo}</div>
      </div>

      ${dateSection}
      ${weddingSection}

      <hr style="border:none;border-top:1px solid #ddd;margin:6px 0;">

      <!-- Customer -->
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <div><span style="font-size:8px;color:#888;">${labels.customer}</span><br><b style="font-size:11px;">${data.customerName}</b></div>
        <div style="text-align:${alignOpp};"><span style="font-size:8px;color:#888;">${labels.phone}</span><br><b style="font-size:11px;">${data.customerPhone}</b></div>
      </div>

      ${data.participants ? `<div style="font-size:9px;color:#555;margin-bottom:6px;">${labels.participants}: ${data.participants}</div>` : ''}

      <hr style="border:none;border-top:2px solid #000;margin:6px 0;">

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <thead>
          <tr style="border-bottom:1px solid #ddd;">
            <th style="padding:3px 4px;font-size:8px;color:#888;text-align:center;width:20px;">#</th>
            <th style="padding:3px 4px;font-size:8px;color:#888;text-align:${align};">${labels.item}</th>
            <th style="padding:3px 4px;font-size:8px;color:#888;text-align:${alignOpp};">${labels.amount}</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <hr style="border:none;border-top:2px solid #000;margin:6px 0;">

      <!-- Totals -->
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-size:9px;color:#666;font-weight:bold;">${labels.total}</span>
        <span style="font-size:14px;font-weight:bold;">${data.totalAmount} ${data.currency}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-size:9px;color:#28a745;font-weight:bold;">${labels.paid}: ${data.paidAmount} ${data.currency}</span>
        <span style="font-size:9px;color:${remColor};font-weight:bold;">${labels.remaining}: ${data.remainingAmount} ${data.currency}</span>
      </div>

      <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">

      <!-- Footer -->
      <div style="text-align:center;">
        <div style="font-size:8px;color:#999;">${labels.manager}: ${data.createdBy}</div>
        <div style="font-size:11px;font-weight:bold;margin-top:5px;">${labels.thankYou}</div>
        <div style="font-size:7px;color:#999;font-weight:bold;margin-top:3px;">${data.studioName.toUpperCase()}</div>
      </div>
    </div>
  `;
};

export const generateInvoicePdfBase64 = async (data: PdfInvoiceData): Promise<string> => {
  // Create hidden container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  container.innerHTML = buildInvoiceHTML(data);
  document.body.appendChild(container);

  const invoiceEl = container.querySelector('#pdf-invoice') as HTMLElement;

  try {
    const canvas = await html2canvas(invoiceEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // 100mm width receipt
    const pdfWidthMM = 100;
    const margin = 2;
    const contentWidthMM = pdfWidthMM - margin * 2;
    const aspectRatio = canvas.height / canvas.width;
    const contentHeightMM = contentWidthMM * aspectRatio;
    const pdfHeightMM = contentHeightMM + margin * 2;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidthMM, pdfHeightMM],
    });

    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', margin, margin, contentWidthMM, contentHeightMM);

    const pdfOutput = doc.output('datauristring');
    const base64 = pdfOutput.split(',')[1];
    return base64;
  } finally {
    document.body.removeChild(container);
  }
};
