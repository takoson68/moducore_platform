CREATE TABLE IF NOT EXISTS eatgomap_favorites (
  place_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(place_id)) BETWEEN 1 AND 255),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 255),
  address TEXT NOT NULL DEFAULT '' CHECK (length(address) <= 1000),
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  source TEXT NOT NULL DEFAULT 'poi' CHECK (source IN ('poi', 'search')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_eatgomap_favorites_created ON eatgomap_favorites (created_at DESC);
