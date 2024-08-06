const mysql = require('mysql2/promise');
require('dotenv').config();

async function runTests() {
    console.log('Running tests...');

    const testResults = {
        dbConnection: false,
        tenantsFetch: false,
    };

    let connection;

    try {
        // Test database connection
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });
        testResults.dbConnection = true;
        console.log('Database connection successful');

        // Test fetching tenants
        const [rows] = await connection.execute('SELECT * FROM Tenant LIMIT 1');
        testResults.tenantsFetch = rows.length > 0;
        console.log('Fetching tenants successful');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }

    console.log('Test results:', testResults);

    if (Object.values(testResults).every(result => result === true)) {
        console.log('All tests passed!');
        process.exit(0);
    } else {
        console.error('Some tests failed!');
        process.exit(1);
    }
}

runTests();
