INSERT INTO dinecore_tables (code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order)
VALUES ('A01', 'A01 桌', '內用區', 'dine_in', 'active', 1, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  area_name = VALUES(area_name),
  dine_mode = VALUES(dine_mode),
  status = VALUES(status),
  is_ordering_enabled = VALUES(is_ordering_enabled),
  sort_order = VALUES(sort_order);

INSERT INTO dinecore_menu_categories (id, name, sort_order)
VALUES
  ('popular', '人氣推薦', 10),
  ('main', '主餐', 20),
  ('drink', '飲品', 30),
  ('seasonal', '季節限定', 40),
  ('new', '新品上市', 50)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order);

INSERT INTO dinecore_menu_items (
  id,
  category_id,
  name,
  description,
  base_price,
  image_url,
  sold_out,
  hidden,
  badge,
  tone,
  tags_json,
  default_note,
  default_option_ids_json,
  option_groups_json
)
VALUES
  (
    'seaweed-noodle-signature',
    'seasonal',
    '經典海藻涼麵',
    '海藻麵搭配招牌醬汁與清爽配菜，適合夏季主打。',
    154,
    'https://picsum.photos/seed/dinecore-seaweed-signature/960/960',
    0,
    0,
    '人氣推薦',
    'green',
    JSON_ARRAY('招牌', '季節限定'),
    '不要香菜',
    JSON_ARRAY('size-regular', 'spice-normal'),
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'size',
        'label', '份量',
        'type', 'single',
        'required', TRUE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'size-regular', 'label', '標準', 'price_delta', 0),
          JSON_OBJECT('id', 'size-large', 'label', '加大', 'price_delta', 20)
        )
      ),
      JSON_OBJECT(
        'id', 'spice',
        'label', '辣度',
        'type', 'single',
        'required', TRUE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'spice-mild', 'label', '小辣', 'price_delta', 0),
          JSON_OBJECT('id', 'spice-normal', 'label', '正常', 'price_delta', 0),
          JSON_OBJECT('id', 'spice-hot', 'label', '大辣', 'price_delta', 10)
        )
      ),
      JSON_OBJECT(
        'id', 'garnish',
        'label', '加料',
        'type', 'multi',
        'required', FALSE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'garnish-scallion', 'label', '加蔥', 'price_delta', 5),
          JSON_OBJECT('id', 'garnish-egg', 'label', '加蛋', 'price_delta', 18)
        )
      )
    )
  ),
  (
    'seaweed-noodle-single',
    'popular',
    '單點海藻涼麵',
    '單點版本，適合小份量或搭配飲品。',
    99,
    'https://picsum.photos/seed/dinecore-seaweed-single/960/960',
    0,
    0,
    '',
    'mint',
    JSON_ARRAY('單點'),
    '',
    JSON_ARRAY('single-size-regular'),
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'single-size',
        'label', '份量',
        'type', 'single',
        'required', TRUE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'single-size-regular', 'label', '標準', 'price_delta', 0),
          JSON_OBJECT('id', 'single-size-large', 'label', '加大', 'price_delta', 15)
        )
      )
    )
  ),
  (
    'chicken-noodle',
    'main',
    '嫩雞胸拌麵',
    '雞胸肉與特製醬汁搭配，份量飽足。',
    203,
    'https://picsum.photos/seed/dinecore-chicken-noodle/960/960',
    0,
    0,
    '',
    'sand',
    JSON_ARRAY('主餐'),
    '麵加大',
    JSON_ARRAY('chicken-size-large'),
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'chicken-size',
        'label', '份量',
        'type', 'single',
        'required', TRUE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'chicken-size-regular', 'label', '標準', 'price_delta', 0),
          JSON_OBJECT('id', 'chicken-size-large', 'label', '加大', 'price_delta', 20)
        )
      ),
      JSON_OBJECT(
        'id', 'chicken-extra',
        'label', '加料',
        'type', 'multi',
        'required', FALSE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'chicken-extra-egg', 'label', '加蛋', 'price_delta', 18),
          JSON_OBJECT('id', 'chicken-extra-veggie', 'label', '加青菜', 'price_delta', 12)
        )
      )
    )
  ),
  (
    'winter-plum-tea',
    'drink',
    '冬梅冰茶',
    '酸甜清爽，適合搭配涼麵。',
    45,
    'https://picsum.photos/seed/dinecore-winter-plum-tea/960/960',
    0,
    0,
    '',
    'amber',
    JSON_ARRAY('飲品'),
    '少冰',
    JSON_ARRAY('tea-sugar-half', 'tea-ice-less'),
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'tea-sugar',
        'label', '甜度',
        'type', 'single',
        'required', TRUE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'tea-sugar-none', 'label', '無糖', 'price_delta', 0),
          JSON_OBJECT('id', 'tea-sugar-half', 'label', '半糖', 'price_delta', 0),
          JSON_OBJECT('id', 'tea-sugar-normal', 'label', '正常', 'price_delta', 0)
        )
      ),
      JSON_OBJECT(
        'id', 'tea-ice',
        'label', '冰量',
        'type', 'single',
        'required', TRUE,
        'options', JSON_ARRAY(
          JSON_OBJECT('id', 'tea-ice-none', 'label', '去冰', 'price_delta', 0),
          JSON_OBJECT('id', 'tea-ice-less', 'label', '少冰', 'price_delta', 0),
          JSON_OBJECT('id', 'tea-ice-normal', 'label', '正常', 'price_delta', 0)
        )
      )
    )
  )
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  description = VALUES(description),
  base_price = VALUES(base_price),
  image_url = VALUES(image_url),
  sold_out = VALUES(sold_out),
  hidden = VALUES(hidden),
  badge = VALUES(badge),
  tone = VALUES(tone),
  tags_json = VALUES(tags_json),
  default_note = VALUES(default_note),
  default_option_ids_json = VALUES(default_option_ids_json),
  option_groups_json = VALUES(option_groups_json);
