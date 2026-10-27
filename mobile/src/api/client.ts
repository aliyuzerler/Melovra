/**
 * Melovra mobil — web sunucusu API istemcisi.
 *
 * Kimlik doğrulama: `Authorization: Bearer gtd_…` kişisel API token'ı
 * (web stüdyosunda: Ayarlar → API & MCP bölümünden alınır).
 */
export interface ServerProject {
  id: string;
  name: string;
  bpm: number;
  rev: number;
  updatedAt: string;
}

export interface ServerStatus {
  ok: boolean;
  version?: string;
  user?: string;
}

export class ApiClient {
  private base: string;
  private token: string;

  constructor(base: string, token: string) {
    this.base = base.replace(/\/+$/, '');
    this.token = token;
  }

  private async req<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (res.status === 401) {
      throw new Error('Kimlik doğrulama başarısız — token geçersiz olabilir.');
    }
    if (!res.ok) {
      let msg = `Sunucu ${res.status} yanıtı verdi.`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) msg = body.error;
      } catch {
        /* gövde JSON değil */
      }
      throw new Error(msg);
    }
    return (await res.json()) as T;
  }

  async health(): Promise<ServerStatus> {
    const res = await fetch(`${this.base}/api/health`);
    if (!res.ok) throw new Error(`Sunucu yanıt vermiyor (HTTP ${res.status})`);
    const body = (await res.json()) as { ok: boolean };
    return { ok: body.ok === true };
  }

  async projects(): Promise<ServerProject[]> {
    const list = await this.req<ServerProject[]>('/api/projects');
    return Array.isArray(list) ? list : [];
  }

  async projectSummary(id: string): Promise<string> {
    const res = await fetch(`${this.base}/api/projects/${id}/summary`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Özet alınamadı (HTTP ${res.status})`);
    return await res.text();
  }
}

export function normalizeBaseUrl(input: string): string {
  let s = input.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, '');
}
