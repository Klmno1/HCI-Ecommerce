import { getPostgresPool } from "@/lib/db/postgres";

const schemaSql = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  raw_id TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  introduction TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  original_price INTEGER NOT NULL,
  rating NUMERIC(4, 2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,
  discount_value NUMERIC(6, 2) NOT NULL DEFAULT 0,
  discount_label TEXT NOT NULL DEFAULT '',
  search_keyword TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  category_order INTEGER NOT NULL DEFAULT 9999,
  subcategory_order INTEGER NOT NULL DEFAULT 9999,
  source_file TEXT NOT NULL,
  image_text TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_raw_id_idx ON products(raw_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_subcategory_idx ON products(subcategory);
CREATE INDEX IF NOT EXISTS products_category_order_idx ON products(category_order, subcategory_order);

CREATE TABLE IF NOT EXISTS experiment_sessions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,
  click_count INTEGER NOT NULL DEFAULT 0,
  cart_final JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES experiment_sessions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  relative_ms INTEGER NOT NULL,
  page TEXT NOT NULL,
  target TEXT,
  label TEXT,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiment_events_session_idx ON experiment_events(session_id);
CREATE INDEX IF NOT EXISTS experiment_events_timestamp_idx ON experiment_events(timestamp);
`;

export async function ensureDatabaseSchema() {
  const pool = getPostgresPool();
  await pool.query(schemaSql);
  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_order INTEGER NOT NULL DEFAULT 9999
  `);
  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS subcategory_order INTEGER NOT NULL DEFAULT 9999
  `);
}
