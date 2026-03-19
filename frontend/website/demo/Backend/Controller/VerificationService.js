/**
 * VerificationService.js
 * ──────────────────────
 * Shared utility for token-based account verification.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TOKEN_PREFIX = 'ALGOLEDGER_';
const TOKEN_EXPIRY_MINUTES = 15;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** Generate a random verification token: ALGOLEDGER_aBcD1234 */
export function generateToken() {
    const random = crypto.randomBytes(6).toString('base64url');
    return `${TOKEN_PREFIX}${random}`;
}

/** Save verification state to disk */
export function saveVerification(platform, username, token) {
    const data = {
        platform, username, token,
        verified: false, verifiedAt: null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    };
    const filePath = path.join(DATA_DIR, `verification_${platform}_${username}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`🔑 [Verification] Token saved for ${platform}/${username}: ${token}`);
    return data;
}

/** Read verification state from disk */
export function getVerification(platform, username) {
    const filePath = path.join(DATA_DIR, `verification_${platform}_${username}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8').trim());
    } catch (e) {
        console.error(`❌ [Verification] Error reading ${filePath}:`, e.message);
        return null;
    }
}

/** Mark an account as verified */
export function markVerified(platform, username) {
    const data = getVerification(platform, username);
    if (!data) return null;
    data.verified = true;
    data.verifiedAt = new Date().toISOString();
    const filePath = path.join(DATA_DIR, `verification_${platform}_${username}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ [Verification] ${platform}/${username} marked as VERIFIED`);
    return data;
}

/** Check if a token has expired */
export function isTokenExpired(verificationData) {
    if (!verificationData?.expiresAt) return true;
    return new Date() > new Date(verificationData.expiresAt);
}

/** Retry wrapper with exponential backoff */
export async function withRetry(fn, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const isLast = attempt === retries;
            const isRateLimit = error.response?.status === 429;
            const isServerError = error.response?.status >= 500;
            if (isLast || (!isRateLimit && !isServerError)) throw error;
            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(`⚠️ [Retry] Attempt ${attempt}/${retries} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/** Structured verification event logging */
export function logVerification(level, platform, username, event, details = {}) {
    const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '📋';
    console.log(`${icon} [Verification] ${level} ${platform}/${username} — ${event}`, details);
}
