/**
 * 5.9.1 Barrel Exports — domain/user.repository.ts
 *
 * Repository của User — module thứ hai trong folder domain/.
 */

import { BeUser } from "./user.model";

export class BeUserRepository {
  private rows = new Map<string, BeUser>();

  save(user: BeUser): void {
    this.rows.set(user.id, user);
  }

  findById(id: string): BeUser | null {
    return this.rows.get(id) ?? null;
  }

  count(): number {
    return this.rows.size;
  }
}