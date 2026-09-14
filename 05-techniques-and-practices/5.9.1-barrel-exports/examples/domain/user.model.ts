/**
 * 5.9.1 Barrel Exports — domain/user.model.ts
 *
 * Một file module riêng lẻ — chứa type + factory của User.
 */

export type BeUser = {
  id: string;
  name: string;
  email: string;
};

export function makeBeUser(id: string, name: string, email: string): BeUser {
  return { id, name, email };
}