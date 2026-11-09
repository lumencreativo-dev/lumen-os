export interface MetaAccount {
  facebookPageId: string;
  facebookPageName: string;
  instagramBusinessAccountId: string | null;
  instagramUsername: string | null;
}

export interface ClientMetaMapping {
  clientId?: string;
  clientName?: string;
  igUsername?: string;
  facebookPageId?: string;
  facebookPageName?: string;
}

export type MatchConfidence = 'explicit' | 'heuristic' | 'none';

export interface MatchResult {
  account: MetaAccount | null;
  confidence: MatchConfidence;
  reason?: string;
}

// Normalize strings for fuzzy comparison
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // alphanumeric only
}

// Generate acronym from a full name (e.g., "Hospital San Antonio de Carora" -> "HSA")
function getAcronym(name: string): string {
  const ignoreWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'para', 'por']);
  const words = name
    .split(/\s+/)
    .map(w => w.trim().replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length > 0 && !ignoreWords.has(w.toLowerCase()));

  return words.map(w => w[0]?.toUpperCase()).join('');
}

/**
 * Finds the best suggested Meta account for a given client
 */
export function findSuggestedMetaAccount(
  clientNameOrAcronym: string | null | undefined,
  clientId: string | null | undefined,
  accounts: MetaAccount[],
  savedMappings: Record<string, ClientMetaMapping> = {}
): MatchResult {
  if (!accounts || accounts.length === 0) {
    return { account: null, confidence: 'none' };
  }

  // 1. Check explicit saved mapping by clientId
  if (clientId && savedMappings[clientId]) {
    const map = savedMappings[clientId];
    const found = accounts.find(
      a =>
        (map.facebookPageId && a.facebookPageId === map.facebookPageId) ||
        (map.igUsername && a.instagramUsername && a.instagramUsername.toLowerCase() === map.igUsername.toLowerCase())
    );
    if (found) {
      return {
        account: found,
        confidence: 'explicit',
        reason: `Mapeo configurado expresamente para este cliente (${found.instagramUsername ? '@' + found.instagramUsername : found.facebookPageName})`
      };
    }
  }

  // 2. Check explicit saved mapping by clientName
  if (clientNameOrAcronym) {
    const cleanClient = clientNameOrAcronym.trim();
    for (const key of Object.keys(savedMappings)) {
      const map = savedMappings[key];
      if (map.clientName && map.clientName.toLowerCase() === cleanClient.toLowerCase()) {
        const found = accounts.find(
          a =>
            (map.facebookPageId && a.facebookPageId === map.facebookPageId) ||
            (map.igUsername && a.instagramUsername && a.instagramUsername.toLowerCase() === map.igUsername.toLowerCase())
        );
        if (found) {
          return {
            account: found,
            confidence: 'explicit',
            reason: `Mapeo guardado para "${cleanClient}"`
          };
        }
      }
    }
  }

  if (!clientNameOrAcronym) {
    return { account: accounts[0] || null, confidence: 'none' };
  }

  const rawClient = clientNameOrAcronym.trim();
  const normClient = normalizeStr(rawClient);
  const upperClient = rawClient.toUpperCase();

  // 3. Known agency abbreviations dictionary (fast path)
  const KNOWN_MAP: Record<string, string[]> = {
    'HSA': ['funsanantoniocarora', 'hospital san antonio'],
    'SJT': ['hermanasdesanjosedetarbesve', 'san jose de tarbes', 'hermanas'],
    'ADONAY': ['adonay_travel', 'adonay travel'],
    'LC': ['lumencreativo', 'lumen creativo'],
    'LUMEN': ['lumencreativo', 'lumen creativo'],
    'CONVERC': ['converc'],
    'SANAD': ['sanad']
  };

  if (KNOWN_MAP[upperClient]) {
    const targets = KNOWN_MAP[upperClient];
    for (const target of targets) {
      const found = accounts.find(a => {
        const page = (a.facebookPageName || '').toLowerCase();
        const ig = (a.instagramUsername || '').toLowerCase();
        return page.includes(target) || ig.includes(target);
      });
      if (found) {
        return {
          account: found,
          confidence: 'heuristic',
          reason: `Siglas coincidentes "${upperClient}" con ${found.facebookPageName}`
        };
      }
    }
  }

  // 4. Acronym Matching against all accounts
  for (const acc of accounts) {
    const pageAcronym = getAcronym(acc.facebookPageName);
    if (pageAcronym && (upperClient === pageAcronym || upperClient.startsWith(pageAcronym))) {
      return {
        account: acc,
        confidence: 'heuristic',
        reason: `Acrónimo "${upperClient}" coincide con "${acc.facebookPageName}" (${pageAcronym})`
      };
    }
  }

  // 5. Substring / Normalized Matching
  for (const acc of accounts) {
    const normPage = normalizeStr(acc.facebookPageName || '');
    const normIg = normalizeStr(acc.instagramUsername || '');

    if (normPage.includes(normClient) || normClient.includes(normPage)) {
      return {
        account: acc,
        confidence: 'heuristic',
        reason: `Coincidencia de nombre entre "${rawClient}" y "${acc.facebookPageName}"`
      };
    }

    if (normIg && (normIg.includes(normClient) || normClient.includes(normIg))) {
      return {
        account: acc,
        confidence: 'heuristic',
        reason: `Coincidencia con usuario de Instagram @${acc.instagramUsername}`
      };
    }
  }

  // Default fallback
  return { account: accounts[0] || null, confidence: 'none' };
}
