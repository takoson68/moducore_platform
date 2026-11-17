PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS yi_ly_corpus_versions (
  corpus_version TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  source_snapshot_date TEXT NOT NULL,
  import_status TEXT NOT NULL CHECK (import_status IN ('source_derived_unedited')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS yi_ly_sources (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  edition TEXT,
  license_code TEXT,
  license_url TEXT,
  attribution TEXT NOT NULL,
  rights_note TEXT,
  source_metadata_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS yi_ly_source_pages (
  source_page_key TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES yi_ly_sources(source_id),
  page_title TEXT NOT NULL,
  page_id TEXT,
  revision_id TEXT,
  revision_timestamp TEXT,
  canonical_url TEXT,
  fixed_url TEXT,
  content_format TEXT,
  content_sha256 TEXT,
  snapshot_file TEXT,
  page_role TEXT NOT NULL,
  metadata_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_yi_ly_source_pages_source ON yi_ly_source_pages(source_id, page_role);

CREATE TABLE IF NOT EXISTS yi_ly_hexagrams (
  hexagram_number INTEGER PRIMARY KEY CHECK (hexagram_number BETWEEN 1 AND 64),
  hexagram_name TEXT NOT NULL,
  pattern_bottom_up TEXT NOT NULL CHECK (length(pattern_bottom_up) = 6 AND pattern_bottom_up NOT GLOB '*[^01]*'),
  lower_trigram_pattern TEXT NOT NULL CHECK (length(lower_trigram_pattern) = 3),
  lower_trigram_name TEXT NOT NULL,
  upper_trigram_pattern TEXT NOT NULL CHECK (length(upper_trigram_pattern) = 3),
  upper_trigram_name TEXT NOT NULL,
  source_page_key TEXT NOT NULL REFERENCES yi_ly_source_pages(source_page_key),
  source_derived INTEGER NOT NULL DEFAULT 1 CHECK (source_derived = 1)
);

CREATE TABLE IF NOT EXISTS yi_ly_passages (
  passage_id TEXT PRIMARY KEY,
  corpus_version TEXT NOT NULL REFERENCES yi_ly_corpus_versions(corpus_version),
  work_id TEXT NOT NULL,
  work_name TEXT NOT NULL,
  work_type TEXT NOT NULL,
  passage_kind TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES yi_ly_sources(source_id),
  source_page_key TEXT NOT NULL REFERENCES yi_ly_source_pages(source_page_key),
  source_locator TEXT,
  source_entry_number INTEGER,
  hexagram_number INTEGER REFERENCES yi_ly_hexagrams(hexagram_number),
  line_position INTEGER CHECK (line_position IS NULL OR line_position BETWEEN 1 AND 6),
  base_hexagram_number INTEGER REFERENCES yi_ly_hexagrams(hexagram_number),
  changed_hexagram_number INTEGER REFERENCES yi_ly_hexagrams(hexagram_number),
  text_source TEXT NOT NULL,
  text_display TEXT,
  source_text_sha256 TEXT,
  display_text_sha256 TEXT,
  parser_version INTEGER,
  extraction_status TEXT NOT NULL,
  source_marker TEXT,
  source_metadata_json TEXT NOT NULL,
  UNIQUE(work_id, source_entry_number)
);
CREATE INDEX IF NOT EXISTS idx_yi_ly_passages_gua_kind ON yi_ly_passages(hexagram_number, passage_kind, line_position);
CREATE INDEX IF NOT EXISTS idx_yi_ly_passages_yilin_pair ON yi_ly_passages(base_hexagram_number, changed_hexagram_number);
CREATE INDEX IF NOT EXISTS idx_yi_ly_passages_work ON yi_ly_passages(work_id, passage_kind);
