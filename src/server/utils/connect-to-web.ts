export { connectToWeb };

// ===========================================================================
// types.js
// ===========================================================================
import { IncomingMessage, ServerResponse } from 'http';

export type HeadersProvided = Record<string, string | string[] | undefined> | Headers;
export type VikeHttpResponse = Awaited<
  ReturnType<typeof import('vike/server').renderPage>
>['httpResponse'];
export type NextFunction = (err?: unknown) => void;
export type VikeOptions<PlatformRequest = null> = {
  pageContext?:
    | ((req: PlatformRequest) => Record<string, any> | Promise<Record<string, any>>)
    | Record<string, any>;
  compress?: boolean | 'static';
  static?: boolean | string | { root?: string; cache?: boolean };
  onError?: (err: unknown) => void;
};
export type ConnectMiddleware<
  PlatformRequest extends IncomingMessage = IncomingMessage,
  PlatformResponse extends ServerResponse = ServerResponse,
> = (req: PlatformRequest, res: PlatformResponse, next: NextFunction) => void;

// ===========================================================================
// ../utils/header-utils.js
// ===========================================================================
export { flattenHeaders, groupHeaders };

import type { OutgoingHttpHeaders } from 'http';

function groupHeaders(headers: [string, string][]): [string, string | string[]][] {
  const grouped: { [key: string]: string | string[] } = {};

  headers.forEach(([key, value]) => {
    if (grouped[key]) {
      // If the key already exists, append the new value
      if (Array.isArray(grouped[key])) {
        (grouped[key] as string[]).push(value);
      } else {
        grouped[key] = [grouped[key] as string, value];
      }
    } else {
      // If the key doesn't exist, add it to the object
      grouped[key] = value;
    }
  });

  // Convert the object back to an array
  return Object.entries(grouped);
}

function flattenHeaders(headers: OutgoingHttpHeaders): [string, string][] {
  const flatHeaders: [string, string][] = [];

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null) {
          flatHeaders.push([key, String(v)]);
        }
      });
    } else {
      flatHeaders.push([key, String(value)]);
    }
  }

  return flatHeaders;
}
// ===========================================================================
// createServerResponse.js
// ===========================================================================
export { createServerResponse };

import { type OutgoingHttpHeader } from 'http';

import { PassThrough } from 'stream';

/**
 * Creates a custom ServerResponse object that allows for intercepting and streaming the response.
 *
 * @param {IncomingMessage} incomingMessage - The incoming HTTP request message.
 * @returns {{ res: ServerResponse; onReadable: Promise<{ readable: Readable; headers: OutgoingHttpHeaders; statusCode: number }> }}
 * An object containing:
 *   - res: The custom ServerResponse object.
 *   - onReadable: A promise that resolves when the response is readable, providing the readable stream, headers, and status code.
 */
function createServerResponse(incomingMessage: IncomingMessage) {
  const res = new ServerResponse(incomingMessage);
  const passThrough = new PassThrough();
  const onReadable = new Promise<{
    readable: Readable;
    headers: OutgoingHttpHeaders;
    statusCode: number;
  }>((resolve, reject) => {
    const handleReadable = () => {
      resolve({
        readable: Readable.from(passThrough),
        headers: res.getHeaders(),
        statusCode: res.statusCode,
      });
    };

    const handleError = (err: Error) => {
      reject(err);
    };

    passThrough.once('readable', handleReadable);
    passThrough.once('end', handleReadable);
    passThrough.once('error', handleError);
    res.once('error', handleError);
  });

  res.once('finish', () => {
    passThrough.end();
  });

  passThrough.on('drain', () => {
    res.emit('drain');
  });

  res.write = passThrough.write.bind(passThrough);
  res.end = (passThrough as any).end.bind(passThrough);

  res.writeHead = function writeHead(
    statusCode: number,
    statusMessage?: string | OutgoingHttpHeaders | OutgoingHttpHeader[],
    headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]
  ): ServerResponse {
    res.statusCode = statusCode;
    if (typeof statusMessage === 'object') {
      headers = statusMessage;
      statusMessage = undefined;
    }
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });
    }
    return res;
  };

  return {
    res,
    onReadable,
  };
}

// ===========================================================================
// connect-to-web.js
// ===========================================================================

import { Readable } from 'node:stream';

/** Type definition for a web-compatible request handler */
type WebHandler = (request: Request) => Response | undefined | Promise<Response | undefined>;

const statusCodesWithoutBody = [
  100, // Continue
  101, // Switching Protocols
  102, // Processing (WebDAV)
  103, // Early Hints
  204, // No Content
  205, // Reset Content
  304, // Not Modified
];

/**
 * Converts a Connect-style middleware to a web-compatible request handler.
 *
 * @param {ConnectMiddleware} handler - The Connect-style middleware function to be converted.
 * @returns {WebHandler} A function that handles web requests and returns a Response or undefined.
 */
function connectToWeb(handler: ConnectMiddleware): WebHandler {
  return (request: Request): Promise<Response | undefined> => {
    const req = createIncomingMessage(request);
    const { res, onReadable } = createServerResponse(req);

    return new Promise<Response | undefined>((resolve, reject) => {
      (async () => {
        try {
          const { readable, headers, statusCode } = await onReadable;
          const responseBody = statusCodesWithoutBody.includes(statusCode)
            ? null
            : (Readable.toWeb(readable) as ReadableStream);
          resolve(
            new Response(responseBody, {
              status: statusCode,
              headers: flattenHeaders(headers),
            })
          );
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Error creating response'));
        }
      })();

      const next = (error?: unknown) => {
        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        } else {
          resolve(undefined);
        }
      };

      Promise.resolve(handler(req, res, next)).catch(next);
    });
  };
}

/**
 * Creates an IncomingMessage object from a web Request.
 *
 * @param {Request} request - The web Request object.
 * @returns {IncomingMessage} An IncomingMessage-like object compatible with Node.js HTTP module.
 */
function createIncomingMessage(request: Request): IncomingMessage {
  const parsedUrl = new URL(request.url);
  const pathnameAndQuery = (parsedUrl.pathname || '') + (parsedUrl.search || '');

  const body = request.body ? Readable.fromWeb(request.body as any) : Readable.from([]);
  return Object.assign(body, {
    url: pathnameAndQuery,
    method: request.method,
    headers: Object.fromEntries(request.headers),
  }) as IncomingMessage;
}
