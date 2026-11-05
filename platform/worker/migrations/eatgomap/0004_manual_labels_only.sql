CREATE TABLE eatgomap_favorites_v2 (
  place_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(place_id)) BETWEEN 1 AND 255),
  source TEXT NOT NULL DEFAULT 'poi' CHECK (source IN ('poi', 'search')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  custom_name TEXT CHECK (custom_name IS NULL OR length(trim(custom_name)) BETWEEN 1 AND 255),
  custom_address TEXT CHECK (custom_address IS NULL OR length(trim(custom_address)) <= 1000)
);

INSERT INTO eatgomap_favorites_v2 (place_id, source, created_at, custom_name, custom_address)
SELECT place_id, source, created_at, custom_name, custom_address FROM eatgomap_favorites;

DROP TABLE eatgomap_favorites;
ALTER TABLE eatgomap_favorites_v2 RENAME TO eatgomap_favorites;
