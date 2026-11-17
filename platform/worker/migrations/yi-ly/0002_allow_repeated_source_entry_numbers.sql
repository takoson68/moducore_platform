CREATE TABLE yi_ly_passages_v2 (
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
  source_metadata_json TEXT NOT NULL
);

INSERT INTO yi_ly_passages_v2 SELECT * FROM yi_ly_passages;
DROP TABLE yi_ly_passages;
ALTER TABLE yi_ly_passages_v2 RENAME TO yi_ly_passages;
CREATE INDEX idx_yi_ly_passages_gua_kind ON yi_ly_passages(hexagram_number, passage_kind, line_position);
CREATE INDEX idx_yi_ly_passages_yilin_pair ON yi_ly_passages(base_hexagram_number, changed_hexagram_number);
CREATE INDEX idx_yi_ly_passages_work ON yi_ly_passages(work_id, passage_kind);
