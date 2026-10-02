import type { StorageLike } from "../../repositories/contracts";
export class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  failWrite = false;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw new Error("Quota exceeded");
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
