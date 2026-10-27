/**
 * 5.9.1 Barrel Exports — domain/user.service.ts
 *
 * Service của User — module cuối trong folder domain/.
 */

import { BeUser } from "./user.model";
import { BeUserRepository } from "./user.repository";

export class BeUserService {
  private static nextId = 1;

  constructor(private readonly repo: BeUserRepository) {}

  onboard(name: string, email: string): BeUser {
    const user: BeUser = { id: `u-${BeUserService.nextId++}`, name, email };
    this.repo.save(user);
    return user;
  }
}