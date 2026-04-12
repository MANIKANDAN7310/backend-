const http = require('http');

const data = JSON.stringify({
    email: "premium_customer@example.com"
});

const options = {
    hostname: 'localhost',
    port: 5051,
    path: '/api/products/download/1774887784445', // Enamel pin mock id
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', d => responseBody += d);
    res.on('end', () => {
        console.log("Mock Download Test Response:", responseBody);
        
        // Follow-up test: Verify GET /api/clients actually returns this user.
        http.get('http://localhost:5051/api/clients', (resList) => {
            let listData = '';
            resList.on('data', d => listData += d);
            resList.on('end', () => {
                const clients = JSON.parse(listData).clients;
                console.log(`Verified! Active Clients: ${clients.length}`);
                console.log("Client Data: ", clients.find(c => c.email === 'premium_customer@example.com')?.client_name);
            });
        });
    });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
