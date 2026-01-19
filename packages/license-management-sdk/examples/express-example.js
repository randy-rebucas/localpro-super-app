// Example usage of license-management-sdk middleware in an Express app
const express = require('express');
const { licenseMiddleware } = require('../index');

const app = express();

// Use the middleware globally
app.use(licenseMiddleware({ expiry: '2099-12-31', issuer: 'LocalPro' }));

app.get('/protected', (req, res) => {
  res.json({ message: 'You have a valid license!', license: req.license });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
