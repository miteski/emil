const express = require('express');
const app = express();

app.use(express.json());

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

module.exports = app;
