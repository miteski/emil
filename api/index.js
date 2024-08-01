const express = require('express');
const app = express();

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Commission Calculator API');
});

// API route
app.post('/api/calculate-commission', (req, res) => {
  const { policyId, premiumAmount } = req.body;
  
  // For now, let's use a hardcoded rate
  const rate = 0.1;
  const commissionAmount = premiumAmount * rate;

  res.json({
    policyId,
    commissionAmount,
    rateUsed: rate
  });
});

// For Vercel, we need to export the Express app
module.exports = app;

// For local testing, uncomment these lines:
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
