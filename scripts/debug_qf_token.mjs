#!/usr/bin/env node
import { getQfOAuthConfig } from '../lib/api/qfOAuthConfig.js';

(async () => {
  try {
    const cfg = getQfOAuthConfig();
    console.log('QF_ENV=', process.env.QF_ENV || '<<not-set>>');
    console.log('authBaseUrl=', cfg.authBaseUrl);
    const tokenUrl = `${cfg.authBaseUrl.replace(/\/$/, '')}/oauth2/token`;
    console.log('tokenUrl=', tokenUrl);

    const scope = 'content search';
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
    const body = new URLSearchParams({ grant_type: 'client_credentials', scope });

    if (cfg.clientSecret) {
      const creds = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${creds}`;
    } else {
      body.set('client_id', cfg.clientId);
    }

    const res = await fetch(tokenUrl, { method: 'POST', headers, body });
    console.log('status', res.status);
    const text = await res.text();
    try {
      console.log('body:', JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log('body:', text);
    }

    if (!res.ok) process.exitCode = 2;
  } catch (e) {
    console.error('ERR', e);
    process.exitCode = 2;
  }
})();
