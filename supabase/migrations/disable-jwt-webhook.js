#!/usr/bin/env node

/**
 * Disable JWT verification for mercadopago-webhook after deployment
 * This runs automatically after supabase functions deploy
 * 
 * Usage: node supabase/migrations/disable-jwt-webhook.js
 */

const http = require('https');

async function disableJWT() {
  const projectId = 'dkancockzvcqorqbwtyh'; // DEV
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ SUPABASE_ACCESS_TOKEN not set');
    console.log('Get it from: https://app.supabase.com/account/tokens');
    process.exit(1);
  }

  console.log('🔧 Disabling JWT verification for mercadopago-webhook...');

  const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectId}/functions/mercadopago-webhook/config`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ JWT verification disabled successfully');
          resolve();
        } else {
          console.error(`❌ Error: ${res.statusCode}`);
          console.error(data);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      reject(e);
    });

    req.write(JSON.stringify({ verify_jwt: false }));
    req.end();
  });
}

disableJWT().catch((err) => {
  console.error(err);
  process.exit(1);
});
