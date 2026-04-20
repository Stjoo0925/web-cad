import crypto from "node:crypto";

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

interface TokenPayload {
  iss: string;
  sub: string;
  userId: string;
  documentId?: string;
  scopes: string[];
  iat: number;
  exp: number;
}

interface IssueTokenOptions {
  userId: string;
  documentId?: string;
  scopes?: string[];
  ttlSeconds?: number;
}

interface TokenServiceConfig {
  secret: string;
  issuer: string;
  defaultTtlSeconds?: number;
  now?: () => number;
}

export class TokenService {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly defaultTtlSeconds: number;
  private readonly now: () => number;

  constructor({ secret, issuer, defaultTtlSeconds = 300, now = () => Date.now() }: TokenServiceConfig) {
    this.secret = secret;
    this.issuer = issuer;
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.now = now;
  }

  issueToken({ userId, documentId, scopes = [], ttlSeconds = this.defaultTtlSeconds }: IssueTokenOptions): string {
    const issuedAt = Math.floor(this.now() / 1000);
    const header = { alg: "HS256", typ: "JWT" };
    const payload: TokenPayload = {
      iss: this.issuer,
      sub: userId,
      userId,
      documentId: documentId ?? undefined,
      scopes,
      iat: issuedAt,
      exp: issuedAt + ttlSeconds
    };

    const headerPart = toBase64Url(JSON.stringify(header));
    const payloadPart = toBase64Url(JSON.stringify(payload));
    const signaturePart = this.#sign(`${headerPart}.${payloadPart}`);

    return `${headerPart}.${payloadPart}.${signaturePart}`;
  }

  verifyToken(token: string): TokenPayload {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) {
      throw new Error("Malformed token");
    }

    const expectedSignature = this.#sign(`${headerPart}.${payloadPart}`);
    if (!crypto.timingSafeEqual(Buffer.from(signaturePart), Buffer.from(expectedSignature))) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(fromBase64Url(payloadPart).toString("utf8")) as TokenPayload;
    const now = Math.floor(this.now() / 1000);
    if (payload.iss !== this.issuer) {
      throw new Error("Invalid token issuer");
    }
    if (payload.exp <= now) {
      throw new Error("Token expired");
    }

    return payload;
  }

  #sign(input: string): string {
    const digest = crypto.createHmac("sha256", this.secret).update(input).digest();
    return toBase64Url(digest);
  }
}