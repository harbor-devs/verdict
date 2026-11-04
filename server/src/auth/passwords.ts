import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const LOG_N = 16; // cost = 2^16, about 64 MB of memory per hash
const R = 8;
const P = 2;
const KEY_LEN = 64;

function derive(password: string, salt: Buffer, logN: number, r: number, p: number): Promise<Buffer> {
  const options: ScryptOptions = { N: 2 ** logN, r, p, maxmem: 256 * 1024 * 1024 };
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, LOG_N, R, P);
  return `scrypt$${LOG_N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const logN = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");

  const actual = await derive(password, salt, logN, r, p);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the email does not exist, so login takes the same time either way.
let dummyHash: Promise<string> | null = null;
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword("not-a-real-password");
  await verifyPassword(password, await dummyHash);
}