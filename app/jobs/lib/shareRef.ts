// Read only inside browser event handlers; each tab retains its own explicit ref.
export function sharePayload(search: string): { shareCode?: string } {
  const params = new URLSearchParams(search);
  return params.has('ref') ? { shareCode: params.get('ref') ?? '' } : {};
}

export function applicationUrl(jobId: string, search: string) {
  const payload = sharePayload(search);
  const suffix = payload.shareCode !== undefined
    ? `?${new URLSearchParams({ ref: payload.shareCode })}` : '';
  return `/jobs/register/${jobId}${suffix}`;
}
