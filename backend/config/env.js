/**
 * Environment validation, run once at startup before the server listens.
 *
 * The goal is to make an insecure production deployment impossible rather
 * than merely unlikely. Every check below exists because the failure it
 * prevents is silent: the app would start, serve traffic, and look healthy
 * while being wide open.
 */

// Values that must never be accepted as a real secret. The first two shipped
// in this repository's source and .env.example, so they are public.
const KNOWN_WEAK_SECRETS = new Set([
  'dev_secret_key_123',
  'your_super_secret_jwt_key_change_this_in_production',
  'secret',
  'changeme',
  'jwt_secret',
]);

const MIN_SECRET_LENGTH = 32;

class ConfigError extends Error {}

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * True when the in-memory fallback store may be used.
 *
 * Hard false in production, unconditionally. The dev store contains three
 * seeded accounts — healthworker, doctor and admin — all with the password
 * `password123`, and the controllers fall back to it whenever MongoDB is
 * unreachable. Without this gate, a bad MONGODB_URI or a transient Atlas
 * outage silently converts a production deployment into one where anyone can
 * log in as admin. No environment variable overrides this.
 */
const isDevStoreAllowed = () => !isProduction() && process.env.ALLOW_DEV_STORE !== 'false';

const validateEnv = () => {
  const errors = [];
  const warnings = [];

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    errors.push('JWT_SECRET is not set. Tokens cannot be signed securely.');
  } else if (KNOWN_WEAK_SECRETS.has(secret.trim().toLowerCase())) {
    errors.push(
      'JWT_SECRET is a known placeholder value that appears in this public repository. ' +
        'Anyone could forge an admin token. Generate a real one: ' +
        "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  } else if (secret.length < MIN_SECRET_LENGTH) {
    const message = `JWT_SECRET is only ${secret.length} characters; use at least ${MIN_SECRET_LENGTH}.`;
    if (isProduction()) errors.push(message);
    else warnings.push(message);
  }

  if (!process.env.MONGODB_URI) {
    const message = 'MONGODB_URI is not set.';
    if (isProduction()) errors.push(message);
    else warnings.push(`${message} Falling back to the in-memory dev store.`);
  }

  if (process.env.USE_MOCK_ML === 'true' && isProduction()) {
    errors.push(
      'USE_MOCK_ML is enabled in production. Screenings would return synthetic results.'
    );
  }

  if (isProduction()) {
    if (!process.env.FRONTEND_URL) {
      errors.push('FRONTEND_URL is not set. CORS would fall back to localhost.');
    } else if (process.env.FRONTEND_URL.startsWith('http://')) {
      errors.push(
        'FRONTEND_URL is not HTTPS. Auth cookies are marked Secure in production and ' +
          'will not be sent over plain HTTP, so login will fail.'
      );
    }

    if (process.env.ALLOW_DEV_STORE === 'true') {
      warnings.push('ALLOW_DEV_STORE is ignored in production; the dev store is always disabled.');
    }
  } else {
    if (process.env.USE_MOCK_ML === 'true') {
      warnings.push(
        'USE_MOCK_ML=true — screenings return a synthetic placeholder flagged isMock, not model output.'
      );
    }
  }

  if (warnings.length) {
    console.warn('\n\x1b[33m⚠ Configuration warnings\x1b[0m');
    warnings.forEach((w) => console.warn(`  - ${w}`));
    console.warn('');
  }

  if (errors.length) {
    console.error('\n\x1b[31m✖ Refusing to start — configuration errors\x1b[0m');
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('');
    throw new ConfigError(`${errors.length} configuration error(s)`);
  }

  console.log(
    `✅ Configuration validated (${process.env.NODE_ENV || 'development'}, ` +
      `dev store ${isDevStoreAllowed() ? 'enabled' : 'disabled'})`
  );
};

module.exports = { validateEnv, isDevStoreAllowed, isProduction, ConfigError };
