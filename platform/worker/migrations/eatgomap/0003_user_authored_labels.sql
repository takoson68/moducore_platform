ALTER TABLE eatgomap_favorites ADD COLUMN custom_name TEXT
  CHECK (custom_name IS NULL OR length(trim(custom_name)) BETWEEN 1 AND 255);
ALTER TABLE eatgomap_favorites ADD COLUMN custom_address TEXT
  CHECK (custom_address IS NULL OR length(trim(custom_address)) <= 1000);
