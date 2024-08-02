async function virusScan(fileBuffer, testHash = null) {
    const hash = testHash || crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    try {
        const response = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
            headers: {
                'x-apikey': process.env.VIRUSTOTAL_API_KEY
            }
        });

        const stats = response.data.data.attributes.last_analysis_stats;
        const isClean = stats.malicious === 0 && stats.suspicious === 0;

        return { isClean, hash };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // File not previously scanned, consider it clean
            return { isClean: true, hash };
        }
        console.error('Virus scan error:', error);
        throw new Error('Virus scan failed');
    }
}
