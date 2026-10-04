const PDFDocument = require('pdfkit');

/**
 * Generates a professional PDF invoice
 * @param {Object} invoice - Invoice database object populated with customer
 * @param {Object} company - CompanySettings database object
 * @param {Stream} writeStream - Stream to write the PDF data to
 */
const generateInvoicePDF = (invoice, company, writeStream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.pipe(writeStream);

  // Colors
  const primaryColor = '#1e293b'; // Slate 800
  const secondaryColor = '#475569'; // Slate 600
  const lightGrey = '#f1f5f9'; // Slate 100
  const accentColor = '#3b82f6'; // Blue 500

  // 1. Header Section
  doc
    .fillColor(primaryColor)
    .fontSize(24)
    .text(company.companyName || 'SAHU TRADERS', 50, 45, { bold: true })
    .fontSize(10)
    .fillColor(secondaryColor)
    .text(company.address || '', 50, 75)
    .text(`Mobile: ${company.mobile || ''} | Email: ${company.email || ''}`, 50, 90)
    .text(`GSTIN: ${company.gstin || 'N/A'}`, 50, 105);

  // Invoice Meta
  doc
    .fillColor(primaryColor)
    .fontSize(14)
    .text('INVOICE', 400, 45, { align: 'right', bold: true })
    .fontSize(10)
    .fillColor(secondaryColor)
    .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 65, { align: 'right' })
    .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 400, 80, { align: 'right' })
    .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'On Receipt'}`, 400, 95, { align: 'right' })
    .text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 400, 110, { align: 'right', color: accentColor });

  // Divider Line
  doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#cbd5e1').stroke();

  // 2. Bill To / Ship To Section
  doc
    .fillColor(primaryColor)
    .fontSize(12)
    .text('Bill To:', 50, 145, { bold: true })
    .fontSize(10)
    .fillColor(secondaryColor)
    .text(invoice.customer.name, 50, 160, { bold: true })
    .text(invoice.customer.address || 'No Address Provided', 50, 175, { width: 250 })
    .text(`Mobile: ${invoice.customer.mobile}`, 50, 205)
    .text(`GSTIN: ${invoice.customer.gstin || 'N/A'}`, 50, 220);

  // Spacer
  let y = 250;

  // 3. Table Header
  doc.rect(50, y, 500, 20).fill(lightGrey);
  doc.fillColor(primaryColor).fontSize(9);
  doc.text('Item Description', 60, y + 6, { bold: true });
  doc.text('Specs (Size/Color/GSM)', 200, y + 6, { bold: true });
  doc.text('Qty', 350, y + 6, { width: 30, align: 'right', bold: true });
  doc.text('Rate', 390, y + 6, { width: 60, align: 'right', bold: true });
  doc.text('Amount', 460, y + 6, { width: 80, align: 'right', bold: true });

  y += 20;

  // 4. Table Body Items
  invoice.items.forEach((item, index) => {
    // Zebra striping
    if (index % 2 === 1) {
      doc.rect(50, y, 500, 20).fill('#f8fafc');
    }
    doc.fillColor(secondaryColor);

    // Item details
    doc.text(item.itemName, 60, y + 6, { width: 130, height: 12, ellipsis: true });
    
    // Specification rendering
    const specs = [item.size, item.colour, item.gsm ? `${item.gsm} GSM` : '', item.packing].filter(Boolean).join(' | ');
    doc.text(specs || '-', 200, y + 6, { width: 140, height: 12, ellipsis: true });
    
    doc.text(item.quantity.toString(), 350, y + 6, { width: 30, align: 'right' });
    doc.text(item.rate.toFixed(2), 390, y + 6, { width: 60, align: 'right' });
    doc.text(item.amount.toFixed(2), 460, y + 6, { width: 80, align: 'right' });

    y += 20;
  });

  // Spacer
  y += 10;

  // 5. Invoice Summary Table
  const summaryX = 350;
  doc.moveTo(summaryX, y).lineTo(550, y).strokeColor('#e2e8f0').stroke();
  y += 5;

  doc.fillColor(secondaryColor).fontSize(10);
  doc.text('Subtotal:', summaryX, y, { width: 100, align: 'left' });
  doc.text(`Rs. ${invoice.subTotal.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
  y += 18;

  if (invoice.taxRate > 0) {
    doc.text(`GST (${invoice.taxRate}%):`, summaryX, y, { width: 100, align: 'left' });
    doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
    y += 18;
  }

  doc.fillColor(primaryColor).fontSize(11);
  doc.text('Grand Total:', summaryX, y, { width: 100, align: 'left', bold: true });
  doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, 450, y, { width: 90, align: 'right', bold: true });
  y += 20;

  doc.fillColor(secondaryColor).fontSize(10);
  doc.text('Paid Amount:', summaryX, y, { width: 100, align: 'left' });
  doc.text(`Rs. ${invoice.paidAmount.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
  y += 18;

  doc.fillColor(accentColor).fontSize(11);
  doc.text('Balance Due:', summaryX, y, { width: 100, align: 'left', bold: true });
  doc.text(`Rs. ${invoice.outstandingAmount.toFixed(2)}`, 450, y, { width: 90, align: 'right', bold: true });
  
  // 6. Notes section
  if (invoice.notes) {
    y += 30;
    doc.fillColor(primaryColor).fontSize(10).text('Notes:', 50, y, { bold: true });
    doc.fillColor(secondaryColor).fontSize(9).text(invoice.notes, 50, y + 15, { width: 280 });
  }

  // 7. Footer
  doc.fontSize(8).fillColor('#94a3b8').text('Thank you for your business!', 50, 750, { align: 'center' });

  doc.end();
};

module.exports = { generateInvoicePDF };
