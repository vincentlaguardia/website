const crypto = require('crypto');

const SERVICE = 's3';
const REGION = 'auto';
const DEFAULT_EXPIRES_SECONDS = 300;
const MAX_EXPIRES_SECONDS = 3600;
const DEFAULT_ALLOWED_KEYS = ['issues/1/i.n.t.e.r.f.a.c.e..pdf'];

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function encodePath(pathValue) {
  return String(pathValue || '')
    .split('/')
    .map(seg => encodeRfc3986(seg))
    .join('/');
}

function parseAllowedKeys() {
  const raw = process.env.R2_ALLOWED_KEYS;
  if (!raw) return DEFAULT_ALLOWED_KEYS;
  const keys = raw
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  return keys.length ? keys : DEFAULT_ALLOWED_KEYS;
}

function badRequest(statusCode, error) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    },
    body: JSON.stringify({ error })
  };
}

exports.handler = async event => {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return badRequest(405, 'Method not allowed');
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'interface';
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return badRequest(500, 'Missing R2 signing environment variables');
  }

  const key = (event.queryStringParameters && event.queryStringParameters.key ? String(event.queryStringParameters.key) : '').trim();
  if (!key) return badRequest(400, 'Missing key query parameter');
  if (key.includes('..') || key.startsWith('/')) return badRequest(400, 'Invalid key');

  const allowedKeys = parseAllowedKeys();
  if (!allowedKeys.includes(key)) return badRequest(403, 'Key not allowed');

  const requestedExpires = Number(event.queryStringParameters && event.queryStringParameters.expires);
  const expires = Number.isFinite(requestedExpires)
    ? Math.max(1, Math.min(MAX_EXPIRES_SECONDS, Math.floor(requestedExpires)))
    : DEFAULT_EXPIRES_SECONDS;

  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = '/' + encodePath(`${bucket}/${key}`);

  const queryParts = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${accessKeyId}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expires)],
    ['X-Amz-SignedHeaders', 'host']
  ];
  const canonicalQuery = queryParts
    .map(([k, v]) => [encodeRfc3986(k), encodeRfc3986(v)])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const url = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    },
    body: JSON.stringify({ url, key, expiresIn: expires })
  };
};
