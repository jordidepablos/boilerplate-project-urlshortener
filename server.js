require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const privateKey = fs.existsSync('certs/privkey.pem')
  ? fs.readFileSync('certs/privkey.pem', 'utf8')
  : undefined;
const certificate = fs.existsSync('certs/cert.pem')
  ? fs.readFileSync('certs/cert.pem', 'utf8')
  : undefined;
const credentials = privateKey !== undefined && certificate !== undefined
  ? { key: privateKey, cert: certificate }
  : undefined;
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Database
let database = [];

// Urlshortener API
app.use('/api/shorturl', bodyParser.urlencoded({ extended: false }));
app.post('/api/shorturl', (req, res, next) => {
  const originalUrl = req.body.url;
  const regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
  if (!regex.test(originalUrl)) return next(new Error('invalid url'));
  database.push({
    original_url: originalUrl,
    short_url: database.length
  });
  res.json(database[database.length-1]);
});

app.get('/api/shorturl/:short_url', (req, res, next) => {
  const item = database.find(val => val.short_url === parseInt(req.params.short_url));
  if (!item) return next(new Error('invalid url'));
  res.redirect(item.original_url);
});

//Error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.json({ error: err.message });
});

// Listen for requests
let apiServer;
if (credentials)
  apiServer = https.createServer(credentials, app);
else
  apiServer = http.createServer(app);

apiServer.listen(port, function () {
  console.log('Your app is listening on port ' + apiServer.address().port);
});
/*
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
*/