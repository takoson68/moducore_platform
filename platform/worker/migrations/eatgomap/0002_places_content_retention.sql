CREATE TABLE eatgomap_favorites_v2 (
  place_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(place_id)) BETWEEN 1 AND 255),
  latitude REAL CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude REAL CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  coordinates_expires_at INTEGER,
  source TEXT NOT NULL DEFAULT 'poi' CHECK (source IN ('poi', 'search')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((latitude IS NULL AND longitude IS NULL AND coordinates_expires_at IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL AND coordinates_expires_at IS NOT NULL))
);

INSERT INTO eatgomap_favorites_v2 (place_id, latitude, longitude, coordinates_expires_at, source, created_at)
SELECT place_id, latitude, longitude, created_at + 2552400, source, created_at
FROM eatgomap_favorites;

DROP TABLE eatgomap_favorites;
ALTER TABLE eatgomap_favorites_v2 RENAME TO eatgomap_favorites;
CREATE INDEX idx_eatgomap_favorites_created ON eatgomap_favorites (created_at DESC);
