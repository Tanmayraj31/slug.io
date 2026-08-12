import { randomBytes } from "node:crypto";

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const CHARSET_SIZE = CHARSET.length;
// Highest byte that maps to a full Base62 symbol without modulo bias (256 % 62 !== 0).
const MAX_ACCEPTABLE = Math.floor(256 / CHARSET_SIZE) * CHARSET_SIZE;

function randomBase62Char(): string {
  while (true) {
    const byte = randomBytes(1).readUInt8(0);
    if (byte < MAX_ACCEPTABLE) {
      return CHARSET.charAt(byte % CHARSET_SIZE);
    }
  }
}

export function generateShortCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomBase62Char();
  }
  return code;
}
