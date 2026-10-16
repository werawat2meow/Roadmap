import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const SHARE_MAX_AGE = 30 * 24 * 60 * 60;
export const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isShareCode = (value) => typeof value === 'string' && /^[0-9a-f]{32}$/.test(value);
export const shareCookieName = (jobId) => `recruit_share_${jobId}`;
export const emptyAttribution = () => ({ share_link_id: null, referred_by_user_account_id: null });
const LINK_FIELDS = 'id,job_open_id,shared_by_user_account_id,share_code,revoked_at';

export function publicShareOrigin(env = process.env) {
  const configured = env.RECRUITMENT_PUBLIC_ORIGIN || (env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
  const url = new URL(configured);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new Error('RECRUITMENT_PUBLIC_ORIGIN must be a trusted HTTPS origin');
  }
  return url.origin;
}

export function isOpeningAvailable(opening, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  // Existing recruitment deletes rows physically; deleted_at has a legacy now()
  // default, so it cannot be used as a soft-delete flag here.
  return !!opening && opening.status === true && !!opening.start_date &&
    opening.start_date <= today && (!opening.end_date || opening.end_date >= today);
}

export async function loadOpening(db, jobId) {
  if (!isUuid(jobId)) return null;
  const { data, error } = await db.from('recruit_job_open')
    .select('id,branch_id,department_id,division_id,unit_id,status,start_date,end_date')
    .eq('id', jobId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function findShareLink(db, code) {
  if (!isShareCode(code)) return null;
  const { data, error } = await db.from('recruit_job_open_share_links')
    .select(LINK_FIELDS).eq('share_code', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOrCreateShareLink(db, jobId, userId, makeCode = () => randomBytes(16).toString('hex')) {
  async function existing() {
    const { data, error } = await db.from('recruit_job_open_share_links').select(LINK_FIELDS)
      .eq('job_open_id', jobId).eq('shared_by_user_account_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }
  const found = await existing();
  if (found) return found;
  for (let attempt = 0; attempt < 3; attempt++) {
    const now = new Date().toISOString();
    const { data, error } = await db.from('recruit_job_open_share_links').insert({
      id: randomUUID(), job_open_id: jobId, shared_by_user_account_id: userId,
      share_code: makeCode(), created_at: now, updated_at: now, revoked_at: null,
    }).select(LINK_FIELDS).single();
    if (!error) return data;
    if (error.code !== '23505') throw error;
    // Database UNIQUE(job_open_id, shared_by_user_account_id) is required.
    const winner = await existing();
    if (winner) return winner;
    // No pair winner: retry a collision on share_code.
  }
  throw new Error('Unable to allocate share code');
}

function signature(jobId, value, secret) {
  return createHmac('sha256', secret).update(`${jobId}:${value}`).digest('base64url');
}

export function makeShareCookie(jobId, code, secret, now = Date.now()) {
  if (!secret) throw new Error('JWT_SECRET is required for referral cookies');
  const value = Buffer.from(JSON.stringify({ code, at: now })).toString('base64url');
  return `${value}.${signature(jobId, value, secret)}`;
}

export function readShareCookie(jobId, cookie, secret, now = Date.now()) {
  if (!secret || typeof cookie !== 'string' || cookie.length > 512) return null;
  try {
    const [value, signed, extra] = cookie.split('.');
    if (!value || !signed || extra) return null;
    const expected = Buffer.from(signature(jobId, value, secret));
    const actual = Buffer.from(signed);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString());
    if (!isShareCode(parsed.code) || !Number.isFinite(parsed.at) || parsed.at > now || now - parsed.at >= SHARE_MAX_AGE * 1000) return null;
    return parsed.code;
  } catch { return null; }
}

export async function resolveApplicationAttribution(db, { jobId, payload, cookie, secret, now = Date.now() }) {
  if (!isUuid(jobId)) return emptyAttribution();
  const code = Object.prototype.hasOwnProperty.call(payload, 'shareCode')
    ? payload.shareCode : readShareCookie(jobId, cookie, secret, now);
  const link = await findShareLink(db, code);
  if (!link || link.revoked_at || link.job_open_id !== jobId) return emptyAttribution();
  return { share_link_id: link.id, referred_by_user_account_id: link.shared_by_user_account_id };
}
