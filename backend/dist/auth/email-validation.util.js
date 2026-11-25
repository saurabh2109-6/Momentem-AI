"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailFormat = validateEmailFormat;
exports.validateEmailWithDomain = validateEmailWithDomain;
const dns = __importStar(require("dns"));
const EMAIL_SYNTAX_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const DOMAIN_TYPO_SUGGESTIONS = {
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
function validateEmailFormat(rawEmail) {
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
    if (!localPart ||
        localPart.length > 64 ||
        localPart.startsWith('.') ||
        localPart.endsWith('.') ||
        localPart.includes('..') ||
        !domain ||
        domain.includes('..') ||
        !EMAIL_SYNTAX_REGEX.test(normalizedEmail)) {
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
async function validateEmailWithDomain(rawEmail) {
    const formatResult = validateEmailFormat(rawEmail);
    if (!formatResult.valid) {
        return formatResult;
    }
    if (process.env.NODE_ENV === 'test') {
        return formatResult;
    }
    const domain = formatResult.normalizedEmail.split('@')[1];
    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500));
        const mxRecords = await Promise.race([
            dns.promises.resolveMx(domain),
            timeoutPromise,
        ]);
        const hasReachableMx = Array.isArray(mxRecords) &&
            mxRecords.some((record) => Boolean(record.exchange && record.exchange.trim()));
        if (!hasReachableMx) {
            return {
                valid: false,
                normalizedEmail: formatResult.normalizedEmail,
                message: 'This email domain does not accept incoming mail',
            };
        }
    }
    catch (err) {
        const code = err?.code;
        if (code === 'ENOTFOUND' || code === 'ENODATA') {
            try {
                const aRecords = await dns.promises.resolve4(domain);
                if (Array.isArray(aRecords) && aRecords.length > 0) {
                    return formatResult;
                }
            }
            catch (aErr) {
                if (aErr?.code === 'ENOTFOUND' || aErr?.code === 'ENODATA') {
                    return {
                        valid: false,
                        normalizedEmail: formatResult.normalizedEmail,
                        message: `Invalid email domain "${domain}". Please check for typos.`,
                    };
                }
            }
        }
    }
    return formatResult;
}
//# sourceMappingURL=email-validation.util.js.map