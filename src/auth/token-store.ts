import fs from 'node:fs';
import path from 'node:path';
import { isRecord } from '../validation/guards';

export interface SuiteTokens {
  dummyJsonAccessToken: string;
  bookerToken: string;
  fetchedAt: string;
}

const TOKEN_FILE = path.resolve(process.cwd(), '.auth', 'tokens.json');

export function tokenFilePath(): string {
  return TOKEN_FILE;
}

export function saveTokens(tokens: SuiteTokens): void {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens), { encoding: 'utf8', mode: 0o600 });
}

export function loadTokens(): SuiteTokens {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(
      'Token cache is missing. Run the suite through Playwright so global setup can authenticate.',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')) as unknown;
  } catch {
    throw new Error('Token cache is unreadable. Re-run the suite so global setup can refresh it.');
  }

  if (
    !isRecord(parsed) ||
    typeof parsed.dummyJsonAccessToken !== 'string' ||
    typeof parsed.bookerToken !== 'string' ||
    parsed.dummyJsonAccessToken.length < 20 ||
    parsed.bookerToken.length < 8
  ) {
    throw new Error('Token cache does not contain usable tokens.');
  }

  return {
    dummyJsonAccessToken: parsed.dummyJsonAccessToken,
    bookerToken: parsed.bookerToken,
    fetchedAt: typeof parsed.fetchedAt === 'string' ? parsed.fetchedAt : '',
  };
}
