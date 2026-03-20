<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QROutputInterface;
use Throwable;

final class DineCoreStaffApiController
{
    public function staffTables(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'kitchen', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $mapId = trim((string)($request->query['map_id'] ?? $request->query['mapId'] ?? ''));
            $response->ok($this->loadStaffTables($mapId !== '' ? $mapId : null));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'STAFF_TABLES_LOAD_FAILED');
        }
    }

    public function counterMapTableStatuses(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $mapId = trim((string)($request->query['map_id'] ?? $request->query['mapId'] ?? ''));
            $response->ok([
                'tables' => $this->loadCounterMapTableStatuses($mapId !== '' ? $mapId : null),
                'polledAt' => date(DATE_ATOM),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_MAP_TABLE_STATUS_LOAD_FAILED');
        }
    }
    public function createStaffTable(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $code = strtoupper(trim((string)($request->body['code'] ?? '')));
        $name = trim((string)($request->body['name'] ?? ''));
        $areaName = trim((string)($request->body['areaName'] ?? $request->body['area_name'] ?? ''));
        $dineMode = trim((string)($request->body['dineMode'] ?? $request->body['dine_mode'] ?? 'dine_in'));

        if ($code === '') {
            $response->error('TABLE_CODE_REQUIRED', 'TABLE_CODE_REQUIRED', 422);
            return;
        }
        if (!preg_match('/^[A-Z0-9_-]+$/', $code)) {
            $response->error('TABLE_CODE_INVALID', 'TABLE_CODE_INVALID', 422);
            return;
        }
        if ($this->findTableByCode($code) !== null) {
            $response->error('TABLE_CODE_ALREADY_EXISTS', 'TABLE_CODE_ALREADY_EXISTS', 409);
            return;
        }

        $safeName = $name !== '' ? $name : $code;
        $safeAreaName = $areaName !== '' ? $areaName : '';
        $safeDineMode = in_array($dineMode, ['dine_in', 'takeout', 'pickup'], true) ? $dineMode : 'dine_in';

        try {
            $sortOrder = $this->resolveNextTableSortOrder();
            $stmt = db()->prepare(
                'INSERT INTO dinecore_tables (code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$code, $safeName, $safeAreaName, $safeDineMode, 'active', 1, $sortOrder]);

            $response->ok([
                'tables' => $this->loadStaffTables(),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'TABLE_CREATE_FAILED');
        }
    }

    public function updateStaffTable(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $code = strtoupper(trim((string)($request->body['code'] ?? '')));
        if ($code === '') {
            $response->error('TABLE_CODE_REQUIRED', 'TABLE_CODE_REQUIRED', 422);
            return;
        }

        $table = $this->findTableByCode($code);
        if ($table === null) {
            $response->notFound('TABLE_NOT_FOUND');
            return;
        }

        $name = $request->body['name'] ?? null;
        $areaName = $request->body['areaName'] ?? $request->body['area_name'] ?? null;
        $note = $request->body['note'] ?? null;
        $dineMode = $request->body['dineMode'] ?? $request->body['dine_mode'] ?? null;
        $status = $request->body['status'] ?? null;
        $orderingEnabled = $request->body['orderingEnabled'] ?? $request->body['ordering_enabled'] ?? null;
        $maxActiveOrders = $request->body['maxActiveOrders'] ?? $request->body['max_active_orders'] ?? null;

        $nextName = is_string($name) ? trim($name) : (string)$table['name'];
        $nextAreaName = is_string($areaName) ? trim($areaName) : (string)($table['area_name'] ?? '');
        $nextNote = is_string($note) ? trim($note) : (string)($table['note'] ?? '');
        $nextDineMode = is_string($dineMode) ? trim($dineMode) : (string)$table['dine_mode'];
        $nextStatus = is_string($status) ? trim($status) : (string)$table['status'];
        $nextOrderingEnabled = is_bool($orderingEnabled)
            ? $orderingEnabled
            : ((string)$orderingEnabled === '1' || (string)$orderingEnabled === 'true');
        if ($orderingEnabled === null) {
            $nextOrderingEnabled = (int)$table['is_ordering_enabled'] === 1;
        }

        if (!in_array($nextDineMode, ['dine_in', 'takeout', 'pickup'], true)) {
            $nextDineMode = (string)$table['dine_mode'];
        }
        if (!in_array($nextStatus, ['active', 'cleaning', 'inactive'], true)) {
            $nextStatus = (string)$table['status'];
        }
        if ($nextName === '') {
            $nextName = $code;
        }

        $nextMaxActiveOrders = $maxActiveOrders === null
            ? max(1, (int)($table['max_active_orders'] ?? 1))
            : max(1, (int)$maxActiveOrders);

        try {
            $stmt = db()->prepare(
                'UPDATE dinecore_tables
                 SET name = ?, area_name = ?, dine_mode = ?, status = ?, is_ordering_enabled = ?, max_active_orders = ?, note = ?, updated_at = NOW()
                 WHERE code = ?'
            );
            $stmt->execute([
                $nextName,
                $nextAreaName,
                $nextDineMode,
                $nextStatus,
                $nextOrderingEnabled ? 1 : 0,
                $nextMaxActiveOrders,
                $nextNote,
                $code,
            ]);

            $updated = $this->findTableByCode($code);
            if ($updated === null) {
                $response->notFound('TABLE_NOT_FOUND');
                return;
            }

            $response->ok([
                'table' => $this->normalizeStaffTable($updated),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'TABLE_UPDATE_FAILED');
        }
    }
    public function deleteStaffTable(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $code = strtoupper(trim((string)($request->body['code'] ?? '')));
        if ($code === '') {
            $response->error('TABLE_CODE_REQUIRED', 'TABLE_CODE_REQUIRED', 422);
            return;
        }

        if ($this->findTableByCode($code) === null) {
            $response->notFound('TABLE_NOT_FOUND');
            return;
        }

        try {
            $stmt = db()->prepare('DELETE FROM dinecore_tables WHERE code = ?');
            $stmt->execute([$code]);
            $this->normalizeTableSortOrders();

            $response->ok([
                'tables' => $this->loadStaffTables(),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'TABLE_DELETE_FAILED');
        }
    }

    public function reorderStaffTables(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $code = strtoupper(trim((string)($request->body['code'] ?? '')));
        $direction = trim((string)($request->body['direction'] ?? ''));
        if ($code === '') {
            $response->error('TABLE_CODE_REQUIRED', 'TABLE_CODE_REQUIRED', 422);
            return;
        }
        if (!in_array($direction, ['up', 'down'], true)) {
            $response->error('TABLE_REORDER_DIRECTION_REQUIRED', 'TABLE_REORDER_DIRECTION_REQUIRED', 422);
            return;
        }

        try {
            $rows = db()->query(
                'SELECT id, code
                 FROM dinecore_tables
                 ORDER BY sort_order ASC, id ASC'
            )->fetchAll() ?: [];

            $index = -1;
            foreach ($rows as $i => $row) {
                if (strtoupper((string)$row['code']) === $code) {
                    $index = $i;
                    break;
                }
            }
            if ($index < 0) {
                $response->notFound('TABLE_NOT_FOUND');
                return;
            }

            $targetIndex = $direction === 'up' ? $index - 1 : $index + 1;
            if ($targetIndex >= 0 && $targetIndex < count($rows)) {
                $current = $rows[$index];
                $target = $rows[$targetIndex];
                $rows[$index] = $target;
                $rows[$targetIndex] = $current;
            }

            $update = db()->prepare('UPDATE dinecore_tables SET sort_order = ?, updated_at = NOW() WHERE id = ?');
            foreach ($rows as $i => $row) {
                $update->execute([$i + 1, (int)$row['id']]);
            }

            $response->ok([
                'tables' => $this->loadStaffTables(),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'TABLE_REORDER_FAILED');
        }
    }

    public function saveMapEditorDraft(Request $request, Response $response): void
    {
        $this->saveMapEditorFile($request, $response, 'draft');
    }

    public function saveMapEditorFinal(Request $request, Response $response): void
    {
        $this->saveMapEditorFile($request, $response, 'final');
    }

    public function listMapEditorFiles(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $response->ok([
                'maps' => $this->listMapEditorSummaries(),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MAP_FILE_LIST_FAILED');
        }
    }

    public function loadMapEditorFile(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $mapId = trim((string)($request->query['map_id'] ?? $request->query['mapId'] ?? ''));
        $status = trim((string)($request->query['status'] ?? 'draft'));
        if ($mapId === '') {
            $response->validation('MAP_ID_REQUIRED');
            return;
        }

        if (!in_array($status, ['draft', 'final'], true)) {
            $status = 'draft';
        }

        try {
            $path = $this->buildMapEditorFilePath($mapId, $status);
            if (!is_file($path)) {
                $response->notFound('MAP_FILE_NOT_FOUND');
                return;
            }

            $raw = @file_get_contents($path);
            if (!is_string($raw) || trim($raw) === '') {
                $response->internal('MAP_FILE_READ_FAILED');
                return;
            }

            $decoded = json_decode($raw, true);
            if (!is_array($decoded)) {
                $response->internal('MAP_FILE_DECODE_FAILED');
                return;
            }

            $response->ok($decoded);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MAP_FILE_LOAD_FAILED');
        }
    }

    public function listFinalMapEditorFiles(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $maps = array_values(array_filter(
                $this->listMapEditorSummaries(),
                fn (array $item): bool => in_array('final', $item['availableStatuses'] ?? [], true)
            ));
            $response->ok(['maps' => $maps]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'FINAL_MAP_FILE_LIST_FAILED');
        }
    }

    public function loadFinalMapEditorFile(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $mapId = trim((string)($request->query['map_id'] ?? $request->query['mapId'] ?? ''));
        if ($mapId === '') {
            $response->validation('MAP_ID_REQUIRED');
            return;
        }

        try {
            $decoded = $this->readMapEditorFileRecord($mapId, 'final');
            if ($decoded === null) {
                $response->notFound('MAP_FILE_NOT_FOUND');
                return;
            }

            $response->ok($decoded);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'FINAL_MAP_FILE_LOAD_FAILED');
        }
    }

    public function importStaffTablesFromMap(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $mapId = trim((string)($request->body['map_id'] ?? $request->body['mapId'] ?? ''));
        if ($mapId === '') {
            $response->validation('MAP_ID_REQUIRED');
            return;
        }

        try {
            $response->ok($this->importStaffTablesFromFinalMap($mapId, false));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'TABLE_IMPORT_FROM_MAP_FAILED');
        }
    }

    public function reimportStaffTablesFromMap(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $mapId = trim((string)($request->body['map_id'] ?? $request->body['mapId'] ?? ''));
        if ($mapId === '') {
            $response->validation('MAP_ID_REQUIRED');
            return;
        }

        try {
            $response->ok($this->importStaffTablesFromFinalMap($mapId, true));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'TABLE_REIMPORT_FROM_MAP_FAILED');
        }
    }

    public function counterOrders(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $tableCode = trim((string)($request->query['table_code'] ?? ''));
            $orderNo = trim((string)($request->query['order_no'] ?? ''));
            $orderStatus = trim((string)($request->query['order_status'] ?? 'all'));
            $paymentStatus = trim((string)($request->query['payment_status'] ?? 'all'));

            $sql = 'SELECT id, order_no, table_code, order_status, payment_status, payment_method, total_amount, created_at, updated_at
                    FROM dinecore_orders
                    WHERE EXISTS (
                        SELECT 1
                        FROM dinecore_order_batches b
                        WHERE b.order_id = dinecore_orders.id
                          AND b.status <> "draft"
                    )
                      AND order_status <> "merged"';
            $params = [];

            if ($tableCode !== '') {
                $sql .= ' AND table_code LIKE ?';
                $params[] = '%' . $tableCode . '%';
            }
            if ($orderNo !== '') {
                $sql .= ' AND order_no LIKE ?';
                $params[] = '%' . $orderNo . '%';
            }
            if ($paymentStatus !== '' && $paymentStatus !== 'all') {
                $sql .= ' AND payment_status = ?';
                $params[] = $paymentStatus;
            }

            $sql .= ' ORDER BY created_at DESC, id DESC';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            $orders = array_values(array_filter(
                array_map(function (array $order): array {
                    $batches = $this->listOrderBatches((int)$order['id']);
                    return $this->normalizeOrderRowWithDerivedStatus($order, $batches);
                }, $stmt->fetchAll() ?: []),
                fn (array $order): bool => $orderStatus === '' || $orderStatus === 'all'
                    ? true
                    : (string)$order['order_status'] === $orderStatus
            ));

            $response->ok(array_map(function (array $order): array {
                $batches = $this->listOrderBatches((int)$order['id']);
                $activeSessions = $this->listSessionsForOrder((int)$order['id'], true);
                $allSessions = $this->listSessionsForOrder((int)$order['id'], false);
                $visibleBatches = $this->filterEffectiveBatches($batches);
                $latestBatch = $visibleBatches !== [] ? $visibleBatches[array_key_last($visibleBatches)] : null;
                $draftBatches = array_values(array_filter(
                    $batches,
                    fn (array $batch): bool => (string)$batch['status'] === 'draft'
                ));
                $draftBatch = $draftBatches !== [] ? $draftBatches[array_key_last($draftBatches)] : null;
                $primarySession = $allSessions[0] ?? null;
                $canAppend = $draftBatch !== null && (string)$order['payment_status'] !== 'paid';

                return [
                    'id' => (int)$order['id'],
                    'orderNo' => (string)$order['order_no'],
                    'tableCode' => (string)$order['table_code'],
                    'orderStatus' => (string)$order['order_status'],
                    'paymentStatus' => (string)$order['payment_status'],
                    'paymentMethod' => (string)$order['payment_method'],
                    'totalAmount' => (int)$order['total_amount'],
                    'guestCount' => count($activeSessions),
                    'guestLabel' => $primarySession ? (string)$primarySession['display_label'] : '',
                    'createdAt' => (string)$order['created_at'],
                    'updatedAt' => (string)($order['updated_at'] ?? $order['created_at']),
                    'batchCount' => count($visibleBatches),
                    'latestBatchNo' => $latestBatch ? (int)$latestBatch['batch_no'] : 0,
                    'latestBatchStatus' => $latestBatch ? (string)$latestBatch['status'] : '',
                    'draftBatchNo' => $draftBatch ? (int)$draftBatch['batch_no'] : 0,
                    'canAppend' => $canAppend && !in_array((string)$order['order_status'], ['cancelled', 'merged', 'picked_up'], true),
                ];
            }, $orders));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_ORDERS_LOAD_FAILED');
        }
    }

    public function counterOrderDetail(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $orderId = (int)($request->query['order_id'] ?? 0);
        if ($orderId <= 0) {
            $response->validation('ORDER_ID_REQUIRED');
            return;
        }

        try {
            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }

            $timeline = $this->loadOrderTimeline($orderId);
            $batches = $this->buildBatchDetails($orderId);
            $persons = $this->buildOrderPersons($orderId);
            $items = [];
            foreach ($batches as $batch) {
                foreach ($batch['persons'] as $person) {
                    foreach ($person['items'] as $item) {
                        $items[] = array_merge($item, [
                            'guestLabel' => $person['guestLabel'],
                            'batchNo' => $batch['batchNo'],
                            'batchStatus' => $batch['status'],
                        ]);
                    }
                }
            }

            $order = $this->normalizeOrderRowWithDerivedStatus($order);

            $response->ok([
                'order' => [
                    'id' => (int)$order['id'],
                    'orderNo' => (string)$order['order_no'],
                    'tableCode' => (string)$order['table_code'],
                    'orderStatus' => (string)$order['order_status'],
                    'paymentStatus' => (string)$order['payment_status'],
                    'paymentMethod' => (string)$order['payment_method'],
                    'subtotalAmount' => (int)$order['subtotal_amount'],
                    'serviceFeeAmount' => (int)$order['service_fee_amount'],
                    'taxAmount' => (int)$order['tax_amount'],
                    'totalAmount' => (int)$order['total_amount'],
                    'createdAt' => (string)$order['created_at'],
                ],
                'persons' => $persons,
                'items' => $items,
                'batches' => $batches,
                'timeline' => $timeline,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_ORDER_DETAIL_LOAD_FAILED');
        }
    }

    public function counterMergeCandidates(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $orderId = (int)($request->query['order_id'] ?? 0);
        if ($orderId <= 0) {
            $response->validation('ORDER_ID_REQUIRED');
            return;
        }

        try {
            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }

            $response->ok([
                'candidates' => $this->listMergeCandidatesForOrder($order),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_MERGE_CANDIDATES_FAILED');
        }
    }

    public function counterMergeOrders(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $targetOrderId = (int)($request->body['targetOrderId'] ?? $request->body['target_order_id'] ?? 0);
        $mergedOrderId = (int)($request->body['mergedOrderId'] ?? $request->body['merged_order_id'] ?? 0);
        $reason = trim((string)($request->body['reason'] ?? ''));
        if ($targetOrderId <= 0 || $mergedOrderId <= 0 || $targetOrderId === $mergedOrderId) {
            $response->validation('MERGE_ORDER_PARAMS_REQUIRED');
            return;
        }

        $pdo = db();
        $startedTransaction = !$pdo->inTransaction();

        try {
            if ($startedTransaction) {
                $pdo->beginTransaction();
            }

            $targetOrder = $this->findOrderById($targetOrderId);
            $mergedOrder = $this->findOrderById($mergedOrderId);
            if ($targetOrder === null || $mergedOrder === null) {
                $response->notFound('ORDER_NOT_FOUND');
                if ($startedTransaction && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                return;
            }

            $this->assertMergeableOrders($targetOrder, $mergedOrder);

            $batchRows = array_values(array_filter(
                $this->listOrderBatches((int)$mergedOrder['id']),
                fn (array $batch): bool => (string)$batch['status'] !== 'draft'
            ));
            $nextBatchNo = $this->resolveMaxBatchNo((int)$targetOrder['id']);
            foreach ($batchRows as $batch) {
                $nextBatchNo += 1;
                $updateBatch = $pdo->prepare(
                    'UPDATE dinecore_order_batches
                     SET order_id = ?, batch_no = ?, updated_at = NOW()
                     WHERE id = ?'
                );
                $updateBatch->execute([(int)$targetOrder['id'], $nextBatchNo, (int)$batch['id']]);

                $updateItems = $pdo->prepare(
                    'UPDATE dinecore_cart_items
                     SET order_id = ?, updated_at = NOW()
                     WHERE batch_id = ?'
                );
                $updateItems->execute([(int)$targetOrder['id'], (int)$batch['id']]);
            }

            $this->recalculateOrderAmounts((int)$targetOrder['id']);
            $this->syncOrderStatusFromBatches((int)$targetOrder['id']);

            $mergedUpdate = $pdo->prepare(
                'UPDATE dinecore_orders
                 SET order_status = ?, subtotal_amount = 0, service_fee_amount = 0, tax_amount = 0, total_amount = 0, updated_at = NOW()
                 WHERE id = ?'
            );
            $mergedUpdate->execute(['merged', (int)$mergedOrder['id']]);

            $record = $pdo->prepare(
                'INSERT INTO dinecore_order_merge_records
                    (target_order_id, merged_order_id, table_code, merged_by_user_id, reason, snapshot_json, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())'
            );
            $record->execute([
                (int)$targetOrder['id'],
                (int)$mergedOrder['id'],
                (string)$targetOrder['table_code'],
                (int)($context['user_id'] ?? 0) ?: null,
                $reason,
                json_encode([
                    'targetOrderNo' => (string)$targetOrder['order_no'],
                    'mergedOrderNo' => (string)$mergedOrder['order_no'],
                    'mergedBatchIds' => array_map(fn (array $batch): int => (int)$batch['id'], $batchRows),
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);

            $timeline = $pdo->prepare(
                'INSERT INTO dinecore_order_timeline (order_id, status, source, note, changed_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $timeline->execute([
                (int)$targetOrder['id'],
                (string)($this->findOrderById((int)$targetOrder['id'])['order_status'] ?? 'pending'),
                'counter',
                sprintf('Merged order %s into this order', (string)$mergedOrder['order_no']),
            ]);
            $timeline->execute([
                (int)$mergedOrder['id'],
                'merged',
                'counter',
                sprintf('Merged into order %s', (string)$targetOrder['order_no']),
            ]);

            $this->rebindMergedSessions((string)$targetOrder['table_code'], (int)$mergedOrder['id'], (int)$targetOrder['id']);

            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->commit();
            }

            $response->ok([
                'targetOrderId' => (int)$targetOrder['id'],
                'mergedOrderId' => (int)$mergedOrder['id'],
                'targetOrderNo' => (string)$targetOrder['order_no'],
            ]);
        } catch (Throwable $error) {
            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $message = $error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_MERGE_ORDERS_FAILED';
            if (in_array($message, ['MERGE_TABLE_MISMATCH', 'MERGE_DATE_MISMATCH', 'MERGE_ORDER_PAID', 'MERGE_ORDER_INVALID_STATUS'], true)) {
                $response->error($message, $message, 409);
                return;
            }
            $response->internal($message);
        }
    }

    public function counterUpdateOrderStatus(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $orderId = (int)($request->body['orderId'] ?? $request->body['order_id'] ?? 0);
        $orderStatus = trim((string)($request->body['orderStatus'] ?? $request->body['order_status'] ?? ''));
        $note = trim((string)($request->body['note'] ?? ''));
        $batchId = (int)($request->body['batchId'] ?? $request->body['batch_id'] ?? 0);

        if ($orderId <= 0 || $orderStatus === '') {
            $response->validation('ORDER_STATUS_REQUIRED');
            return;
        }

        try {
            if ($this->isBusinessDateLockedForOrder($orderId)) {
                $response->error('BUSINESS_DATE_LOCKED', 'BUSINESS_DATE_LOCKED', 409);
                return;
            }

            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }

            if ($batchId > 0) {
                $stmt = db()->prepare(
                    'UPDATE dinecore_order_batches
                     SET status = ?, updated_at = NOW()
                     WHERE id = ? AND order_id = ?'
                );
                $stmt->execute([$orderStatus, $batchId, $orderId]);
                $this->syncOrderStatusFromBatches($orderId);
            } elseif (in_array($orderStatus, ['pending', 'submitted', 'preparing', 'ready', 'picked_up'], true)) {
                $this->updateLatestEffectiveBatchStatus($orderId, $orderStatus);
                $this->syncOrderStatusFromBatches($orderId);
            } else {
                $stmt = db()->prepare(
                    'UPDATE dinecore_orders
                     SET order_status = ?, updated_at = NOW()
                     WHERE id = ?'
                );
                $stmt->execute([$orderStatus, $orderId]);
            }

            $timeline = db()->prepare(
                'INSERT INTO dinecore_order_timeline (order_id, status, source, note, changed_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $timeline->execute([
                $orderId,
                $orderStatus,
                'counter',
                $note !== '' ? $note : sprintf('Counter updated order status to %s', $this->labelOrderStatus($orderStatus)),
            ]);

            $response->ok([
                'id' => $orderId,
                'orderStatus' => $orderStatus,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_UPDATE_FAILED');
        }
    }

    public function counterUpdatePaymentStatus(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $orderId = (int)($request->body['orderId'] ?? $request->body['order_id'] ?? 0);
        $paymentStatus = trim((string)($request->body['paymentStatus'] ?? $request->body['payment_status'] ?? ''));
        if ($orderId <= 0 || $paymentStatus === '') {
            $response->validation('PAYMENT_STATUS_REQUIRED');
            return;
        }

        try {
            if ($this->isBusinessDateLockedForOrder($orderId)) {
                $response->error('BUSINESS_DATE_LOCKED', 'BUSINESS_DATE_LOCKED', 409);
                return;
            }

            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }

            $paymentMethod = $paymentStatus === 'paid' ? 'cash' : 'unpaid';
            $stmt = db()->prepare(
                'UPDATE dinecore_orders
                 SET payment_status = ?, payment_method = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([$paymentStatus, $paymentMethod, $orderId]);

            if ($paymentStatus === 'paid') {
                $this->closeTableSessionsForOrder($orderId);
            } else {
                $this->ensureActiveTableSessionForOrder($orderId, (string)$order['table_code']);
            }

            $timeline = db()->prepare(
                'INSERT INTO dinecore_order_timeline (order_id, status, source, note, changed_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $timeline->execute([
                $orderId,
                (string)$order['order_status'],
                'counter',
                sprintf('Counter updated payment status to %s', $this->labelPaymentStatus($paymentStatus)),
            ]);

            $response->ok([
                'id' => $orderId,
                'paymentStatus' => $paymentStatus,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'COUNTER_PAYMENT_UPDATE_FAILED');
        }
    }

    public function kitchenOrders(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['kitchen', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $stmt = db()->query(
                'SELECT b.id, b.order_id, b.batch_no, b.status, b.submitted_at,
                        o.order_no, o.table_code, o.estimated_wait_minutes, o.created_at,
                        GREATEST(0, TIMESTAMPDIFF(MINUTE, COALESCE(b.submitted_at, o.created_at), NOW())) AS wait_minutes
                 FROM dinecore_order_batches b
                 INNER JOIN dinecore_orders o ON o.id = b.order_id
                 WHERE b.status IN ("pending", "submitted", "preparing", "ready")
                 ORDER BY COALESCE(b.submitted_at, o.created_at) ASC, b.id ASC'
            );
            $rows = $stmt->fetchAll() ?: [];

            $response->ok(array_map(function (array $row): array {
                $items = $this->listBatchItems((int)$row['order_id'], (int)$row['id']);
                return [
                    'id' => (int)$row['id'],
                    'orderId' => (int)$row['order_id'],
                    'orderNo' => (string)$row['order_no'],
                    'tableCode' => (string)$row['table_code'],
                    'orderStatus' => (string)$row['status'],
                    'batchNo' => (int)$row['batch_no'],
                    'createdAt' => (string)($row['submitted_at'] ?? $row['created_at']),
                    'waitMinutes' => (int)($row['wait_minutes'] ?? 0),
                    'waitLabel' => sprintf('%d min', (int)($row['estimated_wait_minutes'] ?? 0)),
                    'items' => $items,
                ];
            }, $rows));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'KITCHEN_ORDERS_LOAD_FAILED');
        }
    }

    public function kitchenUpdateOrderStatus(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['kitchen', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $batchId = (int)($request->body['batchId'] ?? $request->body['batch_id'] ?? $request->body['orderId'] ?? $request->body['order_id'] ?? 0);
        $orderStatus = trim((string)($request->body['orderStatus'] ?? $request->body['order_status'] ?? ''));
        if ($batchId <= 0 || $orderStatus === '') {
            $response->validation('KITCHEN_STATUS_REQUIRED');
            return;
        }

        try {
            $batch = $this->findBatchById($batchId);
            if ($batch === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }

            if ($this->isBusinessDateLockedForOrder((int)$batch['order_id'])) {
                $response->error('BUSINESS_DATE_LOCKED', 'BUSINESS_DATE_LOCKED', 409);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_order_batches
                 SET status = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([$orderStatus, $batchId]);
            $this->syncOrderStatusFromBatches((int)$batch['order_id']);

            $timeline = db()->prepare(
                'INSERT INTO dinecore_order_timeline (order_id, status, source, note, changed_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $timeline->execute([
                (int)$batch['order_id'],
                $orderStatus,
                'kitchen',
                sprintf('Kitchen updated batch %d status to %s', (int)$batch['batch_no'], $this->labelOrderStatus($orderStatus)),
            ]);

            $response->ok([
                'id' => $batchId,
                'orderStatus' => $orderStatus,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'KITCHEN_UPDATE_FAILED');
        }
    }

    public function reportsSummary(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $filters = $this->normalizeReportFilters($request);
            $orders = $this->loadReportOrders($filters);
            $summary = $this->buildReportsSummaryPayload($orders, $filters);
            $response->ok($summary);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'REPORTS_SUMMARY_LOAD_FAILED');
        }
    }

    public function reportsOrders(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $filters = $this->normalizeReportFilters($request);
            $orders = $this->loadReportOrders($filters);
            $response->ok([
                'orders' => array_map(fn (array $order) => $this->normalizeReportOrderRow($order), $orders),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'REPORTS_ORDERS_LOAD_FAILED');
        }
    }

    public function menuAdminItems(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $response->ok($this->buildMenuAdminSnapshot());
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_ITEMS_FAILED');
        }
    }

    public function menuAdminCreateCategory(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $name = trim((string)($request->body['name'] ?? ''));
        if ($name === '') {
            $response->error('MENU_CATEGORY_NAME_REQUIRED', 'MENU_CATEGORY_NAME_REQUIRED', 422);
            return;
        }

        try {
            if ($this->menuCategoryNameExists($name)) {
                $response->error('MENU_CATEGORY_ALREADY_EXISTS', 'MENU_CATEGORY_ALREADY_EXISTS', 409);
                return;
            }

            $stmt = db()->prepare(
                'INSERT INTO dinecore_menu_categories (id, name, sort_order, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())'
            );
            $stmt->execute([
                $this->generateMenuCategoryId(),
                $name,
                $this->resolveNextMenuCategorySortOrder(),
            ]);

            $response->ok($this->buildMenuAdminSnapshot());
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_CREATE_CATEGORY_FAILED');
        }
    }

    public function menuAdminUpdateCategory(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $categoryId = trim((string)($request->body['categoryId'] ?? $request->body['category_id'] ?? ''));
        $name = trim((string)($request->body['name'] ?? ''));

        if ($categoryId === '' || !$this->menuCategoryExists($categoryId)) {
            $response->error('MENU_CATEGORY_NOT_FOUND', 'MENU_CATEGORY_NOT_FOUND', 404);
            return;
        }

        if ($name === '') {
            $response->error('MENU_CATEGORY_NAME_REQUIRED', 'MENU_CATEGORY_NAME_REQUIRED', 422);
            return;
        }

        try {
            if ($this->menuCategoryNameExists($name, $categoryId)) {
                $response->error('MENU_CATEGORY_ALREADY_EXISTS', 'MENU_CATEGORY_ALREADY_EXISTS', 409);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_menu_categories
                 SET name = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([$name, $categoryId]);

            $response->ok($this->buildMenuAdminSnapshot());
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_CATEGORY_FAILED');
        }
    }

    public function menuAdminDeleteCategory(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $categoryId = trim((string)($request->body['categoryId'] ?? $request->body['category_id'] ?? ''));
        if ($categoryId === '' || !$this->menuCategoryExists($categoryId)) {
            $response->error('MENU_CATEGORY_NOT_FOUND', 'MENU_CATEGORY_NOT_FOUND', 404);
            return;
        }

        try {
            if ($this->menuCategoryHasItems($categoryId)) {
                $response->error('MENU_CATEGORY_IN_USE', 'MENU_CATEGORY_IN_USE', 409);
                return;
            }

            $stmt = db()->prepare('DELETE FROM dinecore_menu_categories WHERE id = ?');
            $stmt->execute([$categoryId]);
            $this->normalizeMenuCategorySortOrders();

            $response->ok($this->buildMenuAdminSnapshot());
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_DELETE_CATEGORY_FAILED');
        }
    }

    public function menuAdminReorderCategories(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $categoryIds = $request->body['categoryIds'] ?? $request->body['category_ids'] ?? null;
        if (!is_array($categoryIds) || $categoryIds === []) {
            $response->error('MENU_CATEGORY_ORDER_REQUIRED', 'MENU_CATEGORY_ORDER_REQUIRED', 422);
            return;
        }

        $normalizedCategoryIds = array_values(array_map(
            static fn ($id): string => trim((string)$id),
            $categoryIds
        ));
        if (in_array('', $normalizedCategoryIds, true)) {
            $response->error('MENU_CATEGORY_ORDER_REQUIRED', 'MENU_CATEGORY_ORDER_REQUIRED', 422);
            return;
        }

        $existingCategoryIds = array_map(
            static fn (array $category): string => (string)$category['id'],
            $this->loadMenuAdminCategories()
        );

        $sortedRequestedIds = $normalizedCategoryIds;
        $sortedExistingIds = $existingCategoryIds;
        sort($sortedRequestedIds);
        sort($sortedExistingIds);
        if ($sortedRequestedIds !== $sortedExistingIds) {
            $response->error('MENU_CATEGORY_REORDER_INVALID', 'MENU_CATEGORY_REORDER_INVALID', 422);
            return;
        }

        $pdo = db();
        $startedTransaction = !$pdo->inTransaction();

        try {
            if ($startedTransaction) {
                $pdo->beginTransaction();
            }

            $update = $pdo->prepare(
                'UPDATE dinecore_menu_categories
                 SET sort_order = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            foreach ($normalizedCategoryIds as $index => $categoryId) {
                $update->execute([($index + 1) * 10, $categoryId]);
            }

            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->commit();
            }

            $response->ok($this->buildMenuAdminSnapshot());
        } catch (Throwable $error) {
            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_REORDER_CATEGORIES_FAILED');
        }
    }

    public function generateTableQr(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $tableCode = strtoupper(trim((string)(
            $request->body['table_code']
            ?? $request->body['tableCode']
            ?? $request->query['table_code']
            ?? $request->query['tableCode']
            ?? ''
        )));

        if ($tableCode === '') {
            $response->error('TABLE_CODE_REQUIRED', 'TABLE_CODE_REQUIRED', 422);
            return;
        }

        if (!preg_match('/^[A-Z0-9_-]+$/', $tableCode)) {
            $response->error('TABLE_CODE_INVALID', 'TABLE_CODE_INVALID', 422);
            return;
        }

        try {
            $table = $this->findTableByCode($tableCode);
            if ($table === null) {
                $response->error('TABLE_NOT_FOUND', 'TABLE_NOT_FOUND', 404);
                return;
            }

            if (!class_exists(QRCode::class) || !class_exists(QROptions::class)) {
                $response->error('QR_LIBRARY_MISSING', 'QR_LIBRARY_MISSING', 500);
                return;
            }

            if (!extension_loaded('gd')) {
                $response->error('GD_EXTENSION_MISSING', 'GD_EXTENSION_MISSING', 500);
                return;
            }

            $entryUrl = rtrim($this->resolveEntryBaseUrl($request), '/') . '/t/' . $tableCode;
            $pngBinary = (new QRCode(new QROptions([
                'outputType' => QROutputInterface::GDIMAGE_PNG,
                'outputBase64' => false,
                'eccLevel' => QRCode::ECC_M,
                'scale' => 8,
                'addQuietzone' => true,
                'quietzoneSize' => 4,
            ])))->render($entryUrl);

            if (!is_string($pngBinary) || $pngBinary === '') {
                $response->error('QR_GENERATE_FAILED', 'QR_GENERATE_FAILED', 500);
                return;
            }

            $dir = BASE_PATH . '/public/assets/QRC';
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                $response->error('QR_SAVE_FAILED', 'QR_SAVE_FAILED', 500);
                return;
            }
            if (!is_writable($dir)) {
                $response->error('QR_DIR_NOT_WRITABLE', 'QR_DIR_NOT_WRITABLE', 500);
                return;
            }

            $fileName = $tableCode . '.png';
            $path = $dir . '/' . $fileName;
            if (is_file($path) && !is_writable($path)) {
                $response->error('QR_SAVE_FAILED', 'QR_SAVE_FAILED', 500);
                return;
            }

            // Force overwrite same table QR file so regenerated content is always the latest.
            $written = @file_put_contents($path, $pngBinary, LOCK_EX);
            if ($written === false || $written <= 0) {
                $response->error('QR_SAVE_FAILED', 'QR_SAVE_FAILED', 500);
                return;
            }

            $publicPath = 'assets/QRC/' . rawurlencode($fileName);
            $response->ok([
                'tableCode' => $tableCode,
                'fileName' => $fileName,
                'publicPath' => $publicPath,
                'publicUrl' => $publicPath,
                'entryUrl' => $entryUrl,
                'updatedAt' => date('c'),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'QR_GENERATE_FAILED');
        }
    }

    public function menuAdminCreateItem(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $title = trim((string)($request->body['title'] ?? ''));
        $categoryId = trim((string)($request->body['categoryId'] ?? $request->body['category_id'] ?? ''));
        $priceRaw = $request->body['price'] ?? 0;
        $description = trim((string)($request->body['description'] ?? ''));
        $imageUrl = trim((string)($request->body['imageUrl'] ?? $request->body['image_url'] ?? ''));

        if ($title === '') {
            $response->error('MENU_ITEM_TITLE_REQUIRED', 'MENU_ITEM_TITLE_REQUIRED', 422);
            return;
        }

        if ($categoryId === '' || !$this->menuCategoryExists($categoryId)) {
            $response->error('MENU_CATEGORY_NOT_FOUND', 'MENU_CATEGORY_NOT_FOUND', 404);
            return;
        }

        if (!is_numeric($priceRaw) || (float)$priceRaw < 0) {
            $response->error('INVALID_MENU_ITEM_PRICE', 'INVALID_MENU_ITEM_PRICE', 422);
            return;
        }

        try {
            $itemId = $this->generateMenuItemId();
            $stmt = db()->prepare(
                'INSERT INTO dinecore_menu_items
                    (id, category_id, name, description, base_price, image_url, sold_out, hidden, badge, tone, tags_json, default_note, default_option_ids_json, option_groups_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
            );
            $stmt->execute([
                $itemId,
                $categoryId,
                $title,
                $description,
                (int)round((float)$priceRaw),
                $imageUrl,
                '',
                '',
                '[]',
                '',
                '[]',
                '[]',
            ]);

            $response->ok($this->buildMenuAdminSnapshot());
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_CREATE_ITEM_FAILED');
        }
    }

    public function menuAdminUpdateItemStatus(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        if ($itemId === '') {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }

        $soldOut = $request->body['soldOut'] ?? $request->body['sold_out'] ?? null;
        $hidden = $request->body['hidden'] ?? null;
        $nextSoldOut = $this->normalizeOptionalBoolean($soldOut);
        $nextHidden = $this->normalizeOptionalBoolean($hidden);

        try {
            if (!$this->menuItemExists($itemId)) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $itemRow = $this->findMenuItemRowForAdmin($itemId);
            if ($itemRow === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_menu_items
                 SET sold_out = ?, hidden = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([
                $nextSoldOut ?? ((int)$itemRow['sold_out'] === 1),
                $nextHidden ?? ((int)$itemRow['hidden'] === 1),
                $itemId,
            ]);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_ITEM_STATUS_FAILED');
        }
    }

    public function menuAdminUpdateItemPrice(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $priceRaw = $request->body['price'] ?? null;

        if ($itemId === '') {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }

        if (!is_numeric($priceRaw) || (float)$priceRaw < 0) {
            $response->error('INVALID_MENU_ITEM_PRICE', 'INVALID_MENU_ITEM_PRICE', 422);
            return;
        }

        try {
            if (!$this->menuItemExists($itemId)) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_menu_items
                 SET base_price = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([(int)round((float)$priceRaw), $itemId]);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_ITEM_PRICE_FAILED');
        }
    }

    public function menuAdminUpdateItemContent(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $title = trim((string)($request->body['title'] ?? ''));
        $description = trim((string)($request->body['description'] ?? ''));

        if ($itemId === '') {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }

        if ($title === '') {
            $response->error('MENU_ITEM_TITLE_REQUIRED', 'MENU_ITEM_TITLE_REQUIRED', 422);
            return;
        }

        try {
            if (!$this->menuItemExists($itemId)) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_menu_items
                 SET name = ?, description = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([$title, $description, $itemId]);

            $categoryNameById = $this->menuCategoryNameMap();
            $itemRow = $this->findMenuItemRowForAdmin($itemId);
            if ($itemRow === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $response->ok([
                'item' => $this->normalizeMenuAdminItem($itemRow, $categoryNameById),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_ITEM_CONTENT_FAILED');
        }
    }

    public function menuAdminUpdateItemImage(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $imageUrl = trim((string)($request->body['imageUrl'] ?? $request->body['image_url'] ?? ''));

        if ($itemId === '') {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }

        try {
            if (!$this->menuItemExists($itemId)) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_menu_items
                 SET image_url = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([$imageUrl, $itemId]);

            $categoryNameById = $this->menuCategoryNameMap();
            $itemRow = $this->findMenuItemRowForAdmin($itemId);
            if ($itemRow === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $response->ok([
                'item' => $this->normalizeMenuAdminItem($itemRow, $categoryNameById),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_ITEM_IMAGE_FAILED');
        }
    }

    public function menuAdminUpdateItemCategory(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $categoryId = trim((string)($request->body['categoryId'] ?? $request->body['category_id'] ?? ''));

        if ($itemId === '') {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }

        if ($categoryId === '' || !$this->menuCategoryExists($categoryId)) {
            $response->error('MENU_CATEGORY_NOT_FOUND', 'MENU_CATEGORY_NOT_FOUND', 404);
            return;
        }

        try {
            if (!$this->menuItemExists($itemId)) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_menu_items
                 SET category_id = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([$categoryId, $itemId]);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_ITEM_CATEGORY_FAILED');
        }
    }

    public function menuAdminAddOptionGroup(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $label = trim((string)($request->body['label'] ?? ''));
        $type = $this->normalizeMenuOptionGroupType((string)($request->body['type'] ?? 'single'));
        $required = $request->body['required'] ?? false;

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if ($label === '') {
            $response->error('MENU_OPTION_GROUP_LABEL_REQUIRED', 'MENU_OPTION_GROUP_LABEL_REQUIRED', 422);
            return;
        }
        if ($type === null) {
            $response->error('INVALID_OPTION_GROUP_TYPE', 'INVALID_OPTION_GROUP_TYPE', 422);
            return;
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $optionGroups = $itemState['optionGroups'];
            $optionGroups[] = [
                'id' => $this->generateMenuOptionGroupId($optionGroups),
                'label' => $label,
                'type' => $type,
                'required' => $this->normalizeOptionalBoolean($required) ?? false,
                'options' => [],
            ];

            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds($optionGroups, $itemState['defaultOptionIds']);
            $this->persistMenuAdminItemCustomization($itemId, $optionGroups, $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_ADD_OPTION_GROUP_FAILED');
        }
    }

    public function menuAdminUpdateOptionGroup(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $groupId = trim((string)($request->body['groupId'] ?? $request->body['group_id'] ?? ''));
        $label = trim((string)($request->body['label'] ?? ''));
        $type = $this->normalizeMenuOptionGroupType((string)($request->body['type'] ?? 'single'));
        $required = $request->body['required'] ?? false;

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if ($groupId === '') {
            $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
            return;
        }
        if ($label === '') {
            $response->error('MENU_OPTION_GROUP_LABEL_REQUIRED', 'MENU_OPTION_GROUP_LABEL_REQUIRED', 422);
            return;
        }
        if ($type === null) {
            $response->error('INVALID_OPTION_GROUP_TYPE', 'INVALID_OPTION_GROUP_TYPE', 422);
            return;
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $groupIndex = $this->findMenuOptionGroupIndex($itemState['optionGroups'], $groupId);
            if ($groupIndex < 0) {
                $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
                return;
            }

            $itemState['optionGroups'][$groupIndex]['label'] = $label;
            $itemState['optionGroups'][$groupIndex]['type'] = $type;
            $itemState['optionGroups'][$groupIndex]['required'] = $this->normalizeOptionalBoolean($required) ?? false;

            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
                $itemState['optionGroups'],
                $itemState['defaultOptionIds']
            );
            $this->persistMenuAdminItemCustomization($itemId, $itemState['optionGroups'], $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_OPTION_GROUP_FAILED');
        }
    }

    public function menuAdminDeleteOptionGroup(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $groupId = trim((string)($request->body['groupId'] ?? $request->body['group_id'] ?? ''));

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if ($groupId === '') {
            $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
            return;
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $groupIndex = $this->findMenuOptionGroupIndex($itemState['optionGroups'], $groupId);
            if ($groupIndex < 0) {
                $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
                return;
            }

            array_splice($itemState['optionGroups'], $groupIndex, 1);
            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
                $itemState['optionGroups'],
                $itemState['defaultOptionIds']
            );
            $this->persistMenuAdminItemCustomization($itemId, $itemState['optionGroups'], $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_DELETE_OPTION_GROUP_FAILED');
        }
    }

    public function menuAdminAddOption(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $groupId = trim((string)($request->body['groupId'] ?? $request->body['group_id'] ?? ''));
        $label = trim((string)($request->body['label'] ?? ''));
        $priceDeltaRaw = $request->body['priceDelta'] ?? $request->body['price_delta'] ?? 0;

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if ($groupId === '') {
            $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
            return;
        }
        if ($label === '') {
            $response->error('MENU_OPTION_LABEL_REQUIRED', 'MENU_OPTION_LABEL_REQUIRED', 422);
            return;
        }
        if (!is_numeric($priceDeltaRaw) || (float)$priceDeltaRaw < 0) {
            $response->error('INVALID_OPTION_PRICE_DELTA', 'INVALID_OPTION_PRICE_DELTA', 422);
            return;
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $groupIndex = $this->findMenuOptionGroupIndex($itemState['optionGroups'], $groupId);
            if ($groupIndex < 0) {
                $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
                return;
            }

            $itemState['optionGroups'][$groupIndex]['options'][] = [
                'id' => $this->generateMenuOptionId($itemState['optionGroups']),
                'label' => $label,
                'price_delta' => (int)round((float)$priceDeltaRaw),
            ];

            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
                $itemState['optionGroups'],
                $itemState['defaultOptionIds']
            );
            $this->persistMenuAdminItemCustomization($itemId, $itemState['optionGroups'], $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_ADD_OPTION_FAILED');
        }
    }

    public function menuAdminUpdateOption(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $groupId = trim((string)($request->body['groupId'] ?? $request->body['group_id'] ?? ''));
        $optionId = trim((string)($request->body['optionId'] ?? $request->body['option_id'] ?? ''));
        $label = trim((string)($request->body['label'] ?? ''));
        $priceDeltaRaw = $request->body['priceDelta'] ?? $request->body['price_delta'] ?? 0;

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if ($groupId === '') {
            $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
            return;
        }
        if ($optionId === '') {
            $response->error('MENU_OPTION_NOT_FOUND', 'MENU_OPTION_NOT_FOUND', 404);
            return;
        }
        if ($label === '') {
            $response->error('MENU_OPTION_LABEL_REQUIRED', 'MENU_OPTION_LABEL_REQUIRED', 422);
            return;
        }
        if (!is_numeric($priceDeltaRaw) || (float)$priceDeltaRaw < 0) {
            $response->error('INVALID_OPTION_PRICE_DELTA', 'INVALID_OPTION_PRICE_DELTA', 422);
            return;
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $groupIndex = $this->findMenuOptionGroupIndex($itemState['optionGroups'], $groupId);
            if ($groupIndex < 0) {
                $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
                return;
            }

            $optionIndex = $this->findMenuOptionIndex($itemState['optionGroups'][$groupIndex], $optionId);
            if ($optionIndex < 0) {
                $response->error('MENU_OPTION_NOT_FOUND', 'MENU_OPTION_NOT_FOUND', 404);
                return;
            }

            $itemState['optionGroups'][$groupIndex]['options'][$optionIndex]['label'] = $label;
            $itemState['optionGroups'][$groupIndex]['options'][$optionIndex]['price_delta'] = (int)round((float)$priceDeltaRaw);

            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
                $itemState['optionGroups'],
                $itemState['defaultOptionIds']
            );
            $this->persistMenuAdminItemCustomization($itemId, $itemState['optionGroups'], $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_OPTION_FAILED');
        }
    }

    public function menuAdminDeleteOption(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $groupId = trim((string)($request->body['groupId'] ?? $request->body['group_id'] ?? ''));
        $optionId = trim((string)($request->body['optionId'] ?? $request->body['option_id'] ?? ''));

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if ($groupId === '') {
            $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
            return;
        }
        if ($optionId === '') {
            $response->error('MENU_OPTION_NOT_FOUND', 'MENU_OPTION_NOT_FOUND', 404);
            return;
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $groupIndex = $this->findMenuOptionGroupIndex($itemState['optionGroups'], $groupId);
            if ($groupIndex < 0) {
                $response->error('MENU_OPTION_GROUP_NOT_FOUND', 'MENU_OPTION_GROUP_NOT_FOUND', 404);
                return;
            }

            $optionIndex = $this->findMenuOptionIndex($itemState['optionGroups'][$groupIndex], $optionId);
            if ($optionIndex < 0) {
                $response->error('MENU_OPTION_NOT_FOUND', 'MENU_OPTION_NOT_FOUND', 404);
                return;
            }

            array_splice($itemState['optionGroups'][$groupIndex]['options'], $optionIndex, 1);
            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
                $itemState['optionGroups'],
                $itemState['defaultOptionIds']
            );
            $this->persistMenuAdminItemCustomization($itemId, $itemState['optionGroups'], $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_DELETE_OPTION_FAILED');
        }
    }

    public function menuAdminUpdateDefaultOptions(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $itemId = trim((string)($request->body['itemId'] ?? $request->body['item_id'] ?? ''));
        $selectedOptionIds = $request->body['selectedOptionIds'] ?? $request->body['selected_option_ids'] ?? [];

        if ($itemId === '' || !$this->menuItemExists($itemId)) {
            $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
            return;
        }
        if (!is_array($selectedOptionIds)) {
            $selectedOptionIds = [];
        }

        try {
            $itemState = $this->loadMenuAdminItemCustomizationState($itemId);
            if ($itemState === null) {
                $response->error('MENU_ITEM_NOT_FOUND', 'MENU_ITEM_NOT_FOUND', 404);
                return;
            }

            $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
                $itemState['optionGroups'],
                array_values(array_map(static fn ($id): string => trim((string)$id), $selectedOptionIds))
            );
            $this->persistMenuAdminItemCustomization($itemId, $itemState['optionGroups'], $defaultOptionIds);

            $response->ok([
                'item' => $this->loadMenuAdminItemPayload($itemId),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_UPDATE_DEFAULT_OPTIONS_FAILED');
        }
    }

    public function auditCloseSummary(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['manager']);
        if ($context === null) {
            return;
        }

        try {
            $businessDate = $this->resolveBusinessDate($request);
            $response->ok($this->buildAuditSummaryPayloadV2($businessDate));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'AUDIT_SUMMARY_LOAD_FAILED');
        }
    }

    public function auditCloseHistory(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['manager']);
        if ($context === null) {
            return;
        }

        try {
            $businessDate = $this->resolveBusinessDate($request);
            $stmt = db()->prepare(
                'SELECT id, business_date, action, actor_name, actor_role, created_at, reason, reason_type, affected_scopes_json, before_status, after_status
                 FROM dinecore_business_closing_history
                 WHERE business_date = ?
                 ORDER BY created_at DESC, id DESC'
            );
            $stmt->execute([$businessDate]);
            $rows = $stmt->fetchAll() ?: [];

            $response->ok([
                'history' => array_map(fn (array $row) => [
                    'id' => (int)$row['id'],
                    'businessDate' => (string)$row['business_date'],
                    'action' => (string)$row['action'],
                    'actorName' => (string)$row['actor_name'],
                    'actorRole' => (string)$row['actor_role'],
                    'createdAt' => (string)$row['created_at'],
                    'reason' => (string)($row['reason'] ?? ''),
                    'reasonType' => (string)($row['reason_type'] ?? 'general'),
                    'affectedScopes' => $this->decodeJsonArray($row['affected_scopes_json'] ?? '[]'),
                    'beforeStatus' => (string)($row['before_status'] ?? ''),
                    'afterStatus' => (string)($row['after_status'] ?? ''),
                ], $rows),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'AUDIT_HISTORY_LOAD_FAILED');
        }
    }

    public function closeBusinessDate(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['manager']);
        if ($context === null) {
            return;
        }

        $businessDate = $this->resolveBusinessDate($request);
        $reason = trim((string)($request->body['reason'] ?? ''));
        $reasonType = trim((string)($request->body['reason_type'] ?? $request->body['reasonType'] ?? 'daily_close'));

        try {
            $summary = $this->buildAuditSummaryPayloadV2($businessDate);
            if (($summary['lockState']['isLocked'] ?? false) === true) {
                $response->error('BUSINESS_DATE_ALREADY_CLOSED', 'BUSINESS_DATE_ALREADY_CLOSED', 409);
                return;
            }

            if (($summary['blockingIssues'] ?? []) !== []) {
                $response->error('AUDIT_CLOSE_BLOCKED', 'AUDIT_CLOSE_BLOCKED', 409);
                return;
            }

            $scopes = ['orders', 'payments'];
            $stmt = db()->prepare(
                'INSERT INTO dinecore_business_closings
                    (business_date, status, closed_at, closed_by_user_id, close_reason_type, close_reason, locked_scopes_json, created_at, updated_at)
                 VALUES (?, ?, NOW(), ?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    closed_at = VALUES(closed_at),
                    closed_by_user_id = VALUES(closed_by_user_id),
                    close_reason_type = VALUES(close_reason_type),
                    close_reason = VALUES(close_reason),
                    locked_scopes_json = VALUES(locked_scopes_json),
                    updated_at = NOW()'
            );
            $stmt->execute([
                $businessDate,
                'closed',
                (int)$context['user_id'],
                $reasonType,
                $reason,
                json_encode($scopes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);

            $this->appendClosingHistory([
                'business_date' => $businessDate,
                'action' => 'close',
                'actor_user_id' => (int)$context['user_id'],
                'actor_name' => (string)$context['display_name'],
                'actor_role' => (string)$context['role'],
                'reason' => $reason,
                'reason_type' => $reasonType,
                'affected_scopes' => $scopes,
                'before_status' => 'open',
                'after_status' => 'closed',
            ]);

            $response->ok([
                'businessDate' => $businessDate,
                'closeStatus' => 'closed',
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'AUDIT_CLOSE_FAILED');
        }
    }

    public function unlockBusinessDate(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['manager']);
        if ($context === null) {
            return;
        }

        $businessDate = $this->resolveBusinessDate($request);
        $reason = trim((string)($request->body['reason'] ?? ''));
        $reasonType = trim((string)($request->body['reason_type'] ?? $request->body['reasonType'] ?? 'correction'));

        if ($reason === '') {
            $response->validation('UNLOCK_REASON_REQUIRED');
            return;
        }

        try {
            $closing = $this->findClosingByDate($businessDate);
            if ($closing === null || (string)$closing['status'] !== 'closed') {
                $response->error('BUSINESS_DATE_NOT_CLOSED', 'BUSINESS_DATE_NOT_CLOSED', 409);
                return;
            }

            $stmt = db()->prepare(
                'UPDATE dinecore_business_closings
                 SET status = ?, unlocked_at = NOW(), unlocked_by_user_id = ?, unlock_reason_type = ?, unlock_reason = ?, locked_scopes_json = ?, updated_at = NOW()
                 WHERE business_date = ?'
            );
            $stmt->execute([
                'reopened',
                (int)$context['user_id'],
                $reasonType,
                $reason,
                json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $businessDate,
            ]);

            $this->appendClosingHistory([
                'business_date' => $businessDate,
                'action' => 'unlock',
                'actor_user_id' => (int)$context['user_id'],
                'actor_name' => (string)$context['display_name'],
                'actor_role' => (string)$context['role'],
                'reason' => $reason,
                'reason_type' => $reasonType,
                'affected_scopes' => ['orders', 'payments'],
                'before_status' => 'closed',
                'after_status' => 'reopened',
            ]);

            $response->ok([
                'businessDate' => $businessDate,
                'closeStatus' => 'reopened',
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'AUDIT_UNLOCK_FAILED');
        }
    }

    public function clearGuestSessions(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $tableCode = strtoupper(trim((string)($request->body['tableCode'] ?? $request->body['table_code'] ?? $request->query['table_code'] ?? '')));
        if ($tableCode === '') {
            $response->validation('TABLE_CODE_REQUIRED');
            return;
        }

        try {
            $countStmt = db()->prepare(
                'SELECT COUNT(*) AS total
                 FROM dinecore_guest_sessions
                 WHERE UPPER(TRIM(table_code)) = ?'
            );
            $countStmt->execute([$tableCode]);
            $matched = (int)($countStmt->fetch()['total'] ?? 0);
            if ($matched <= 0) {
                $response->notFound('TABLE_SESSION_NOT_FOUND');
                return;
            }

            $expireGuestSessions = db()->prepare(
                'UPDATE dinecore_guest_sessions
                 SET status = ?, last_seen_at = NOW()
                 WHERE UPPER(TRIM(table_code)) = ?'
            );
            $expireGuestSessions->execute(['expired', $tableCode]);

            $closeTableSession = db()->prepare(
                'UPDATE dinecore_table_sessions
                 SET status = ?, closed_at = NOW(), guest_state_json = ?, updated_at = NOW()
                 WHERE UPPER(TRIM(table_code)) = ?'
            );
            $closeTableSession->execute(['closed', '[]', $tableCode]);

            $response->ok([
                'matched' => $matched,
                'updated' => (int)$expireGuestSessions->rowCount(),
                'cleared' => (int)$expireGuestSessions->rowCount(),
                'scope' => 'table',
                'tableCode' => $tableCode,
                'actor' => (string)$context['username'],
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'CLEAR_GUEST_SESSIONS_FAILED');
        }
    }

    private function closeTableSessionsForOrder(int $orderId): void
    {
        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return;
        }

        $expireGuests = db()->prepare(
            'UPDATE dinecore_guest_sessions
             SET status = ?, last_seen_at = NOW()
             WHERE order_id = ?'
        );
        $expireGuests->execute(['expired', $orderId]);

        $stmt = db()->prepare(
            'UPDATE dinecore_table_sessions
             SET status = ?, closed_at = NOW(), guest_state_json = ?, updated_at = NOW()
             WHERE table_code = ?'
        );
        $stmt->execute([
            'closed',
            '[]',
            (string)$order['table_code'],
        ]);
    }

    private function ensureActiveTableSessionForOrder(int $orderId, string $tableCode): void
    {
        $existing = db()->prepare(
            'SELECT id
             FROM dinecore_table_sessions
             WHERE table_code = ?
             LIMIT 1'
        );
        $existing->execute([$tableCode]);
        $row = $existing->fetch();

        if ($row) {
            $update = db()->prepare(
                'UPDATE dinecore_table_sessions
                 SET order_id = ?,
                     status = ?,
                     started_at = COALESCE(started_at, NOW()),
                     closed_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?'
            );
            $update->execute([$orderId, 'active', (int)$row['id']]);
            return;
        }

        $insert = db()->prepare(
            'INSERT INTO dinecore_table_sessions
                (table_code, order_id, status, started_at, closed_at, guest_state_json, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NULL, ?, NOW(), NOW())'
        );
        $insert->execute([$tableCode, $orderId, 'active', '[]']);
    }

    private function requireStaffContext(Request $request, Response $response, array $allowedRoles): ?array
    {
        $token = $this->resolveTokenFromRequest($request);
        if ($token === '') {
            $response->error('STAFF_SESSION_REQUIRED', 'STAFF_SESSION_REQUIRED', 401);
            return null;
        }

        $stmt = db()->prepare(
            'SELECT u.id AS user_id, u.username, p.role, p.display_name
             FROM user_tokens t
             JOIN users u ON u.id = t.user_id
             JOIN dinecore_staff_profiles p ON p.user_id = u.id AND p.status = 1
             WHERE t.token = ? AND t.revoked_at IS NULL AND u.status = 1 AND u.tenant_id IN (?, ?)
             LIMIT 1'
        );
        $stmt->execute([$token, 'dineCore', 'dine_core']);
        $row = $stmt->fetch();
        if (!$row) {
            $response->error('STAFF_SESSION_REQUIRED', 'STAFF_SESSION_REQUIRED', 401);
            return null;
        }

        if (!in_array((string)$row['role'], $allowedRoles, true)) {
            $response->error('STAFF_ROLE_FORBIDDEN', 'STAFF_ROLE_FORBIDDEN', 403);
            return null;
        }

        return $row;
    }

    private function resolveTokenFromRequest(Request $request): string
    {
        $authHeader = (string)($request->headers['Authorization'] ?? $request->headers['authorization'] ?? '');
        if (stripos($authHeader, 'bearer ') === 0) {
            return trim(substr($authHeader, 7));
        }

        return trim((string)($request->query['token'] ?? ''));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function loadStaffTables(?string $mapId = null): array
    {
        if ($mapId !== null && trim($mapId) !== '') {
            $stmt = db()->prepare(
                'SELECT id, code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order, map_id, map_table_id, max_active_orders, note
                 FROM dinecore_tables
                 WHERE map_id = ?
                 ORDER BY sort_order ASC, id ASC'
            );
            $stmt->execute([trim($mapId)]);
        } else {
            $stmt = db()->query(
                'SELECT id, code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order, map_id, map_table_id, max_active_orders, note
                 FROM dinecore_tables
                 ORDER BY sort_order ASC, id ASC'
            );
        }

        return array_map(fn (array $table): array => $this->normalizeStaffTable($table), $stmt->fetchAll() ?: []);
    }

    /**
     * @param array<string, mixed> $table
     * @return array<string, mixed>
     */
        /**
     * @return array<int, array<string, mixed>>
     */
    private function loadCounterMapTableStatuses(?string $mapId = null): array
    {
        return array_map(
            static fn (array $table): array => [
                'id' => (int)($table['id'] ?? 0),
                'code' => (string)($table['code'] ?? ''),
                'mapId' => (string)($table['mapId'] ?? ''),
                'mapTableId' => (string)($table['mapTableId'] ?? ''),
                'maxActiveOrders' => (int)($table['maxActiveOrders'] ?? 1),
                'currentOpenOrderCount' => (int)($table['currentOpenOrderCount'] ?? 0),
                'operationalStatus' => (string)($table['operationalStatus'] ?? 'normal'),
                'operationalStatusLabel' => (string)($table['operationalStatusLabel'] ?? ''),
                'hasActiveOrder' => (bool)($table['hasActiveOrder'] ?? false),
                'activeOrderNo' => (string)($table['activeOrderNo'] ?? ''),
                'note' => (string)($table['note'] ?? ''),
            ],
            $this->loadStaffTables($mapId)
        );
    }

    private function normalizeStaffTable(array $table): array
    {
        $code = (string)$table['code'];
        $maxActiveOrders = max(1, (int)($table['max_active_orders'] ?? 1));
        $orderingEnabled = (int)$table['is_ordering_enabled'] === 1;
        $orderSnapshot = $this->loadTableOperationalSnapshot($code);
        $currentOpenOrderCount = (int)($orderSnapshot['currentOpenOrderCount'] ?? 0);
        $operationalStatus = !$orderingEnabled
            ? 'paused'
            : ($currentOpenOrderCount >= $maxActiveOrders ? 'max_active_orders_reached' : 'normal');
        $operationalStatusLabel = match ($operationalStatus) {
            'paused' => '??????',
            'max_active_orders_reached' => '???????????',
            default => '????',
        };

        return [
            'id' => (int)$table['id'],
            'code' => $code,
            'name' => (string)($table['name'] ?? ''),
            'label' => (string)($table['name'] ?? ''),
            'areaName' => (string)($table['area_name'] ?? ''),
            'note' => (string)($table['note'] ?? ''),
            'dineMode' => (string)$table['dine_mode'],
            'status' => (string)$table['status'],
            'orderingEnabled' => $orderingEnabled,
            'sortOrder' => (int)($table['sort_order'] ?? 0),
            'mapId' => (string)($table['map_id'] ?? ''),
            'mapTableId' => (string)($table['map_table_id'] ?? ''),
            'maxActiveOrders' => $maxActiveOrders,
            'currentOpenOrderCount' => $currentOpenOrderCount,
            'operationalStatus' => $operationalStatus,
            'operationalStatusLabel' => $operationalStatusLabel,
            'hasActiveOrder' => $currentOpenOrderCount > 0,
            'activeOrderNo' => (string)($orderSnapshot['activeOrderNo'] ?? ''),
            'qrImageUrl' => $this->resolveTableQrImageUrl($code),
        ];
    }

    private function resolveNextTableSortOrder(): int
    {
        $stmt = db()->query('SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM dinecore_tables');
        return ((int)($stmt->fetch()['max_sort'] ?? 0)) + 1;
    }

    private function saveMapEditorFile(Request $request, Response $response, string $status): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $map = $request->body['map'] ?? null;
        if (!is_array($map)) {
            $response->validation('MAP_PAYLOAD_REQUIRED');
            return;
        }

        $mapId = trim((string)($map['id'] ?? $request->body['mapId'] ?? $request->body['map_id'] ?? ''));
        $name = trim((string)($map['name'] ?? $request->body['name'] ?? ''));
        if ($mapId === '') {
            $response->validation('MAP_ID_REQUIRED');
            return;
        }
        if ($name === '') {
            $response->validation('MAP_NAME_REQUIRED');
            return;
        }

        $safeStatus = in_array($status, ['draft', 'final'], true) ? $status : 'draft';
        $savedAt = date('c');
        $normalizedMap = $this->normalizeMapEditorMapPayload($map, $safeStatus === 'final');
        $draftState = $safeStatus === 'draft'
            ? $this->normalizeMapEditorDraftState($request->body['draftState'] ?? [])
            : [];
        $record = [
            'id' => $mapId,
            'mapId' => $mapId,
            'name' => $name,
            'status' => $safeStatus,
            'version' => 1,
            'payloadVersion' => 1,
            'updatedAt' => $savedAt,
            'savedAt' => $savedAt,
            'editorUpdatedAt' => (string)($map['updatedAt'] ?? ''),
            'savedBy' => [
                'userId' => (int)($context['user_id'] ?? 0),
                'username' => (string)($context['username'] ?? ''),
                'displayName' => (string)($context['display_name'] ?? ''),
                'role' => (string)($context['role'] ?? ''),
            ],
            'map' => $normalizedMap,
            'payload' => $normalizedMap,
            'draftState' => $draftState,
        ];

        try {
            $dir = $this->resolveMapEditorStorageDir($safeStatus);
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                $response->internal('MAP_FILE_DIR_CREATE_FAILED');
                return;
            }
            if (!is_writable($dir)) {
                $response->internal('MAP_FILE_DIR_NOT_WRITABLE');
                return;
            }

            $path = $this->buildMapEditorFilePath($mapId, $safeStatus);
            $json = json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if (!is_string($json) || $json === '') {
                $response->internal('MAP_FILE_ENCODE_FAILED');
                return;
            }

            $written = @file_put_contents($path, $json, LOCK_EX);
            if ($written === false || $written <= 0) {
                $response->internal('MAP_FILE_SAVE_FAILED');
                return;
            }

            $response->ok([
                'id' => $record['id'],
                'mapId' => $record['mapId'],
                'name' => $record['name'],
                'status' => $record['status'],
                'savedAt' => $record['savedAt'],
                'updatedAt' => $record['updatedAt'],
                'fileName' => basename($path),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MAP_FILE_SAVE_FAILED');
        }
    }

    private function resolveMapEditorStorageDir(string $status = 'draft'): string
    {
        $safeStatus = in_array($status, ['draft', 'final'], true) ? $status : 'draft';
        return BASE_PATH . '/api/dinecore/map-editor-files/' . $safeStatus;
    }

    private function buildMapEditorFilePath(string $mapId, string $status = 'draft'): string
    {
        return $this->resolveMapEditorStorageDir($status) . '/' . $this->sanitizeMapEditorFileName($mapId) . '.json';
    }

    private function listMapEditorSummaries(): array
    {
        $drafts = $this->readMapEditorSummaryDir('draft');
        $finals = $this->readMapEditorSummaryDir('final');
        $maps = [];

        foreach ($drafts as $summary) {
            $mapId = (string)($summary['mapId'] ?? '');
            if ($mapId === '') {
                continue;
            }

            $maps[$mapId] = [
                'id' => $mapId,
                'mapId' => $mapId,
                'name' => (string)($summary['name'] ?? ''),
                'width' => (int)($summary['width'] ?? 0),
                'height' => (int)($summary['height'] ?? 0),
                'createdAt' => (string)($summary['createdAt'] ?? ''),
                'updatedAt' => (string)($summary['updatedAt'] ?? ''),
                'savedAt' => '',
                'draftSavedAt' => (string)($summary['savedAt'] ?? ''),
                'availableStatuses' => ['draft'],
            ];
        }

        foreach ($finals as $summary) {
            $mapId = (string)($summary['mapId'] ?? '');
            if ($mapId === '') {
                continue;
            }

            if (!isset($maps[$mapId])) {
                $maps[$mapId] = [
                    'id' => $mapId,
                    'mapId' => $mapId,
                    'name' => (string)($summary['name'] ?? ''),
                    'width' => (int)($summary['width'] ?? 0),
                    'height' => (int)($summary['height'] ?? 0),
                    'createdAt' => (string)($summary['createdAt'] ?? ''),
                    'updatedAt' => (string)($summary['updatedAt'] ?? ''),
                    'savedAt' => (string)($summary['savedAt'] ?? ''),
                    'draftSavedAt' => '',
                    'availableStatuses' => ['final'],
                ];
                continue;
            }

            $maps[$mapId]['savedAt'] = (string)($summary['savedAt'] ?? '');
            $maps[$mapId]['availableStatuses'] = array_values(array_unique([
                ...$maps[$mapId]['availableStatuses'],
                'final',
            ]));

            if ((string)$maps[$mapId]['name'] === '') {
                $maps[$mapId]['name'] = (string)($summary['name'] ?? '');
            }
            if ((int)$maps[$mapId]['width'] <= 0) {
                $maps[$mapId]['width'] = (int)($summary['width'] ?? 0);
            }
            if ((int)$maps[$mapId]['height'] <= 0) {
                $maps[$mapId]['height'] = (int)($summary['height'] ?? 0);
            }
            if ((string)$maps[$mapId]['createdAt'] === '') {
                $maps[$mapId]['createdAt'] = (string)($summary['createdAt'] ?? '');
            }
            if ((string)$maps[$mapId]['updatedAt'] === '') {
                $maps[$mapId]['updatedAt'] = (string)($summary['updatedAt'] ?? '');
            }
        }

        uasort($maps, function (array $left, array $right): int {
            $leftTime = strtotime((string)($left['updatedAt'] ?? $left['draftSavedAt'] ?? $left['savedAt'] ?? '')) ?: 0;
            $rightTime = strtotime((string)($right['updatedAt'] ?? $right['draftSavedAt'] ?? $right['savedAt'] ?? '')) ?: 0;
            return $rightTime <=> $leftTime;
        });

        return array_values($maps);
    }

    private function readMapEditorSummaryDir(string $status): array
    {
        $dir = $this->resolveMapEditorStorageDir($status);
        if (!is_dir($dir)) {
            return [];
        }

        $paths = glob($dir . '/*.json') ?: [];
        $items = [];
        foreach ($paths as $path) {
            if (!is_string($path) || !is_file($path)) {
                continue;
            }

            $raw = @file_get_contents($path);
            if (!is_string($raw) || trim($raw) === '') {
                continue;
            }

            $decoded = json_decode($raw, true);
            if (!is_array($decoded)) {
                continue;
            }

            $payload = is_array($decoded['payload'] ?? null) ? $decoded['payload'] : [];
            $mapId = trim((string)($decoded['mapId'] ?? $decoded['id'] ?? $payload['id'] ?? ''));
            if ($mapId === '') {
                continue;
            }

            $items[] = [
                'mapId' => $mapId,
                'name' => (string)($decoded['name'] ?? $payload['name'] ?? ''),
                'width' => (int)($payload['width'] ?? 0),
                'height' => (int)($payload['height'] ?? 0),
                'createdAt' => (string)($payload['createdAt'] ?? ''),
                'updatedAt' => (string)($decoded['updatedAt'] ?? $payload['updatedAt'] ?? ''),
                'savedAt' => (string)($decoded['savedAt'] ?? ''),
                'status' => $status,
            ];
        }

        return $items;
    }

    private function normalizeMapEditorDraftState(mixed $draftState): array
    {
        if (!is_array($draftState)) {
            return [];
        }

        return [
            'mode' => trim((string)($draftState['mode'] ?? '')),
            'workingMode' => trim((string)($draftState['workingMode'] ?? '')),
            'tool' => trim((string)($draftState['tool'] ?? $draftState['activeTool'] ?? '')),
            'activeObjectId' => trim((string)($draftState['activeObjectId'] ?? '')),
            'activeTableId' => trim((string)($draftState['activeTableId'] ?? '')),
            'toolbarLocked' => (bool)($draftState['toolbarLocked'] ?? false),
            'pendingPolyline' => array_values(array_map(
                fn (array $point): array => [
                    'x' => (float)($point['x'] ?? 0),
                    'y' => (float)($point['y'] ?? 0),
                ],
                array_values(array_filter(
                    is_array($draftState['pendingPolyline'] ?? null) ? $draftState['pendingPolyline'] : [],
                    fn (mixed $point): bool => is_array($point)
                ))
            )),
            'pendingShape' => is_array($draftState['pendingShape'] ?? null) ? $draftState['pendingShape'] : null,
            'pendingText' => is_array($draftState['pendingText'] ?? null) ? $draftState['pendingText'] : null,
        ];
    }
    private function sanitizeMapEditorFileName(string $value): string
    {
        $sanitized = preg_replace('/[^A-Za-z0-9_-]+/', '_', $value) ?? '';
        $sanitized = trim($sanitized, '_');
        return $sanitized !== '' ? $sanitized : 'map_draft';
    }

    private function normalizeMapEditorMapPayload(array $map, bool $isFinal = false): array
    {
        $objects = array_values(array_filter(
            array_map(fn (mixed $item): ?array => is_array($item) ? $this->normalizeMapEditorObject($item) : null, $map['objects'] ?? []),
            fn (?array $item): bool => $item !== null
        ));
        $tables = array_values(array_filter(
            array_map(fn (mixed $item): ?array => is_array($item) ? $this->normalizeMapEditorTable($item) : null, $map['tables'] ?? []),
            fn (?array $item): bool => $item !== null
        ));

        $mapCode = strtoupper(trim((string)($map['mapCode'] ?? $map['map_code'] ?? '')));

        if ($isFinal) {
            $mapCode = $this->resolveMapEditorMapCode(trim((string)($map['id'] ?? '')), $mapCode);
            $tables = $this->finalizeMapEditorTables($tables, $mapCode);
        }


        return [
            'id' => trim((string)($map['id'] ?? '')),
            'name' => trim((string)($map['name'] ?? '')),
            'mapCode' => $mapCode,
            'width' => max(0, (int)($map['width'] ?? 0)),
            'height' => max(0, (int)($map['height'] ?? 0)),
            'objects' => $objects,
            'tables' => $tables,
            'createdAt' => (string)($map['createdAt'] ?? ''),
            'updatedAt' => (string)($map['updatedAt'] ?? ''),
            'savedAt' => (string)($map['savedAt'] ?? ''),
            'draftSavedAt' => (string)($map['draftSavedAt'] ?? ''),
        ];
    }

    private function normalizeMapEditorObject(array $item): array
    {
        return [
            'id' => trim((string)($item['id'] ?? '')),
            'type' => trim((string)($item['type'] ?? '')),
            'data' => is_array($item['data'] ?? null) ? $item['data'] : [],
            'createdAt' => (string)($item['createdAt'] ?? ''),
            'updatedAt' => (string)($item['updatedAt'] ?? ''),
        ];
    }

    private function normalizeMapEditorTable(array $item): array
    {
        return [
            'id' => trim((string)($item['id'] ?? '')),
            'label' => trim((string)($item['label'] ?? '')),
            'tableCode' => strtoupper(trim((string)($item['tableCode'] ?? $item['table_code'] ?? ''))),
            'maxActiveOrders' => max(1, (int)($item['maxActiveOrders'] ?? $item['max_active_orders'] ?? 1)),
            'note' => trim((string)($item['note'] ?? '')),
            'x' => (float)($item['x'] ?? 0),
            'y' => (float)($item['y'] ?? 0),
            'width' => (float)($item['width'] ?? 0),
            'height' => (float)($item['height'] ?? 0),
            'rotation' => (float)($item['rotation'] ?? 0),
            'createdAt' => (string)($item['createdAt'] ?? ''),
            'updatedAt' => (string)($item['updatedAt'] ?? ''),
        ];
    }

    private function readMapEditorFileRecord(string $mapId, string $status = 'final'): ?array
    {
        $path = $this->buildMapEditorFilePath($mapId, $status);
        if (!is_file($path)) {
            return null;
        }

        $raw = @file_get_contents($path);
        if (!is_string($raw) || trim($raw) === '') {
            throw new \RuntimeException('MAP_FILE_READ_FAILED');
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('MAP_FILE_DECODE_FAILED');
        }

        return $decoded;
    }

    private function finalizeMapEditorTables(array $tables, string $mapCode): array
    {
        $existingCodes = $this->collectReservedTableCodes();
        $usedCodes = [];
        $sequence = $this->resolveNextGeneratedTableCodeSequenceForMap($tables, $mapCode);
        $finalized = [];

        foreach ($tables as $index => $table) {
            $normalized = $this->normalizeMapEditorTable($table);
            $normalized['id'] = $normalized['id'] !== '' ? $normalized['id'] : sprintf('table_%d', $index + 1);
            $normalized['label'] = $normalized['label'] !== '' ? $normalized['label'] : str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT);
            $normalized['maxActiveOrders'] = max(1, (int)($normalized['maxActiveOrders'] ?? 1));

            $candidate = strtoupper(trim((string)($normalized['tableCode'] ?? '')));
            if ($candidate === '' || !preg_match('/^' . preg_quote($mapCode, '/') . '-\\d{3}$/', $candidate) || isset($usedCodes[$candidate])) {
                do {
                    $candidate = sprintf('%s-%03d', $mapCode, $sequence);
                    $sequence += 1;
                } while (isset($existingCodes[$candidate]) || isset($usedCodes[$candidate]));
            }

            $normalized['tableCode'] = $candidate;
            $usedCodes[$candidate] = true;
            $existingCodes[$candidate] = true;
            $finalized[] = $normalized;
        }

        return $finalized;
    }

    private function resolveMapEditorMapCode(string $mapId, string $currentMapCode = ''): string
    {
        $candidate = strtoupper(trim($currentMapCode));
        $reserved = $this->collectReservedMapCodes($mapId);

        if ($candidate !== '' && !isset($reserved[$candidate])) {
            return $candidate;
        }

        foreach ($this->generateMapCodeSequence() as $nextCode) {
            if (!isset($reserved[$nextCode])) {
                return $nextCode;
            }
        }

        throw new \RuntimeException('MAP_CODE_POOL_EXHAUSTED');
    }

    private function collectReservedMapCodes(string $currentMapId = ''): array
    {
        $reserved = [];
        foreach ($this->readMapEditorSummaryDir('final') as $summary) {
            $mapId = trim((string)($summary['mapId'] ?? ''));
            if ($mapId === '' || $mapId === $currentMapId) {
                continue;
            }

            try {
                $record = $this->readMapEditorFileRecord($mapId, 'final');
                $map = is_array($record['map'] ?? null) ? $record['map'] : [];
                $mapCode = strtoupper(trim((string)($map['mapCode'] ?? '')));
                if ($mapCode !== '') {
                    $reserved[$mapCode] = true;
                }
            } catch (Throwable) {
            }
        }

        return $reserved;
    }

    private function generateMapCodeSequence(): iterable
    {
        for ($first = ord('A'); $first <= ord('Z'); $first += 1) {
            for ($second = ord('A'); $second <= ord('Z'); $second += 1) {
                yield chr($first) . chr($second);
            }
        }
    }

    private function collectReservedTableCodes(): array
    {
        $reserved = [];

        try {
            $rows = db()->query('SELECT code FROM dinecore_tables')->fetchAll() ?: [];
            foreach ($rows as $row) {
                $code = strtoupper(trim((string)($row['code'] ?? '')));
                if ($code !== '') {
                    $reserved[$code] = true;
                }
            }
        } catch (Throwable) {
        }

        foreach ($this->readMapEditorSummaryDir('final') as $summary) {
            $existingMapId = trim((string)($summary['mapId'] ?? ''));
            if ($existingMapId === '') {
                continue;
            }

            try {
                $record = $this->readMapEditorFileRecord($existingMapId, 'final');
                $tables = is_array($record['map']['tables'] ?? null) ? $record['map']['tables'] : [];
                foreach ($tables as $table) {
                    $code = strtoupper(trim((string)($table['tableCode'] ?? '')));
                    if ($code !== '') {
                        $reserved[$code] = true;
                    }
                }
            } catch (Throwable) {
            }
        }

        return $reserved;
    }

    private function importStaffTablesFromFinalMap(string $mapId, bool $isReimport): array
    {
        $record = $this->readMapEditorFileRecord($mapId, 'final');
        if ($record === null) {
            throw new \RuntimeException('MAP_FILE_NOT_FOUND');
        }

        $map = is_array($record['map'] ?? null) ? $record['map'] : [];
        $tables = array_values(array_filter(
            array_map(fn (mixed $item): ?array => is_array($item) ? $this->normalizeMapEditorTable($item) : null, $map['tables'] ?? []),
            fn (?array $item): bool => $item !== null && (string)($item['id'] ?? '') !== ''
        ));

        $stmt = db()->prepare(
            'SELECT id, code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order, map_id, map_table_id, max_active_orders, note
             FROM dinecore_tables
             WHERE map_id = ?'
        );
        $stmt->execute([$mapId]);
        $existingRows = $stmt->fetchAll() ?: [];
        $existingByMapTableId = [];
        foreach ($existingRows as $row) {
            $existingByMapTableId[(string)($row['map_table_id'] ?? '')] = $row;
        }

        $inserted = 0;
        $updated = 0;
        $unchanged = 0;
        $seenTableIds = [];

        foreach ($tables as $table) {
            $mapTableId = (string)$table['id'];
            $label = trim((string)($table['label'] ?? ''));
            $tableCode = strtoupper(trim((string)($table['tableCode'] ?? '')));
            $maxActiveOrders = max(1, (int)($table['maxActiveOrders'] ?? 1));
            $tableNote = trim((string)($table['note'] ?? ''));
            $seenTableIds[$mapTableId] = true;

            $existing = $existingByMapTableId[$mapTableId] ?? null;
            if ($existing === null && $tableCode !== '') {
                $existing = $this->findTableByCode($tableCode);
            }

            if ($existing !== null) {
                $nextCode = $tableCode !== '' ? $tableCode : (string)$existing['code'];
                $nextMaxActiveOrders = $isReimport
                    ? max(1, (int)($existing['max_active_orders'] ?? 1))
                    : $maxActiveOrders;
                $existingName = trim((string)($existing['name'] ?? ''));
                $nextLabel = $label !== '' ? $label : $existingName;
                $nextName = trim(sprintf('%s %s', $nextCode, $nextLabel));
                $nextAreaName = (string)($existing['area_name'] ?? '');
                $nextNote = $tableNote !== '' ? $tableNote : (string)($existing['note'] ?? '');
                $nextDineMode = (string)($existing['dine_mode'] ?? 'dine_in');
                $nextStatus = (string)($existing['status'] ?? 'active');
                $nextOrderingEnabled = (int)($existing['is_ordering_enabled'] ?? 1) === 1 ? 1 : 0;

                $update = db()->prepare(
                    'UPDATE dinecore_tables
                     SET code = ?, name = ?, area_name = ?, dine_mode = ?, status = ?, is_ordering_enabled = ?, sort_order = ?, map_id = ?, map_table_id = ?, max_active_orders = ?, note = ?, updated_at = NOW()
                     WHERE id = ?'
                );
                $update->execute([
                    $nextCode,
                    $nextName,
                    $nextAreaName,
                    $nextDineMode,
                    $nextStatus,
                    $nextOrderingEnabled,
                    $this->resolveTableSortOrderForImport($existing),
                    $mapId,
                    $mapTableId,
                    $nextMaxActiveOrders,
                    $nextNote,
                    (int)$existing['id'],
                ]);
                $updated += 1;
                continue;
            }

            $insert = db()->prepare(
                'INSERT INTO dinecore_tables (code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order, map_id, map_table_id, max_active_orders, note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $insert->execute([
                $tableCode,
                trim(sprintf('%s %s', $tableCode, $label !== '' ? $label : $mapTableId)),
                '',
                'dine_in',
                'active',
                1,
                $this->resolveNextTableSortOrder(),
                $mapId,
                $mapTableId,
                $maxActiveOrders,
                $tableNote,
            ]);
            $inserted += 1;
        }

        if ($isReimport) {
            foreach ($existingRows as $row) {
                $existingMapTableId = (string)($row['map_table_id'] ?? '');
                if ($existingMapTableId === '' || isset($seenTableIds[$existingMapTableId])) {
                    continue;
                }
                $unchanged += 1;
            }
        }

        return [
            'mapId' => $mapId,
            'mapName' => (string)($map['name'] ?? $record['name'] ?? ''),
            'insertedCount' => $inserted,
            'updatedCount' => $updated,
            'unchangedCount' => $unchanged,
            'tables' => $this->loadStaffTables($mapId),
        ];
    }

    private function resolveTableSortOrderForImport(array $existing): int
    {
        $sortOrder = (int)($existing['sort_order'] ?? 0);
        return $sortOrder > 0 ? $sortOrder : $this->resolveNextTableSortOrder();
    }

    private function loadTableOperationalSnapshot(string $tableCode): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_no
             FROM dinecore_orders
             WHERE table_code = ?
               AND payment_status <> "paid"
               AND order_status <> "merged"
               AND EXISTS (
                   SELECT 1
                   FROM dinecore_order_batches b
                   WHERE b.order_id = dinecore_orders.id
                     AND b.status <> "draft"
               )
             ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([$tableCode]);
        $rows = $stmt->fetchAll() ?: [];

        return [
            'currentOpenOrderCount' => count($rows),
            'activeOrderNo' => (string)($rows[0]['order_no'] ?? ''),
        ];
    }

    private function normalizeTableSortOrders(): void
    {
        $rows = db()->query(
            'SELECT id
             FROM dinecore_tables
             ORDER BY sort_order ASC, id ASC'
        )->fetchAll() ?: [];

        $update = db()->prepare('UPDATE dinecore_tables SET sort_order = ?, updated_at = NOW() WHERE id = ?');
        foreach ($rows as $index => $row) {
            $update->execute([$index + 1, (int)$row['id']]);
        }
    }

    private function findTableByCode(string $tableCode): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, code, name, area_name, dine_mode, status, is_ordering_enabled, sort_order, map_id, map_table_id, max_active_orders, note
             FROM dinecore_tables
             WHERE UPPER(TRIM(code)) = ?
             LIMIT 1'
        );
        $stmt->execute([strtoupper(trim($tableCode))]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function resolveEntryBaseUrl(Request $request): string
    {
        $fromBody = trim((string)($request->body['entry_base_url'] ?? $request->body['entryBaseUrl'] ?? ''));
        if ($fromBody !== '') {
            $baseUrl = $this->extractBaseUrlFromUrl($fromBody);
            if ($baseUrl !== '') {
                return $baseUrl;
            }
        }

        $originHeader = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
        if ($originHeader !== '') {
            $origin = $this->extractOriginFromUrl($originHeader);
            if ($origin !== '') {
                return $origin;
            }
        }

        $referer = trim((string)($_SERVER['HTTP_REFERER'] ?? ''));
        if ($referer !== '') {
            $origin = $this->extractOriginFromUrl($referer);
            if ($origin !== '') {
                return $origin;
            }
        }

        return $this->resolveBackendBaseUrl();
    }

    private function resolveBackendBaseUrl(): string
    {
        $configured = trim((string)(getenv('APP_BASE_URL') ?: ''));
        if ($configured !== '') {
            return rtrim($configured, '/');
        }

        $forwardedProto = trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
        $https = strtolower((string)($_SERVER['HTTPS'] ?? ''));
        $scheme = $forwardedProto !== ''
            ? $forwardedProto
            : ($https !== '' && $https !== 'off' ? 'https' : 'http');

        $host = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
        if ($host !== '') {
            return $scheme . '://' . $host;
        }

        return $scheme . '://127.0.0.1:8000';
    }

    private function extractBaseUrlFromUrl(string $url): string
    {
        $parts = @parse_url(trim($url));
        if (!is_array($parts)) {
            return '';
        }

        $scheme = strtolower((string)($parts['scheme'] ?? ''));
        $host = (string)($parts['host'] ?? '');
        if (($scheme !== 'http' && $scheme !== 'https') || $host === '') {
            return '';
        }

        $port = isset($parts['port']) ? (int)$parts['port'] : 0;
        $portPart = $port > 0 ? ':' . $port : '';
        $path = trim((string)($parts['path'] ?? ''));
        $normalizedPath = $path !== '' && $path !== '/' ? '/' . trim($path, '/') : '';

        return $scheme . '://' . $host . $portPart . $normalizedPath;
    }

    private function extractOriginFromUrl(string $url): string
    {
        $parts = @parse_url(trim($url));
        if (!is_array($parts)) {
            return '';
        }

        $scheme = strtolower((string)($parts['scheme'] ?? ''));
        $host = (string)($parts['host'] ?? '');
        if (($scheme !== 'http' && $scheme !== 'https') || $host === '') {
            return '';
        }

        $port = isset($parts['port']) ? (int)$parts['port'] : 0;
        $portPart = $port > 0 ? ':' . $port : '';

        return $scheme . '://' . $host . $portPart;
    }

    private function resolveTableQrImageUrl(string $tableCode): string
    {
        $normalized = strtoupper(trim($tableCode));
        if ($normalized === '') {
            return '';
        }

        $fileName = $normalized . '.png';
        $fullPath = BASE_PATH . '/public/assets/QRC/' . $fileName;
        if (!is_file($fullPath)) {
            return '';
        }

        $timestamp = @filemtime($fullPath);
        $version = is_int($timestamp) ? '?v=' . $timestamp : '';
        return 'assets/QRC/' . rawurlencode($fileName) . $version;
    }

    private function loadMenuAdminCategories(): array
    {
        $rows = db()->query(
            'SELECT id, name, sort_order
             FROM dinecore_menu_categories
             ORDER BY sort_order ASC, id ASC'
        )->fetchAll() ?: [];

        return array_map(static fn (array $row): array => [
            'id' => (string)$row['id'],
            'name' => (string)$row['name'],
            'sortOrder' => (int)$row['sort_order'],
        ], $rows);
    }

    private function buildMenuAdminSnapshot(): array
    {
        return [
            'categories' => $this->loadMenuAdminCategories(),
            'items' => $this->loadMenuAdminItems(),
        ];
    }

    private function loadMenuAdminItems(): array
    {
        $rows = db()->query(
            'SELECT id, category_id, name, description, base_price, image_url, sold_out, hidden, default_option_ids_json, option_groups_json
             FROM dinecore_menu_items
             ORDER BY category_id ASC, id ASC'
        )->fetchAll() ?: [];

        $categoryNameById = $this->menuCategoryNameMap();
        return array_map(fn (array $row): array => $this->normalizeMenuAdminItem($row, $categoryNameById), $rows);
    }

    private function menuCategoryNameMap(): array
    {
        $rows = db()->query(
            'SELECT id, name
             FROM dinecore_menu_categories'
        )->fetchAll() ?: [];

        $map = [];
        foreach ($rows as $row) {
            $map[(string)$row['id']] = (string)$row['name'];
        }

        return $map;
    }

    private function normalizeMenuAdminItem(array $row, array $categoryNameById): array
    {
        $categoryId = (string)$row['category_id'];
        $decodedOptionGroups = $this->decodeMenuOptionGroups($row['option_groups_json'] ?? '[]');
        $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
            $decodedOptionGroups,
            $this->decodeMenuDefaultOptionIds($row['default_option_ids_json'] ?? '[]')
        );
        $optionGroups = array_map(static fn (array $group): array => [
            'id' => (string)$group['id'],
            'label' => (string)$group['label'],
            'type' => (string)$group['type'],
            'required' => (bool)$group['required'],
            'options' => array_map(static fn (array $option): array => [
                'id' => (string)$option['id'],
                'label' => (string)$option['label'],
                'priceDelta' => (int)($option['price_delta'] ?? 0),
            ], (array)($group['options'] ?? [])),
        ], $decodedOptionGroups);

        return [
            'id' => (string)$row['id'],
            'title' => (string)$row['name'],
            'categoryId' => $categoryId,
            'categoryName' => $categoryNameById[$categoryId] ?? $categoryId,
            'description' => (string)($row['description'] ?? ''),
            'price' => (int)$row['base_price'],
            'imageUrl' => (string)($row['image_url'] ?? ''),
            'defaultOptionIds' => $defaultOptionIds,
            'optionGroups' => $optionGroups,
            'soldOut' => (int)$row['sold_out'] === 1,
            'hidden' => (int)$row['hidden'] === 1,
        ];
    }

    private function loadMenuAdminItemPayload(string $itemId): array
    {
        $categoryNameById = $this->menuCategoryNameMap();
        $itemRow = $this->findMenuItemRowForAdmin($itemId);
        if ($itemRow === null) {
            throw new \RuntimeException('MENU_ITEM_NOT_FOUND');
        }

        return $this->normalizeMenuAdminItem($itemRow, $categoryNameById);
    }

    private function menuCategoryExists(string $categoryId): bool
    {
        $stmt = db()->prepare(
            'SELECT id
             FROM dinecore_menu_categories
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$categoryId]);
        return (bool)$stmt->fetch();
    }

    private function menuCategoryNameExists(string $name, string $excludeCategoryId = ''): bool
    {
        $sql = 'SELECT id
                FROM dinecore_menu_categories
                WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))';
        $params = [$name];

        if ($excludeCategoryId !== '') {
            $sql .= ' AND id <> ?';
            $params[] = $excludeCategoryId;
        }

        $sql .= ' LIMIT 1';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        return (bool)$stmt->fetch();
    }

    private function menuCategoryHasItems(string $categoryId): bool
    {
        $stmt = db()->prepare(
            'SELECT id
             FROM dinecore_menu_items
             WHERE category_id = ?
             LIMIT 1'
        );
        $stmt->execute([$categoryId]);
        return (bool)$stmt->fetch();
    }

    private function menuItemExists(string $itemId): bool
    {
        $stmt = db()->prepare(
            'SELECT id
             FROM dinecore_menu_items
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$itemId]);
        return (bool)$stmt->fetch();
    }

    private function normalizeOptionalBoolean(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if ($normalized === 'true' || $normalized === '1') {
                return true;
            }
            if ($normalized === 'false' || $normalized === '0') {
                return false;
            }
        }

        if (is_int($value)) {
            return $value === 1 ? true : ($value === 0 ? false : null);
        }

        return null;
    }

    private function findMenuItemRowForAdmin(string $itemId): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, category_id, name, description, base_price, image_url, sold_out, hidden, default_option_ids_json, option_groups_json
             FROM dinecore_menu_items
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$itemId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function loadMenuAdminItemCustomizationState(string $itemId): ?array
    {
        $row = $this->findMenuItemRowForAdmin($itemId);
        if ($row === null) {
            return null;
        }

        $optionGroups = $this->decodeMenuOptionGroups($row['option_groups_json'] ?? '[]');
        $defaultOptionIds = $this->normalizeMenuAdminDefaultOptionIds(
            $optionGroups,
            $this->decodeMenuDefaultOptionIds($row['default_option_ids_json'] ?? '[]')
        );

        return [
            'row' => $row,
            'optionGroups' => $optionGroups,
            'defaultOptionIds' => $defaultOptionIds,
        ];
    }

    private function decodeMenuOptionGroups(mixed $raw): array
    {
        $decoded = $this->decodeJsonArray($raw);
        $groups = [];
        $usedGroupIds = [];
        $usedOptionIds = [];

        foreach ($decoded as $group) {
            if (!is_array($group)) {
                continue;
            }

            $groupId = trim((string)($group['id'] ?? ''));
            if ($groupId === '' || isset($usedGroupIds[$groupId])) {
                continue;
            }

            $type = $this->normalizeMenuOptionGroupType((string)($group['type'] ?? 'single')) ?? 'single';
            $options = [];
            foreach ((array)($group['options'] ?? []) as $option) {
                if (!is_array($option)) {
                    continue;
                }

                $optionId = trim((string)($option['id'] ?? ''));
                if ($optionId === '' || isset($usedOptionIds[$optionId])) {
                    continue;
                }

                $priceDeltaRaw = $option['price_delta'] ?? $option['priceDelta'] ?? 0;
                $options[] = [
                    'id' => $optionId,
                    'label' => trim((string)($option['label'] ?? '')),
                    'price_delta' => is_numeric($priceDeltaRaw) ? max(0, (int)round((float)$priceDeltaRaw)) : 0,
                ];
                $usedOptionIds[$optionId] = true;
            }

            $groups[] = [
                'id' => $groupId,
                'label' => trim((string)($group['label'] ?? '')),
                'type' => $type,
                'required' => (bool)($group['required'] ?? false),
                'options' => $options,
            ];
            $usedGroupIds[$groupId] = true;
        }

        return $groups;
    }

    private function decodeMenuDefaultOptionIds(mixed $raw): array
    {
        return array_values(array_filter(
            array_map(static fn ($id): string => trim((string)$id), $this->decodeJsonArray($raw)),
            static fn (string $id): bool => $id !== ''
        ));
    }

    private function normalizeMenuOptionGroupType(string $type): ?string
    {
        $normalized = strtolower(trim($type));
        return in_array($normalized, ['single', 'multi'], true) ? $normalized : null;
    }

    private function normalizeMenuAdminDefaultOptionIds(array $optionGroups, array $selectedOptionIds): array
    {
        $optionLookup = [];
        $selectedByGroup = [];

        foreach ($optionGroups as $group) {
            $groupId = (string)($group['id'] ?? '');
            if ($groupId === '') {
                continue;
            }

            $selectedByGroup[$groupId] = [];
            foreach ((array)($group['options'] ?? []) as $option) {
                $optionId = (string)($option['id'] ?? '');
                if ($optionId === '') {
                    continue;
                }

                $optionLookup[$optionId] = [
                    'groupId' => $groupId,
                    'groupType' => (string)($group['type'] ?? 'single'),
                ];
            }
        }

        foreach ($selectedOptionIds as $optionId) {
            $safeOptionId = trim((string)$optionId);
            if ($safeOptionId === '' || !isset($optionLookup[$safeOptionId])) {
                continue;
            }

            $groupId = $optionLookup[$safeOptionId]['groupId'];
            if (in_array($safeOptionId, $selectedByGroup[$groupId], true)) {
                continue;
            }

            if ($optionLookup[$safeOptionId]['groupType'] === 'single') {
                if ($selectedByGroup[$groupId] === []) {
                    $selectedByGroup[$groupId] = [$safeOptionId];
                }
                continue;
            }

            $selectedByGroup[$groupId][] = $safeOptionId;
        }

        $normalized = [];
        foreach ($optionGroups as $group) {
            $groupId = (string)($group['id'] ?? '');
            if ($groupId === '') {
                continue;
            }

            foreach ($selectedByGroup[$groupId] ?? [] as $optionId) {
                $normalized[] = $optionId;
            }
        }

        return $normalized;
    }

    private function persistMenuAdminItemCustomization(string $itemId, array $optionGroups, array $defaultOptionIds): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_menu_items
             SET option_groups_json = ?, default_option_ids_json = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([
            json_encode($optionGroups, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            json_encode(array_values($defaultOptionIds), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $itemId,
        ]);
    }

    private function findMenuOptionGroupIndex(array $optionGroups, string $groupId): int
    {
        foreach ($optionGroups as $index => $group) {
            if ((string)($group['id'] ?? '') === $groupId) {
                return $index;
            }
        }

        return -1;
    }

    private function findMenuOptionIndex(array $group, string $optionId): int
    {
        foreach ((array)($group['options'] ?? []) as $index => $option) {
            if ((string)($option['id'] ?? '') === $optionId) {
                return $index;
            }
        }

        return -1;
    }

    private function generateMenuOptionGroupId(array $optionGroups): string
    {
        $existingIds = array_map(static fn (array $group): string => (string)($group['id'] ?? ''), $optionGroups);

        do {
            $candidate = 'custom-group-' . bin2hex(random_bytes(4));
        } while (in_array($candidate, $existingIds, true));

        return $candidate;
    }

    private function generateMenuOptionId(array $optionGroups): string
    {
        $existingIds = [];
        foreach ($optionGroups as $group) {
            foreach ((array)($group['options'] ?? []) as $option) {
                $existingIds[] = (string)($option['id'] ?? '');
            }
        }

        do {
            $candidate = 'custom-option-' . bin2hex(random_bytes(4));
        } while (in_array($candidate, $existingIds, true));

        return $candidate;
    }

    private function generateMenuItemId(): string
    {
        do {
            $candidate = 'custom-item-' . bin2hex(random_bytes(4));
            $stmt = db()->prepare('SELECT id FROM dinecore_menu_items WHERE id = ? LIMIT 1');
            $stmt->execute([$candidate]);
            $exists = (bool)$stmt->fetch();
        } while ($exists);

        return $candidate;
    }

    private function generateMenuCategoryId(): string
    {
        do {
            $candidate = 'custom-category-' . bin2hex(random_bytes(4));
            $stmt = db()->prepare('SELECT id FROM dinecore_menu_categories WHERE id = ? LIMIT 1');
            $stmt->execute([$candidate]);
            $exists = (bool)$stmt->fetch();
        } while ($exists);

        return $candidate;
    }

    private function resolveNextMenuCategorySortOrder(): int
    {
        $stmt = db()->query(
            'SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order
             FROM dinecore_menu_categories'
        );
        return (int)($stmt->fetch()['max_sort_order'] ?? 0) + 10;
    }

    private function normalizeMenuCategorySortOrders(): void
    {
        $rows = db()->query(
            'SELECT id
             FROM dinecore_menu_categories
             ORDER BY sort_order ASC, id ASC'
        )->fetchAll() ?: [];

        $update = db()->prepare(
            'UPDATE dinecore_menu_categories
             SET sort_order = ?, updated_at = NOW()
             WHERE id = ?'
        );

        foreach ($rows as $index => $row) {
            $update->execute([($index + 1) * 10, (string)$row['id']]);
        }
    }

    private function normalizeReportFilters(Request $request): array
    {
        return [
            'date_from' => trim((string)($request->query['date_from'] ?? '')),
            'date_to' => trim((string)($request->query['date_to'] ?? '')),
            'status' => trim((string)($request->query['status'] ?? 'all')),
            'payment_status' => trim((string)($request->query['payment_status'] ?? 'all')),
            'payment_method' => trim((string)($request->query['payment_method'] ?? 'all')),
            'keyword' => trim((string)($request->query['keyword'] ?? '')),
        ];
    }

    private function loadReportOrders(array $filters): array
    {
        $sql = 'SELECT id, order_no, table_code, created_at, order_status, payment_status, payment_method, total_amount
                FROM dinecore_orders
                WHERE EXISTS (
                    SELECT 1
                    FROM dinecore_order_batches b
                    WHERE b.order_id = dinecore_orders.id
                      AND b.status <> "draft"
                )
                  AND order_status <> "merged"';
        $params = [];

        if ($filters['date_from'] !== '') {
            $sql .= ' AND DATE(created_at) >= ?';
            $params[] = $filters['date_from'];
        }
        if ($filters['date_to'] !== '') {
            $sql .= ' AND DATE(created_at) <= ?';
            $params[] = $filters['date_to'];
        }
        if ($filters['payment_status'] !== '' && $filters['payment_status'] !== 'all') {
            $sql .= ' AND payment_status = ?';
            $params[] = $filters['payment_status'];
        }
        if ($filters['payment_method'] !== '' && $filters['payment_method'] !== 'all') {
            $sql .= ' AND payment_method = ?';
            $params[] = $filters['payment_method'];
        }
        if ($filters['keyword'] !== '') {
            $sql .= ' AND (order_no LIKE ? OR table_code LIKE ?)';
            $keyword = '%' . $filters['keyword'] . '%';
            $params[] = $keyword;
            $params[] = $keyword;
        }

        $sql .= ' ORDER BY created_at DESC, id DESC';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        return array_values(array_filter(
            array_map(fn (array $order): array => $this->normalizeOrderRowWithDerivedStatus($order), $stmt->fetchAll() ?: []),
            fn (array $order): bool => $filters['status'] === '' || $filters['status'] === 'all'
                ? true
                : (string)$order['order_status'] === $filters['status']
        ));
    }

    private function buildReportsSummaryPayload(array $orders, array $filters): array
    {
        $grossSales = array_reduce($orders, fn ($sum, array $order) => $sum + (int)$order['total_amount'], 0);
        $paidAmount = array_reduce($orders, fn ($sum, array $order) => $sum + ((string)$order['payment_status'] === 'paid' ? (int)$order['total_amount'] : 0), 0);
        $unpaidAmount = $grossSales - $paidAmount;
        $orderCount = count($orders);
        $completedOrderCount = count(array_filter($orders, fn (array $order) => (string)$order['order_status'] === 'picked_up'));
        $cancelledOrderCount = count(array_filter($orders, fn (array $order) => (string)$order['order_status'] === 'cancelled'));

        $statusBreakdown = [
            'pending' => 0,
            'preparing' => 0,
            'ready' => 0,
            'picked_up' => 0,
            'cancelled' => 0,
        ];
        $paymentBreakdown = [
            'cash' => 0,
            'counter_card' => 0,
            'other' => 0,
            'unpaid' => 0,
        ];

        foreach ($orders as $order) {
            $status = (string)$order['order_status'];
            if (isset($statusBreakdown[$status])) {
                $statusBreakdown[$status] += 1;
            }

            $paymentMethod = (string)$order['payment_method'];
            if (isset($paymentBreakdown[$paymentMethod])) {
                $paymentBreakdown[$paymentMethod] += 1;
            } elseif ((string)$order['payment_status'] !== 'paid') {
                $paymentBreakdown['unpaid'] += 1;
            } else {
                $paymentBreakdown['other'] += 1;
            }
        }

        $topItemsStmt = db()->query(
            'SELECT ci.menu_item_id, ci.title AS item_name, SUM(ci.quantity) AS quantity, SUM(ci.quantity * ci.price) AS gross_sales
             FROM dinecore_cart_items ci
             JOIN dinecore_orders o ON o.id = ci.order_id
             JOIN dinecore_order_batches b ON b.id = ci.batch_id
             WHERE b.status <> "draft"
               AND o.order_status <> "merged"
             GROUP BY ci.menu_item_id, ci.title
             ORDER BY quantity DESC, gross_sales DESC
             LIMIT 5'
        );

        return [
            'summary' => [
                'businessDate' => $filters['date_from'] !== '' ? $filters['date_from'] : date('Y-m-d'),
                'grossSales' => $grossSales,
                'paidAmount' => $paidAmount,
                'unpaidAmount' => $unpaidAmount,
                'orderCount' => $orderCount,
                'completedOrderCount' => $completedOrderCount,
                'cancelledOrderCount' => $cancelledOrderCount,
                'averageOrderValue' => $orderCount > 0 ? (int)round($grossSales / $orderCount) : 0,
            ],
            'statusBreakdown' => $statusBreakdown,
            'paymentBreakdown' => $paymentBreakdown,
            'topItems' => array_map(fn (array $row) => [
                'itemId' => (string)$row['menu_item_id'],
                'itemName' => (string)$row['item_name'],
                'quantity' => (int)$row['quantity'],
                'grossSales' => (int)$row['gross_sales'],
            ], $topItemsStmt->fetchAll() ?: []),
        ];
    }

    private function normalizeReportOrderRow(array $order): array
    {
        $itemCountStmt = db()->prepare(
            'SELECT COALESCE(SUM(quantity), 0) AS total_items
             FROM dinecore_cart_items ci
             JOIN dinecore_order_batches b ON b.id = ci.batch_id
             WHERE ci.order_id = ?
               AND b.status <> "draft"'
        );
        $itemCountStmt->execute([(int)$order['id']]);
        $itemCount = (int)($itemCountStmt->fetch()['total_items'] ?? 0);

        $noteStmt = db()->prepare(
            'SELECT note
             FROM dinecore_order_timeline
             WHERE order_id = ?
             ORDER BY changed_at DESC, id DESC
             LIMIT 1'
        );
        $noteStmt->execute([(int)$order['id']]);
        $staffNote = (string)($noteStmt->fetch()['note'] ?? '');

        return [
            'orderId' => (int)$order['id'],
            'orderNo' => (string)$order['order_no'],
            'tableCode' => (string)$order['table_code'],
            'createdAt' => (string)$order['created_at'],
            'status' => (string)$order['order_status'],
            'paymentStatus' => (string)$order['payment_status'],
            'paymentMethod' => (string)$order['payment_method'],
            'totalAmount' => (int)$order['total_amount'],
            'itemCount' => $itemCount,
            'staffNoteSummary' => $staffNote,
        ];
    }

    private function resolveBusinessDate(Request $request): string
    {
        return trim((string)(
            $request->query['business_date']
            ?? $request->body['business_date']
            ?? $request->body['businessDate']
            ?? date('Y-m-d')
        ));
    }

    private function buildAuditSummaryPayload(string $businessDate): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_no, order_status, payment_status, total_amount
             FROM dinecore_orders
             WHERE DATE(created_at) = ?'
        );
        $stmt->execute([$businessDate]);
        $orders = $stmt->fetchAll() ?: [];

        $grossSales = array_reduce($orders, fn ($sum, array $order) => $sum + (int)$order['total_amount'], 0);
        $paidAmount = array_reduce($orders, fn ($sum, array $order) => $sum + ((string)$order['payment_status'] === 'paid' ? (int)$order['total_amount'] : 0), 0);
        $unpaidOrders = array_values(array_filter($orders, fn (array $order) => (string)$order['payment_status'] !== 'paid'));
        $unfinishedOrders = array_values(array_filter($orders, fn (array $order) => !in_array((string)$order['order_status'], ['picked_up', 'cancelled'], true)));
        $closing = $this->findClosingByDate($businessDate);
        $isLocked = $closing !== null && (string)$closing['status'] === 'closed';

        $blockingIssues = [];
        if ($unpaidOrders !== []) {
            $blockingIssues[] = [
                'type' => 'unpaid_orders',
                'label' => 'Unpaid orders exist',
                'count' => count($unpaidOrders),
                'orderIds' => array_map(fn (array $order) => (int)$order['id'], $unpaidOrders),
            ];
        }
        if ($unfinishedOrders !== []) {
            $blockingIssues[] = [
                'type' => 'unfinished_orders',
                'label' => 'Unfinished orders exist',
                'count' => count($unfinishedOrders),
                'orderIds' => array_map(fn (array $order) => (int)$order['id'], $unfinishedOrders),
            ];
        }

        return [
            'closingSummary' => [
                'businessDate' => $businessDate,
                'grossSales' => $grossSales,
                'paidAmount' => $paidAmount,
                'unpaidAmount' => $grossSales - $paidAmount,
                'orderCount' => count($orders),
                'unfinishedOrderCount' => count($unfinishedOrders),
                'closeStatus' => $isLocked ? 'closed' : (($closing && (string)$closing['status'] === 'reopened') ? 'reopened' : 'open'),
                'closedAt' => (string)($closing['closed_at'] ?? ''),
                'closedBy' => $this->resolveClosingUserName($closing),
            ],
            'blockingIssues' => $blockingIssues,
            'lockState' => [
                'businessDate' => $businessDate,
                'isLocked' => $isLocked,
                'lockedScopes' => $this->decodeJsonArray($closing['locked_scopes_json'] ?? '[]'),
            ],
        ];
    }

    private function buildAuditSummaryPayloadV2(string $businessDate): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_no, order_status, payment_status, total_amount
             FROM dinecore_orders
             WHERE DATE(created_at) = ?
               AND EXISTS (
                   SELECT 1
                   FROM dinecore_order_batches b
                   WHERE b.order_id = dinecore_orders.id
                     AND b.status <> "draft"
               )'
        );
        $stmt->execute([$businessDate]);
        $orders = $stmt->fetchAll() ?: [];

        $grossSales = array_reduce($orders, fn ($sum, array $order) => $sum + (int)$order['total_amount'], 0);
        $paidAmount = array_reduce($orders, fn ($sum, array $order) => $sum + ((string)$order['payment_status'] === 'paid' ? (int)$order['total_amount'] : 0), 0);
        $unpaidOrders = array_values(array_filter($orders, fn (array $order) => (string)$order['payment_status'] !== 'paid'));
        $unfinishedOrders = array_values(array_filter($orders, fn (array $order) => !in_array((string)$order['order_status'], ['picked_up', 'cancelled'], true)));
        $closing = $this->findClosingByDate($businessDate);
        $isLocked = $closing !== null && (string)$closing['status'] === 'closed';

        $blockingIssues = [];
        if ($unpaidOrders !== []) {
            $blockingIssues[] = [
                'type' => 'unpaid_orders',
                'label' => 'Unpaid orders exist',
                'count' => count($unpaidOrders),
                'orderIds' => array_map(fn (array $order) => (int)$order['id'], $unpaidOrders),
            ];
        }
        if ($unfinishedOrders !== []) {
            $blockingIssues[] = [
                'type' => 'unfinished_orders',
                'label' => 'Unfinished orders exist',
                'count' => count($unfinishedOrders),
                'orderIds' => array_map(fn (array $order) => (int)$order['id'], $unfinishedOrders),
            ];
        }

        return [
            'closingSummary' => [
                'businessDate' => $businessDate,
                'grossSales' => $grossSales,
                'paidAmount' => $paidAmount,
                'unpaidAmount' => $grossSales - $paidAmount,
                'orderCount' => count($orders),
                'unfinishedOrderCount' => count($unfinishedOrders),
                'closeStatus' => $isLocked ? 'closed' : (($closing && (string)$closing['status'] === 'reopened') ? 'reopened' : 'open'),
                'closedAt' => (string)($closing['closed_at'] ?? ''),
                'closedBy' => $this->resolveClosingUserName($closing),
            ],
            'blockingIssues' => $blockingIssues,
            'lockState' => [
                'businessDate' => $businessDate,
                'isLocked' => $isLocked,
                'lockedScopes' => $this->decodeJsonArray($closing['locked_scopes_json'] ?? '[]'),
            ],
        ];
    }

    private function appendClosingHistory(array $payload): void
    {
        $stmt = db()->prepare(
            'INSERT INTO dinecore_business_closing_history
                (business_date, action, actor_user_id, actor_name, actor_role, reason, reason_type, affected_scopes_json, before_status, after_status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $payload['business_date'],
            $payload['action'],
            $payload['actor_user_id'],
            $payload['actor_name'],
            $payload['actor_role'],
            $payload['reason'],
            $payload['reason_type'],
            json_encode($payload['affected_scopes'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $payload['before_status'],
            $payload['after_status'],
        ]);
    }

    private function findClosingByDate(string $businessDate): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, business_date, status, closed_at, closed_by_user_id, locked_scopes_json
             FROM dinecore_business_closings
             WHERE business_date = ?
             LIMIT 1'
        );
        $stmt->execute([$businessDate]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function resolveClosingUserName(?array $closing): string
    {
        if (!$closing || empty($closing['closed_by_user_id'])) {
            return '';
        }

        $stmt = db()->prepare(
            'SELECT display_name
             FROM dinecore_staff_profiles
             WHERE user_id = ?
             LIMIT 1'
        );
        $stmt->execute([(int)$closing['closed_by_user_id']]);
        return (string)($stmt->fetch()['display_name'] ?? '');
    }

    private function findOrderById(int $orderId): ?array
    {
        if ($orderId <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, order_no, table_code, order_status, payment_status, payment_method, estimated_wait_minutes,
                    subtotal_amount, service_fee_amount, tax_amount, total_amount, created_at, updated_at
             FROM dinecore_orders
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$orderId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function findBatchById(int $batchId): ?array
    {
        if ($batchId <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, order_id, batch_no, status, source_session_token, submitted_at, locked_at, created_at, updated_at
             FROM dinecore_order_batches
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$batchId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function listOrderBatches(int $orderId): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_id, batch_no, status, source_session_token, submitted_at, locked_at, created_at, updated_at
             FROM dinecore_order_batches
             WHERE order_id = ?
             ORDER BY batch_no ASC, id ASC'
        );
        $stmt->execute([$orderId]);
        return $stmt->fetchAll() ?: [];
    }

    private function listSessionsForOrder(int $orderId, bool $activeOnly): array
    {
        $sql = 'SELECT id, session_token, table_code, order_id, person_slot, cart_id, display_label, status, created_at, last_seen_at
                FROM dinecore_guest_sessions
                WHERE order_id = ?';
        $params = [$orderId];

        if ($activeOnly) {
            $sql .= ' AND status <> ?';
            $params[] = 'expired';
        }

        $sql .= ' ORDER BY person_slot ASC, id ASC';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row): array => [
            'id' => (int)$row['id'],
            'session_token' => (string)$row['session_token'],
            'table_code' => (string)$row['table_code'],
            'order_id' => (int)($row['order_id'] ?? 0),
            'person_slot' => max(1, (int)$row['person_slot']),
            'cart_id' => (string)$row['cart_id'],
            'display_label' => (string)$row['display_label'],
            'status' => (string)$row['status'],
        ], $stmt->fetchAll() ?: []);
    }

    private function findTableSessionByOrderId(int $orderId): ?array
    {
        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return null;
        }

        return $this->findLatestTableSessionByCode((string)$order['table_code']);
    }

    private function findLatestTableSessionByCode(string $tableCode): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, table_code, order_id, status
             FROM dinecore_table_sessions
             WHERE table_code = ?
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmt->execute([$tableCode]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function listCartItemsByCartId(int $orderId, ?int $batchId = null): array
    {
        $sql = 'SELECT id, cart_id, title, quantity, price, note, options_json
                FROM dinecore_cart_items
                WHERE order_id = ?';
        $params = [$orderId];

        if ($batchId !== null) {
            $sql .= ' AND batch_id = ?';
            $params[] = $batchId;
        }

        $sql .= ' ORDER BY id ASC';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);

        $itemsByCartId = [];
        foreach ($stmt->fetchAll() ?: [] as $row) {
            $itemsByCartId[(string)$row['cart_id']][] = [
                'id' => (int)$row['id'],
                'title' => (string)$row['title'],
                'quantity' => (int)$row['quantity'],
                'price' => (int)$row['price'],
                'note' => (string)($row['note'] ?? ''),
                'options' => $this->decodeJsonArray($row['options_json'] ?? '[]'),
            ];
        }

        return $itemsByCartId;
    }

    private function buildOrderPersons(int $orderId): array
    {
        $sessions = $this->listSessionsForOrder($orderId, false);
        $itemsByCartId = $this->listCartItemsByCartId($orderId, null);
        $persons = [];

        foreach ($sessions as $session) {
            $cartId = (string)$session['cart_id'];
            $items = $itemsByCartId[$cartId] ?? [];
            if ($items === []) {
                continue;
            }

            $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
            $serviceFee = (int)round($subtotal * 0.05);
            $tax = (int)round($subtotal * 0.025);
            $persons[] = [
                'cartId' => $cartId,
                'guestLabel' => (string)$session['display_label'],
                'subtotal' => $subtotal,
                'total' => $subtotal + $serviceFee + $tax,
            ];
        }

        return $persons;
    }

    private function buildBatchDetails(int $orderId): array
    {
        $sessions = $this->listSessionsForOrder($orderId, false);
        $visibleBatches = $this->filterEffectiveBatches($this->listOrderBatches($orderId));

        return array_map(function (array $batch) use ($orderId, $sessions): array {
            $itemsByCartId = $this->listCartItemsByCartId($orderId, (int)$batch['id']);
            $persons = [];

            foreach ($sessions as $session) {
                $cartId = (string)$session['cart_id'];
                $items = $itemsByCartId[$cartId] ?? [];
                if ($items === []) {
                    continue;
                }

                $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
                $persons[] = [
                    'cartId' => $cartId,
                    'guestLabel' => (string)$session['display_label'],
                    'subtotal' => $subtotal,
                    'items' => $items,
                ];
            }

            $subtotal = array_reduce($persons, fn ($sum, array $person) => $sum + (int)$person['subtotal'], 0);
            $itemCount = array_reduce(
                $persons,
                fn ($sum, array $person) => $sum + array_reduce(
                    $person['items'],
                    fn ($itemSum, array $item) => $itemSum + (int)$item['quantity'],
                    0
                ),
                0
            );

            return [
                'id' => (int)$batch['id'],
                'batchNo' => (int)$batch['batch_no'],
                'status' => (string)$batch['status'],
                'submittedAt' => $batch['submitted_at'] !== null ? (string)$batch['submitted_at'] : null,
                'lockedAt' => $batch['locked_at'] !== null ? (string)$batch['locked_at'] : null,
                'itemCount' => $itemCount,
                'subtotal' => $subtotal,
                'persons' => $persons,
            ];
        }, $visibleBatches);
    }

    private function listMergeCandidatesForOrder(array $order): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_no, table_code, order_status, payment_status, total_amount, created_at
             FROM dinecore_orders
             WHERE table_code = ?
               AND id <> ?
               AND payment_status <> ?
               AND order_status NOT IN (?, ?, ?)
               AND DATE(created_at) = DATE(?)
               AND EXISTS (
                   SELECT 1
                   FROM dinecore_order_batches b
                   WHERE b.order_id = dinecore_orders.id
                     AND b.status <> "draft"
               )
             ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([
            (string)$order['table_code'],
            (int)$order['id'],
            'paid',
            'cancelled',
            'merged',
            'draft',
            (string)$order['created_at'],
        ]);

        return array_map(function (array $row): array {
            $row = $this->normalizeOrderRowWithDerivedStatus($row);
            return [
            'id' => (int)$row['id'],
            'orderNo' => (string)$row['order_no'],
            'tableCode' => (string)$row['table_code'],
            'orderStatus' => (string)$row['order_status'],
            'paymentStatus' => (string)$row['payment_status'],
            'totalAmount' => (int)$row['total_amount'],
            'createdAt' => (string)$row['created_at'],
            ];
        }, $stmt->fetchAll() ?: []);
    }

    private function assertMergeableOrders(array $targetOrder, array $mergedOrder): void
    {
        if ((string)$targetOrder['table_code'] !== (string)$mergedOrder['table_code']) {
            throw new \RuntimeException('MERGE_TABLE_MISMATCH');
        }

        if (substr((string)$targetOrder['created_at'], 0, 10) !== substr((string)$mergedOrder['created_at'], 0, 10)) {
            throw new \RuntimeException('MERGE_DATE_MISMATCH');
        }

        foreach ([$targetOrder, $mergedOrder] as $order) {
            if ((string)$order['payment_status'] === 'paid') {
                throw new \RuntimeException('MERGE_ORDER_PAID');
            }
            if (in_array((string)$order['order_status'], ['cancelled', 'merged', 'draft'], true)) {
                throw new \RuntimeException('MERGE_ORDER_INVALID_STATUS');
            }
        }
    }

    private function resolveMaxBatchNo(int $orderId): int
    {
        $stmt = db()->prepare(
            'SELECT COALESCE(MAX(batch_no), 0) AS max_batch_no
             FROM dinecore_order_batches
             WHERE order_id = ?'
        );
        $stmt->execute([$orderId]);

        return (int)($stmt->fetch()['max_batch_no'] ?? 0);
    }

    private function recalculateOrderAmounts(int $orderId): void
    {
        $stmt = db()->prepare(
            'SELECT ci.quantity, ci.price
             FROM dinecore_cart_items ci
             INNER JOIN dinecore_order_batches b
               ON b.id = ci.batch_id
             WHERE ci.order_id = ?
               AND b.status <> ?'
        );
        $stmt->execute([$orderId, 'draft']);
        $rows = $stmt->fetchAll() ?: [];

        $subtotal = array_reduce(
            $rows,
            fn ($sum, array $row) => $sum + ((int)$row['price'] * (int)$row['quantity']),
            0
        );
        $serviceFee = (int)round($subtotal * 0.05);
        $tax = (int)round($subtotal * 0.025);

        $update = db()->prepare(
            'UPDATE dinecore_orders
             SET subtotal_amount = ?, service_fee_amount = ?, tax_amount = ?, total_amount = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $update->execute([
            $subtotal,
            $serviceFee,
            $tax,
            $subtotal + $serviceFee + $tax,
            $orderId,
        ]);
    }

    private function rebindMergedSessions(string $tableCode, int $fromOrderId, int $targetOrderId): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_guest_sessions
             SET order_id = ?, last_seen_at = NOW()
             WHERE table_code = ? AND order_id = ?'
        );
        $stmt->execute([$targetOrderId, $tableCode, $fromOrderId]);

        $tableSession = $this->findLatestTableSessionByCode($tableCode);
        if ($tableSession !== null) {
            $touch = db()->prepare(
                'UPDATE dinecore_table_sessions
                 SET order_id = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $touch->execute([$targetOrderId, (int)$tableSession['id']]);
        }
    }

    private function loadOrderTimeline(int $orderId): array
    {
        $stmt = db()->prepare(
            'SELECT status, source, note, changed_at
             FROM dinecore_order_timeline
             WHERE order_id = ?
             ORDER BY changed_at ASC, id ASC'
        );
        $stmt->execute([$orderId]);

        return array_map(fn (array $row) => [
            'status' => (string)$row['status'],
            'source' => (string)$row['source'],
            'note' => (string)$row['note'],
            'changed_at' => (string)$row['changed_at'],
        ], $stmt->fetchAll() ?: []);
    }

    private function listBatchItems(int $orderId, int $batchId): array
    {
        $stmt = db()->prepare(
            'SELECT id, title, quantity, note, options_json
             FROM dinecore_cart_items
             WHERE order_id = ? AND batch_id = ?
             ORDER BY id ASC'
        );
        $stmt->execute([$orderId, $batchId]);

        return array_map(fn (array $row) => [
            'id' => (int)$row['id'],
            'title' => (string)$row['title'],
            'quantity' => (int)$row['quantity'],
            'note' => (string)($row['note'] ?? ''),
            'options' => $this->decodeJsonArray($row['options_json'] ?? '[]'),
        ], $stmt->fetchAll() ?: []);
    }

    private function syncOrderStatusFromBatches(int $orderId): void
    {
        $stmt = db()->prepare(
            'SELECT status
             FROM dinecore_order_batches
             WHERE order_id = ? AND status <> ?
             ORDER BY batch_no DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$orderId, 'draft']);
        $status = $this->deriveOrderStatusFromBatches($orderId, null, 'draft');

        $update = db()->prepare(
            'UPDATE dinecore_orders
             SET order_status = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $update->execute([$status, $orderId]);
    }

    private function updateLatestEffectiveBatchStatus(int $orderId, string $status): void
    {
        $stmt = db()->prepare(
            'SELECT id
             FROM dinecore_order_batches
             WHERE order_id = ? AND status <> ?
             ORDER BY batch_no DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$orderId, 'draft']);
        $batchId = (int)($stmt->fetch()['id'] ?? 0);
        if ($batchId <= 0) {
            return;
        }

        $update = db()->prepare(
            'UPDATE dinecore_order_batches
             SET status = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $update->execute([$status, $batchId]);
    }

    private function isBusinessDateLockedForOrder(int $orderId): bool
    {
        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return false;
        }

        $stmt = db()->prepare(
            'SELECT status
             FROM dinecore_business_closings
             WHERE business_date = DATE(?) 
             LIMIT 1'
        );
        $stmt->execute([(string)$order['created_at']]);
        return (string)($stmt->fetch()['status'] ?? '') === 'closed';
    }

    private function decodeJsonArray(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (!is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function isEffectiveBatchStatus(string $status): bool
    {
        return $status !== '' && $status !== 'draft';
    }

    private function filterEffectiveBatches(array $batches): array
    {
        return array_values(array_filter(
            $batches,
            fn (array $batch): bool => $this->isEffectiveBatchStatus((string)($batch['status'] ?? ''))
        ));
    }

    private function normalizeBatchDrivenOrderStatus(string $status): string
    {
        return $status === 'submitted' ? 'pending' : $status;
    }

    private function deriveOrderStatusFromBatches(int $orderId, ?array $batches = null, string $fallback = 'draft'): string
    {
        $effectiveBatches = $this->filterEffectiveBatches($batches ?? $this->listOrderBatches($orderId));
        if ($effectiveBatches === []) {
            return $fallback;
        }

        $latestBatch = $effectiveBatches[array_key_last($effectiveBatches)];
        return $this->normalizeBatchDrivenOrderStatus((string)($latestBatch['status'] ?? $fallback));
    }

    private function normalizeOrderRowWithDerivedStatus(array $order, ?array $batches = null): array
    {
        $currentStatus = (string)($order['order_status'] ?? 'draft');
        if (in_array($currentStatus, ['cancelled', 'merged', 'picked_up'], true)) {
            return $order;
        }

        $order['order_status'] = $this->deriveOrderStatusFromBatches(
            (int)($order['id'] ?? 0),
            $batches,
            $currentStatus !== '' ? $currentStatus : 'draft'
        );

        return $order;
    }

    private function labelOrderStatus(string $status): string
    {
        return match ($status) {
            'draft' => 'draft',
            'pending' => 'pending',
            'submitted' => 'submitted',
            'preparing' => 'preparing',
            'ready' => 'ready',
            'picked_up' => 'picked_up',
            'cancelled' => 'cancelled',
            default => $status,
        };
    }

    private function labelPaymentStatus(string $status): string
    {
        return match ($status) {
            'unpaid' => 'unpaid',
            'paid' => 'paid',
            default => $status,
        };
    }
}













