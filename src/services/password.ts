// Local adapter credentials stay separate from the public User DTO.
// A backend adapter must own credential storage and authentication in production.
const iterations = 210000;
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

async function derive(password: string, salt: string, rounds: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = Uint8Array.from(salt.match(/.{2}/g)!, (part) =>
    parseInt(part, 16),
  );
  return hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: bytes, iterations: rounds },
        key,
        256,
      ),
    ),
  );
}

export async function createPassword(password: string) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, iterations, hash: await derive(password, salt, iterations) };
}

export async function verifyPassword(
  password: string,
  credential: { salt: string; hash: string; iterations: number },
) {
  return (
    (await derive(password, credential.salt, credential.iterations)) ===
    credential.hash
  );
}
