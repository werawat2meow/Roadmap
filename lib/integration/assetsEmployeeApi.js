import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/validateApiKey';
import { logApiAccess } from '@/lib/logApiAccess';

export function jsonError(error, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function safeSearch(value) {
  return String(value || '').trim().slice(0, 100).replace(/[,()%*]/g, ' ');
}

// Reuse the existing API Token validation and access-log facilities.
// This helper intentionally does not log raw API keys or employee PII.
export async function withApiToken(req, handler) {
  const url = new URL(req.url);
  const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
  const userAgent = req.headers.get('user-agent') || null;
  const requestQuery = Object.fromEntries(url.searchParams.entries());
  const meta = { method: 'GET', endpoint: url.pathname, requestIp, userAgent, requestQuery };
  const auth = await validateApiKey(req);
  if (!auth.success) {
    await logApiAccess({ ...meta, clientId: null, tokenId: null, statusCode: 401, isSuccess: false, errorMessage: 'Unauthorized API key' });
    return auth.response;
  }

  try {
    const result = await handler({ url, auth });
    await logApiAccess({
      ...meta, clientId: auth.client?.id || null, tokenId: auth.token?.id || null,
      statusCode: result.status || 200, isSuccess: (result.status || 200) < 400,
      responseBody: { success: (result.status || 200) < 400 },
    });
    return result;
  } catch (error) {
    console.error('ASSETS_EMPLOYEE_INTEGRATION_ERROR:', error);
    await logApiAccess({ ...meta, clientId: auth.client?.id || null, tokenId: auth.token?.id || null, statusCode: 500, isSuccess: false, errorMessage: 'Server error' });
    return jsonError('ไม่สามารถดึงข้อมูลพนักงานได้', 500);
  }
}
