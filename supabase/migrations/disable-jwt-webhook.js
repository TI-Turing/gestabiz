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
    process.exit(1);
  }


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
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify({ verify_jwt: false }));
    req.end();
  });
}

disableJWT().catch((err) => {
  process.exit(1);
});
