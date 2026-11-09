import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });