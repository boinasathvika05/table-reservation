const fs = require('fs');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const runDiagnostics = async () => {
  console.log('=============================================');
  console.log('         BACKEND DIAGNOSTICS REPORT          ');
  console.log('=============================================');

  // 1. Node version
  console.log(`\n[1] Node.js Version: ${process.version}`);

  // 2. Internet connectivity
  process.stdout.write('[2] Internet Connectivity: ');
  try {
    await new Promise((resolve, reject) => {
      dns.resolve('google.com', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ OK');
  } catch (err) {
    console.log('❌ FAILED');
    console.log('    -> Cannot resolve google.com. Check your internet connection.');
  }

  // 3. .env exists
  const envPath = path.resolve(__dirname, '../../.env');
  process.stdout.write('[3] .env File: ');
  if (fs.existsSync(envPath)) {
    console.log('✅ Found');
    dotenv.config({ path: envPath });
  } else {
    console.log('❌ NOT FOUND');
    console.log(`    -> Missing at ${envPath}`);
  }

  // 4. MONGO_URI exists
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  process.stdout.write('[4] MONGO_URI in .env: ');
  if (uri) {
    console.log('✅ Found');
  } else {
    console.log('❌ NOT FOUND');
    console.log('    -> Please set MONGO_URI or MONGODB_URI in your .env file.');
  }

  if (!uri) {
    console.log('\nCannot continue diagnostics without MONGO_URI.');
    process.exit(1);
  }

  // 5. URI format
  process.stdout.write('[5] URI Format: ');
  let isValidFormat = true;
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.log('❌ INVALID');
    console.log('    -> Must start with mongodb:// or mongodb+srv://');
    isValidFormat = false;
  } else if (uri.includes('<db_password>') || uri.includes('<password>')) {
    console.log('❌ INVALID');
    console.log('    -> Contains a placeholder like <db_password>');
    isValidFormat = false;
  } else if (uri.includes(' ')) {
    console.log('❌ INVALID');
    console.log('    -> Contains spaces');
    isValidFormat = false;
  } else {
    console.log('✅ OK');
  }

  let host = 'unknown';
  if (isValidFormat) {
    try {
      const parsedUrl = new URL(uri);
      host = parsedUrl.hostname;
      // 6. Atlas hostname
      process.stdout.write('[6] Atlas Hostname: ');
      if (host) {
        console.log(`✅ ${host}`);
      } else {
        console.log('❌ INVALID');
      }
    } catch(e) {
        console.log('[6] Atlas Hostname: ❌ COULD NOT PARSE');
    }
  }

  // 7. DNS resolution for Atlas
  if (host && host !== 'unknown') {
    process.stdout.write(`[7] DNS Resolution for ${host}: `);
    try {
      const addresses = await new Promise((resolve, reject) => {
        dns.resolve(host, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });
      console.log(`✅ OK (${addresses.join(', ')})`);
    } catch (err) {
      console.log('❌ FAILED');
      console.log(`    -> DNS Error: ${err.message}`);
      console.log('    -> Suggestion: Try using Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1)');
    }
  } else {
    console.log('[7] DNS Resolution: Skipped due to invalid hostname.');
  }

  // 8. MongoDB connection
  process.stdout.write('\n[8] MongoDB Connection: ');
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ CONNECTED');
    console.log(`    -> Database: ${conn.connection.name}`);
    await mongoose.connection.close();
  } catch (err) {
    console.log('❌ FAILED');
    const errMsg = err.message || String(err);
    if (errMsg.includes('querySrv ECONNREFUSED') || errMsg.includes('ENOTFOUND')) {
      console.log('    -> Cause: DNS Resolution / Network Error.');
      console.log('    -> Suggestion: Check Atlas Network Access (IP Whitelist).');
    } else if (errMsg.includes('bad auth') || errMsg.includes('Authentication failed')) {
      console.log('    -> Cause: Authentication failed.');
      console.log('    -> Suggestion: Check database user, password, and permissions.');
    } else {
      console.log(`    -> Error: ${errMsg}`);
    }
  }

  console.log('\n=============================================');
  console.log('             DIAGNOSTICS COMPLETE            ');
  console.log('=============================================');
  process.exit(0);
};

runDiagnostics();
