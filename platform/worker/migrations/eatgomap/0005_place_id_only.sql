CREATE TABLE eatgomap_favorites_v3 (
  place_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(place_id)) BETWEEN 1 AND 255)
);

INSERT INTO eatgomap_favorites_v3 (place_id)
SELECT place_id FROM eatgomap_favorites;

DROP TABLE eatgomap_favorites;
ALTER TABLE eatgomap_favorites_v3 RENAME TO eatgomap_favorites;
