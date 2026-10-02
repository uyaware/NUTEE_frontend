import type { Database, Portal, Session } from "../shared/types/database";

export interface DataRepository {
  read(): Promise<Database>;
  update(
    expectedRevision: number,
    change: (db: Database) => void,
  ): Promise<Database>;
  reset(): Promise<void>;
  subscribe(listener: () => void): () => void;
}
export interface SessionRepository {
  get(portal: Portal): Session | null;
  set(portal: Portal, session: Session): void;
  remove(portal: Portal): void;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
