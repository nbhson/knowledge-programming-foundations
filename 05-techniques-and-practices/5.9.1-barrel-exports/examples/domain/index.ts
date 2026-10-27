/**
 * 5.9.1 Barrel Exports — domain/index.ts
 *
 * BARREL FILE: re-export mọi thứ của folder domain/ từ một điểm duy nhất.
 * Consumer chỉ cần `import ... from './domain'`.
 */

export * from "./user.model";
export * from "./user.repository";
export * from "./user.service";