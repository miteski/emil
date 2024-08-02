// Add new agent
app.post('/api/agents', async (req, res) => {
    const { fullname, email, tenantId } = req.body;
    
    try {
        const [result] = await pool.query(
            'INSERT INTO Agent (Fullname, Email, TenantID) VALUES (?, ?, ?)',
            [fullname, email, tenantId]
        );
        const agentId = result.insertId;

        res.status(201).json({ message: 'Agent added successfully', agentId: agentId });
    } catch (error) {
        console.error('Error adding agent:', error);
        res.status(500).json({ error: 'Error adding agent', details: error.message });
    }
});

// Add payment details
app.post('/api/payment-details', async (req, res) => {
    const { agentId, bankName, iban, bic, accountHolderName, paymentMethod } = req.body;
    
    try {
        const [result] = await pool.query(
            'INSERT INTO Agent_Payment_Details (BankName, IBAN, BIC, AccountHolderName, PaymentMethod) VALUES (?, ?, ?, ?, ?)',
            [bankName, iban, bic, accountHolderName, paymentMethod]
        );
        const paymentDetailsId = result.insertId;

        await pool.query(
            'UPDATE Agent SET Agent_Payment_Details_ID = ? WHERE AgentID = ?',
            [paymentDetailsId, agentId]
        );

        res.status(201).json({ message: 'Payment details added successfully', paymentDetailsId: paymentDetailsId });
    } catch (error) {
        console.error('Error adding payment details:', error);
        res.status(500).json({ error: 'Error adding payment details', details: error.message });
    }
});
