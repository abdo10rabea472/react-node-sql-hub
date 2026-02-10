import html2canvas from 'html2canvas';
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

export const generateInvoicePdfBase64 = async (data: PdfInvoiceData): Promise<string> => {
  const isAr = data.lang === 'ar';

  // Create a temporary container for the HTML content
  const element = document.createElement('div');
  element.style.width = '500px'; // Set a fixed width in pixels for consistent canvas capture
  element.style.padding = '40px';
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#000000';
  element.style.fontFamily = "'Cairo', 'Inter', sans-serif";
  element.style.direction = isAr ? 'rtl' : 'ltr';
  // Keep it in the DOM but behind everything
  element.style.position = 'fixed';
  element.style.top = '0';
  element.style.left = '0';
  element.style.zIndex = '-9999';
  element.style.visibility = 'visible';

  const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '';
  const timeStr = data.createdAt ? new Date(data.createdAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  element.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap');
      .pdf-container { font-family: 'Cairo', sans-serif !important; }
    </style>
    <div class="pdf-container">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #000;">${data.studioName}</h1>
        ${data.address ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">${data.address}</p>` : ''}
        ${data.phone ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">${data.phone}</p>` : ''}
      </div>

      <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>

      <div style="text-align: center; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold;">
          ${isAr ? 'رقم الفاتورة' : 'Invoice No'}
        </p>
        <h2 style="margin: 5px 0; font-size: 36px; font-weight: 900;">${data.invoiceNo}</h2>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 20px;">
        <div>
          <span style="color: #888;">${isAr ? 'التاريخ:' : 'Date:'}</span>
          <span style="font-weight: bold; margin-${isAr ? 'right' : 'left'}: 5px;">${dateStr}</span>
        </div>
        <div>
          <span style="color: #888;">${isAr ? 'الوقت:' : 'Time:'}</span>
          <span style="font-weight: bold; margin-${isAr ? 'right' : 'left'}: 5px;">${timeStr}</span>
        </div>
      </div>

      ${(data.weddingDate || data.venue) ? `
      <div style="border-top: 1px solid #eee; padding-top: 15px; margin-bottom: 20px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #888;">${isAr ? 'تاريخ الحفل:' : 'Wedding Date:'}</span>
          <span style="font-weight: bold;">${data.weddingDate || '---'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #888;">${isAr ? 'مكان الحفل:' : 'Venue:'}</span>
          <span style="font-weight: bold;">${data.venue || '---'}</span>
        </div>
      </div>
      ` : ''}

      <div style="border-top: 1px solid #eee; padding-top: 15px; margin-bottom: 20px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #888;">${isAr ? 'العميل:' : 'Customer:'}</span>
          <span style="font-weight: bold;">${data.customerName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #888;">${isAr ? 'الهاتف:' : 'Phone:'}</span>
          <span style="font-weight: bold; direction: ltr;">${data.customerPhone}</span>
        </div>
      </div>

      ${data.participants ? `
      <div style="background: #f9f9f9; padding: 15px; border-radius: 12px; margin-bottom: 25px; font-size: 13px; border-r-4: border-black;">
         <span style="color: #888; font-weight: bold; display: block; margin-bottom: 5px;">${isAr ? 'المشاركين:' : 'Participants:'}</span>
         <p style="margin: 0; font-weight: bold;">${data.participants}</p>
      </div>
      ` : ''}

      <div style="border-top: 2px solid #000; margin-bottom: 15px;"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 25px;">
        <thead>
          <tr style="color: #888; text-transform: uppercase; font-weight: bold;">
            <th style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: ${isAr ? 'right' : 'left'};">#</th>
            <th style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'الباقة' : 'Item'}</th>
            <th style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: ${isAr ? 'left' : 'right'};">${isAr ? 'المبلغ' : 'Amount'}</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, i) => `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #999;">${i + 1}</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">${item.name}</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: ${isAr ? 'left' : 'right'}; font-weight: bold;">${item.price} ${data.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top: 2px solid #000; padding-top: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-weight: bold; color: #666;">${isAr ? 'الإجمالي' : 'Total'}</span>
          <span style="font-size: 22px; font-weight: 900;">${data.totalAmount} ${data.currency}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #28a745;">
          <span style="font-weight: bold;">${isAr ? 'المدفوع' : 'Paid'}</span>
          <span style="font-weight: 900; font-size: 16px;">${data.paidAmount} ${data.currency}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: ${data.remainingAmount > 0 ? '#dc3545' : '#28a745'};">
          <span style="font-weight: bold;">${isAr ? 'المتبقي' : 'Remaining'}</span>
          <span style="font-size: 20px; font-weight: 900;">${data.remainingAmount} ${data.currency}</span>
        </div>
      </div>

      <div style="border-top: 1px solid #eee; margin: 30px 0 20px 0;"></div>

      <div style="text-align: center; font-size: 13px; color: #999; margin-bottom: 20px;">
        <p style="margin: 0;">${isAr ? 'المسؤول:' : 'Manager:'} ${data.createdBy}</p>
        <p style="margin: 15px 0; font-weight: bold; color: #000; font-size: 16px;">
          ${isAr ? 'شكراً لتعاملكم معنا ✦' : 'Thank you for choosing us ✦'}
        </p>
        <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${data.studioName}</p>
      </div>
    </div>
  `;

  document.body.appendChild(element);

  try {
    // Wait for fonts to load properly
    await document.fonts.ready;
    // Extra safety wait for the @import font
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture the element using html2canvas directly
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create jsPDF document
    const pdf = new jsPDF({
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

    const base64 = pdf.output('datauristring').split(',')[1];

    document.body.removeChild(element);
    return base64;
  } catch (error) {
    console.error('Error in generateInvoicePdfBase64:', error);
    if (element.parentNode) document.body.removeChild(element);
    throw error;
  }
};


