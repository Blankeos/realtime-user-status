import { privateConfig } from '@/config.private';
import { existsSync, writeFileSync } from 'node:fs';
import selfsigned from 'selfsigned';

/**
 * Creates a self-signed certificate when in Bun.env.NODE_ENV === "development".
 *
 * @example
 * .listen({
 *      ...generateTLS();
 * })
 */
export function generateTLS() {
  // When in production, don't generate TLS.
  if (privateConfig.NODE_ENV !== 'development') {
    console.log('Found NODE_ENV === "production". No TLS will be generated.');
    return {};
  }

  const certExists = existsSync('cert.pem');
  const keyExists = existsSync('key.pem');

  // No TLS exists yet.
  if (!certExists || !keyExists) {
    console.log('Found NODE_ENV === "development". Generating Self-Signed TLS.');
    const attrs = [{ name: 'commonName', value: 'example.com' }];
    const pems = selfsigned.generate(attrs, { days: 365 });

    writeFileSync('cert.pem', pems.cert);
    writeFileSync('key.pem', pems.private);
  } else {
    console.log('Found NODE_ENV === "development". Using EXISTING Self-Signed TLS.');
  }

  const cert = Bun.file('cert.pem');
  const key = Bun.file('key.pem');

  return {
    cert,
    key,
  };
}
