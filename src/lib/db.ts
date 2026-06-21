// This file exports the pg pool as the primary database connection.
// Prisma is kept only for schema generation during build time.
// All runtime queries use the pg pool directly via @/lib/pg-db

export { pool, query, queryOne, generateId } from './pg-db';
