import * as dns from 'dns';

export interface EmailValidationResult {
  valid: boolean;
  normalizedEmail: string;
  message?: string;
}

const EMAIL_SYNTAX_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

const DOMAIN_TYPO_SUGGESTIONS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
};

const BLOCKED_PLACEHOLDER_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'invalid.com',
  'localhost',
]);

/**
 * Normalizes and validates email syntax, TLD structure, and common domain typos.
 */
export function validateEmailFormat(rawEmail: string): EmailValidationResult {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      valid: false,
      normalizedEmail,
      message: 'Email ID is required',
    };
  }

  if (normalizedEmail.length > 254) {
    return {
      valid: false,
      normalizedEmail,
      message: 'Email address is too long',
    };
  }

  const parts = normalizedEmail.split('@');
  if (parts.length !== 2) {
    return {
      valid: false,
      normalizedEmail,
      message: 'Invalid email address format',
    };
  }

  const [localPart, domain] = parts;
  if (
    !localPart ||
    localPart.length > 64 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..') ||
    !domain ||
    domain.includes('..') ||
    !EMAIL_SYNTAX_REGEX.test(normalizedEmail)
  ) {
    return {
      valid: false,
      normalizedEmail,
      message: 'Please enter a valid email address (e.g. name@gmail.com)',
    };
  }

  const domainLabels = domain.split('.');
  const tld = domainLabels[domainLabels.length - 1];
  if (!tld || !/^[a-z]{2,24}$/.test(tld)) {
    return {
      valid: false,
      normalizedEmail,
      message: 'Invalid email domain extension',
    };
  }

  if (DOMAIN_TYPO_SUGGESTIONS[domain]) {
    return {
      valid: false,
      normalizedEmail,
      message: `Invalid email domain "${domain}". Did you mean "${DOMAIN_TYPO_SUGGESTIONS[domain]}"?`,
    };
  }

  if (BLOCKED_PLACEHOLDER_DOMAINS.has(domain)) {
    return {
      valid: false,
      normalizedEmail,
      message: 'Please enter a real email address that can receive OTP emails',
    };
  }

  return { valid: true, normalizedEmail };
}

/**
 * Validates email format and checks DNS MX/A records to reject non-existent mail domains.
 */
export async function validateEmailWithDomain(rawEmail: string): Promise<EmailValidationResult> {
  const formatResult = validateEmailFormat(rawEmail);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Avoid external DNS lookups during unit tests
  if (process.env.NODE_ENV === 'test') {
    return formatResult;
  }

  const domain = formatResult.normalizedEmail.split('@')[1];

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500),
    );
    const mxRecords = await Promise.race([
      dns.promises.resolveMx(domain),
      timeoutPromise,
    ]);

    const hasReachableMx =
      Array.isArray(mxRecords) &&
      mxRecords.some((record) => Boolean(record.exchange && record.exchange.trim()));

    if (!hasReachableMx) {
      return {
        valid: false,
        normalizedEmail: formatResult.normalizedEmail,
        message: 'This email domain does not accept incoming mail',
      };
    }
  } catch (err: any) {
    const code = err?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      // Fallback check for A record per RFC 5321
      try {
        const aRecords = await dns.promises.resolve4(domain);
        if (Array.isArray(aRecords) && aRecords.length > 0) {
          return formatResult;
        }
      } catch (aErr: any) {
        if (aErr?.code === 'ENOTFOUND' || aErr?.code === 'ENODATA') {
          return {
            valid: false,
            normalizedEmail: formatResult.normalizedEmail,
            message: `Invalid email domain "${domain}". Please check for typos.`,
          };
        }
      }
    }
    // Transient DNS/network timeouts do not block otherwise syntactically valid emails
  }

  return formatResult;
}
