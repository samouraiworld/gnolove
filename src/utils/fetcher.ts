export class HttpError extends Error {
  status: number;
  statusText?: string;
  bodyText?: string;

  constructor(message: string, opts: { status: number; statusText?: string; bodyText?: string }) {
    super(message);
    this.name = 'HttpError';
    this.status = opts.status;
    this.statusText = opts.statusText;
    this.bodyText = opts.bodyText;
  }
}

export async function fetchJson<T = unknown>(url: string | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(typeof url === 'string' ? url : url.toString(), init);
  if (!res.ok) {
    const bodyText = await res.text();
    throw new HttpError(`Request failed: ${res.status} ${res.statusText}${bodyText ? ` - ${bodyText}` : ''}`, {
      status: res.status,
      statusText: res.statusText,
      bodyText,
    });
  }
  return res.json() as Promise<T>;
}
