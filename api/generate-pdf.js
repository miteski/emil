const { jsPDF } = require('jspdf');
const fs = require('fs').promises;
const path = require('path');

async function generatePDF(jsonData) {
  const doc = new jsPDF();
  
  // Add the header
  doc.setFontSize(25);
  doc.text('Your Company Name', 20, 20);
  
  // Add the date
  doc.setFontSize(15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
  
  // Add the main content
  doc.setFontSize(12);
  doc.text(`Agent: ${jsonData.agentName}`, 20, 60);
  doc.text(`Statement Period: ${jsonData.statementPeriod}`, 20, 70);
  
  // Add the table header
  const tableTop = 90;
  doc.setFont("helvetica", "bold");
  doc.text('Policy Number', 20, tableTop);
  doc.text('Policy Type', 70, tableTop);
  doc.text('Premium', 120, tableTop);
  doc.text('Commission', 170, tableTop);
  
  // Add the table rows
  let yPosition = tableTop + 10;
  doc.setFont("helvetica", "normal");
  jsonData.policies.forEach(policy => {
    doc.text(policy.policyNumber, 20, yPosition);
    doc.text(policy.policyType, 70, yPosition);
    doc.text(`$${policy.premium.toFixed(2)}`, 120, yPosition);
    doc.text(`$${policy.commission.toFixed(2)}`, 170, yPosition);
    yPosition += 10;
    
    if (yPosition > 280) {  // Check if we need a new page
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Add total commission
  doc.setFont("helvetica", "bold");
  doc.text(`Total Commission: $${jsonData.totalCommission.toFixed(2)}`, 20, yPosition + 20);
  
  // Return the PDF as a Uint8Array
  return doc.output('arraybuffer');
}

module.exports = { generatePDF };
