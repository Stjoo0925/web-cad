import crypto from "node:crypto";

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(input) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

export class TokenService {
  constructor({ secret, issuer, defaultTtlSeconds = 300, now = () => Date.now() }) {
    this.secret = secret;
    this.issuer = issuer;
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.now = now;
  }

  issueToken({ userId, documentId, scopes = [], ttlSeconds = this.defaultTtlSeconds }) {
    const issuedAt = Math.floor(this.now() / 1000);
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      iss: this.issuer,
      sub: userId,
      userId,
      documentId,
      scopes,
      iat: issuedAt,
      exp: issuedAt + ttlSeconds
    };

    const headerPart = toBase64Url(JSON.stringify(header));
    const payloadPart = toBase64Url(JSON.stringify(payload));
    const signaturePart = this.#sign(`${headerPart}.${payloadPart}`);

    return `${headerPart}.${payloadPart}.${signaturePart}`;
  }

  verifyToken(token) {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) {
      throw new Error("Malformed token");
    }

    const expectedSignature = this.#sign(`${headerPart}.${payloadPart}`);
    if (!crypto.timingSafeEqual(Buffer.from(signaturePart), Buffer.from(expectedSignature))) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(fromBase64Url(payloadPart).toString("utf8"));
    const now = Math.floor(this.now() / 1000);
    if (payload.iss !== this.issuer) {
      throw new Error("Invalid token issuer");
    }
    if (payload.exp <= now) {
      throw new Error("Token expired");
    }

    return payload;
  }

  #sign(input) {
    const digest = crypto.createHmac("sha256", this.secret).update(input).digest();
    return toBase64Url(digest);
  }
}
