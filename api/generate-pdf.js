const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

// HTML template as a string
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{companyName}}</h1>
    </div>
    <p><strong>Date:</strong> {{date}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>Order Number:</strong> {{orderNumber}}</p>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{name}}</td>
                <td>{{quantity}}</td>
                <td>${{price}}</td>
                <td>${{total}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    
    <p><strong>Total Amount: ${{totalAmount}}</strong></p>
</body>
</html>
`;

// Function to replace placeholders in the HTML template
function renderTemplate(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  result = result.replace(/{{#each items}}([\s\S]*?){{\/each}}/g, (match, p1) => {
    return data.items.map(item => {
      let itemHtml = p1;
      for (const [key, value] of Object.entries(item)) {
        itemHtml = itemHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      return itemHtml;
    }).join('');
  });
  return result;
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const jsonData = req.body;
      
      // Render the HTML with the data
      const html = renderTemplate(htmlTemplate, {
        ...jsonData,
        date: new Date().toLocaleDateString(),
        totalAmount: jsonData.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)
      });
      
      // Launch a new browser instance
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set the HTML content of the page
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      // Close the browser
      await browser.close();
      
      // Send the PDF as the response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
      res.send(pdf);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'PDF generation failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
