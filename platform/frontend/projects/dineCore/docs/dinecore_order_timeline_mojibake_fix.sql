-- dinecore_order_timeline mojibake cleanup
-- Scope: only rows whose note contains obvious mojibake markers (?, �)

START TRANSACTION;

-- 1) Customer submit note
UPDATE dinecore_order_timeline
SET note = '顧客已送出訂單，等待店家處理。'
WHERE source = 'customer'
  AND status = 'pending'
  AND (note LIKE '%?%' OR note LIKE '%�%');

-- 2) Counter notes
UPDATE dinecore_order_timeline
SET note = CONCAT('Counter updated order status to ', status)
WHERE source = 'counter'
  AND (note LIKE '%?%' OR note LIKE '%�%');

-- 3) Kitchen notes
UPDATE dinecore_order_timeline
SET note = CONCAT('Kitchen updated status to ', status)
WHERE source = 'kitchen'
  AND (note LIKE '%?%' OR note LIKE '%�%');

COMMIT;
