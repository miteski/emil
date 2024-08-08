const { jsPDF } = require('jspdf');

function generatePDF(jsonData) {
  const doc = new jsPDF();

  // Add the header
  doc.setFontSize(25);
  doc.text('Your Company Name', 20, 20);
  
  // Note: Adding an image in a serverless environment might be tricky
  // You may need to use a base64 encoded image or fetch it from a URL
  // doc.addImage('path/to/logo.png', 'PNG', 15, 40, 30, 30);

  doc.setFontSize(15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);

  // Add the main content
  doc.setFontSize(12);
  doc.text(`Customer: ${jsonData.customerName}`, 20, 60);
  doc.text(`Order Number: ${jsonData.orderNumber}`, 20, 70);

  // Add the table header
  const tableTop = 90;
  doc.setFont("helvetica", "bold");
  doc.text('Item', 20, tableTop);
  doc.text('Quantity', 70, tableTop);
  doc.text('Price', 120, tableTop);
  doc.text('Total', 170, tableTop);

  // Add the table rows
  let yPosition = tableTop + 10;
  doc.setFont("helvetica", "normal");
  jsonData.items.forEach(item => {
    doc.text(item.name, 20, yPosition);
    doc.text(item.quantity.toString(), 70, yPosition);
    doc.text(`$${item.price.toFixed(2)}`, 120, yPosition);
    doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 170, yPosition);
    yPosition += 10;

    if (yPosition > 280) {  // Check if we need a new page
      doc.addPage();
      yPosition = 20;
    }
  });

  // Return the PDF as a Uint8Array
  return doc.output('arraybuffer');
}

module.exports = { generatePDF };
