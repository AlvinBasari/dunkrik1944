import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'super-secret-key-123-mercusuar';

// Fungsi helper Base64Url encoding/decoding
function base64url(source) {
  let encoded = Buffer.from(JSON.stringify(source)).toString('base64');
  encoded = encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return encoded;
}

function base64urlDecode(encoded) {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const decodedStr = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(decodedStr);
}

// Generate Token (seperti JWT manual)
export function signToken(payload, expiresInSeconds = 24 * 60 * 60) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const tokenPayload = { ...payload, exp };
  
  const payloadB64 = base64url(tokenPayload);
  
  // Buat signature HMAC-SHA256
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payloadB64);
  const signatureB64 = hmac.digest('base64url');
  
  return `${payloadB64}.${signatureB64}`;
}

// Verifikasi Token
export function verifyToken(token) {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  
  const [payloadB64, signatureB64] = parts;
  
  // Re-generate signature untuk verifikasi
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payloadB64);
  const expectedSignatureB64 = hmac.digest('base64url');
  
  // Bandingkan signature secara aman
  if (signatureB64 !== expectedSignatureB64) {
    return null;
  }
  
  try {
    const payload = base64urlDecode(payloadB64);
    
    // Cek kadaluarsa
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}
