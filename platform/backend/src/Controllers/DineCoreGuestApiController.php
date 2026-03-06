<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use Throwable;

final class DineCoreGuestApiController
{
    private const GUEST_SESSION_IDLE_TIMEOUT_SECONDS = 14400;

    public function entryContext(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }

            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), true);
            $order = $this->findOrderById((int)$session['order_id']);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }

            $response->ok($this->buildEntryContextPayload($table, $session, $order));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function menu(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }

            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $rows = db()->query(
                'SELECT id, category_id, name, description, base_price, image_url, sold_out, hidden, badge, tone, tags_json, default_note, default_option_ids_json, option_groups_json
                 FROM dinecore_menu_items
                 WHERE hidden = 0
                 ORDER BY category_id ASC, id ASC'
            )->fetchAll() ?: [];

            $categories = db()->query(
                'SELECT id, name, sort_order
                 FROM dinecore_menu_categories
                 ORDER BY sort_order ASC, id ASC'
            )->fetchAll() ?: [];

            $response->ok([
                'table' => $this->normalizeTable($table),
                'ordering_session_token' => (string)$session['session_token'],
                'ordering_cart_id' => (string)$session['cart_id'],
                'person_slot' => (int)$session['person_slot'],
                'ordering_label' => (string)$session['display_label'],
                'categories' => array_map(fn (array $row) => [
                    'id' => (string)$row['id'],
                    'name' => (string)$row['name'],
                    'sortOrder' => (int)$row['sort_order'],
                ], $categories),
                'items' => array_map(fn (array $row) => $this->normalizeMenuItemForMenu($row), $rows),
            ]);
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function carts(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $response->ok($this->buildCartPayload($tableCode, $session));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function addItem(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        $menuItemId = trim((string)($request->body['menuItemId'] ?? $request->body['menu_item_id'] ?? ''));
        if ($menuItemId === '') {
            $response->validation('INVALID_ADD_ITEM_PARAMS');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $menuItem = $this->findMenuItem($menuItemId);
            if ($menuItem === null || (int)$menuItem['hidden'] === 1) {
                $response->notFound('MENU_ITEM_NOT_FOUND');
                return;
            }
            if ((int)$menuItem['sold_out'] === 1) {
                $response->error('MENU_ITEM_SOLD_OUT', 'MENU_ITEM_SOLD_OUT', 409);
                return;
            }

            $customization = is_array($request->body['customization'] ?? null) ? $request->body['customization'] : [];
            $resolved = $this->resolveCustomization($menuItem, $customization);
            $batch = $this->resolveDraftBatchForOrder((int)$session['order_id']);

            $stmt = db()->prepare(
                'INSERT INTO dinecore_cart_items
                    (order_id, batch_id, table_code, cart_id, menu_item_id, title, quantity, price, note, options_json, selected_option_ids_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                (int)$session['order_id'],
                (int)$batch['id'],
                $tableCode,
                (string)$session['cart_id'],
                $menuItemId,
                (string)$menuItem['name'],
                1,
                (int)$resolved['price'],
                $resolved['note'],
                json_encode($resolved['options'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                json_encode($resolved['selectedOptionIds'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);

            $response->ok($this->buildCartPayload($tableCode, $session));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function changeItemQuantity(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        $cartId = trim((string)($request->body['cartId'] ?? $request->body['cart_id'] ?? ''));
        $cartItemId = (int)($request->body['cartItemId'] ?? $request->body['cart_item_id'] ?? 0);
        $delta = (int)($request->body['delta'] ?? 0);

        if ($cartId === '' || $cartItemId <= 0 || $delta === 0) {
            $response->validation('INVALID_CART_ITEM_PARAMS');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $batch = $this->resolveDraftBatchForOrder((int)$session['order_id']);
            $item = $this->findCartItem((int)$session['order_id'], (int)$batch['id'], $cartId, $cartItemId);
            if ($item === null) {
                $response->notFound('CART_ITEM_NOT_FOUND');
                return;
            }

            $nextQuantity = (int)$item['quantity'] + $delta;
            if ($nextQuantity <= 0) {
                $stmt = db()->prepare('DELETE FROM dinecore_cart_items WHERE id = ? AND order_id = ? AND batch_id = ?');
                $stmt->execute([$cartItemId, (int)$session['order_id'], (int)$batch['id']]);
            } else {
                $stmt = db()->prepare(
                    'UPDATE dinecore_cart_items
                     SET quantity = ?, updated_at = NOW()
                     WHERE id = ? AND order_id = ? AND batch_id = ?'
                );
                $stmt->execute([$nextQuantity, $cartItemId, (int)$session['order_id'], (int)$batch['id']]);
            }

            $response->ok($this->buildCartPayload($tableCode, $session));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function updateItem(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        $cartId = trim((string)($request->body['cartId'] ?? $request->body['cart_id'] ?? ''));
        $cartItemId = (int)($request->body['cartItemId'] ?? $request->body['cart_item_id'] ?? 0);
        if ($cartId === '' || $cartItemId <= 0) {
            $response->validation('INVALID_UPDATE_ITEM_PARAMS');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $batch = $this->resolveDraftBatchForOrder((int)$session['order_id']);
            $item = $this->findCartItem((int)$session['order_id'], (int)$batch['id'], $cartId, $cartItemId);
            if ($item === null) {
                $response->notFound('CART_ITEM_NOT_FOUND');
                return;
            }

            $menuItem = $this->findMenuItem((string)$item['menu_item_id']);
            if ($menuItem === null) {
                $response->notFound('MENU_ITEM_NOT_FOUND');
                return;
            }

            $customization = is_array($request->body['customization'] ?? null) ? $request->body['customization'] : [];
            $resolved = $this->resolveCustomization($menuItem, $customization);

            $stmt = db()->prepare(
                'UPDATE dinecore_cart_items
                 SET price = ?, note = ?, options_json = ?, selected_option_ids_json = ?, updated_at = NOW()
                 WHERE id = ? AND order_id = ? AND batch_id = ?'
            );
            $stmt->execute([
                (int)$resolved['price'],
                $resolved['note'],
                json_encode($resolved['options'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                json_encode($resolved['selectedOptionIds'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $cartItemId,
                (int)$session['order_id'],
                (int)$batch['id'],
            ]);

            $response->ok($this->buildCartPayload($tableCode, $session));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function checkoutSummary(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $response->ok($this->buildCheckoutSummary($tableCode, $session));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function checkoutSuccess(Request $request, Response $response): void
    {
        $orderId = (int)($request->query['orderId'] ?? $request->query['order_id'] ?? 0);
        $submittedBatchNo = (int)($request->query['submittedBatchNo'] ?? $request->query['submitted_batch_no'] ?? 0);
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

            $batches = $this->buildBatchSummaries((int)$order['id']);
            $latestSubmittedBatch = $this->resolveCheckoutSuccessBatch($batches, $submittedBatchNo);

            $response->ok([
                'orderId' => (int)$order['id'],
                'orderNo' => (string)$order['order_no'],
                'tableCode' => (string)$order['table_code'],
                'status' => (string)$order['order_status'],
                'paymentMethod' => (string)$order['payment_method'],
                'estimatedWaitMinutes' => $order['estimated_wait_minutes'] !== null ? (int)$order['estimated_wait_minutes'] : null,
                'persons' => $this->collectOrderPersons((int)$order['id']),
                'batches' => $batches,
                'latestSubmittedBatch' => $latestSubmittedBatch,
            ]);
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function checkoutSubmit(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            $order = $this->findOrderById((int)$session['order_id']);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }
            $batch = $this->resolveDraftBatchForOrder((int)$session['order_id']);
            $summary = $this->buildCheckoutSummary($tableCode, $session);
            if ((int)$summary['itemCount'] <= 0) {
                $response->validation('EMPTY_ORDER_ITEMS');
                return;
            }

            $batchStmt = db()->prepare(
                'UPDATE dinecore_order_batches
                 SET status = ?, source_session_token = ?, submitted_at = NOW(), locked_at = NOW(), updated_at = NOW()
                 WHERE id = ?'
            );
            $batchStmt->execute([
                'submitted',
                (string)$session['session_token'],
                (int)$batch['id'],
            ]);

            $nextBatch = $this->createNextDraftBatchForOrder((int)$session['order_id']);
            $submittedTotal = $this->buildSubmittedTotals((int)$session['order_id']);

            $stmt = db()->prepare(
                'UPDATE dinecore_orders
                 SET order_status = ?, payment_status = ?, payment_method = ?, estimated_wait_minutes = ?, subtotal_amount = ?, service_fee_amount = ?, tax_amount = ?, total_amount = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([
                'pending',
                'unpaid',
                'unpaid',
                18,
                (int)$submittedTotal['subtotal'],
                (int)$submittedTotal['serviceFee'],
                (int)$submittedTotal['tax'],
                (int)$submittedTotal['total'],
                (int)$session['order_id'],
            ]);

            $timeline = db()->prepare(
                'INSERT INTO dinecore_order_timeline (order_id, status, source, note, changed_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $timeline->execute([
                (int)$session['order_id'],
                'pending',
                'customer',
                '憿批恥撌脤閮',
            ]);

            $response->ok([
                'orderId' => (int)$session['order_id'],
                'orderNo' => (string)$order['order_no'],
                'submittedBatchId' => (int)$batch['id'],
                'submittedBatchNo' => (int)$batch['batch_no'],
                'nextBatchId' => (int)$nextBatch['id'],
                'nextBatchNo' => (int)$nextBatch['batch_no'],
            ]);
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function orderTracker(Request $request, Response $response): void
    {
        $orderId = (int)($request->query['orderId'] ?? $request->query['order_id'] ?? 0);
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

            $timelineStmt = db()->prepare(
                'SELECT status, source, note, changed_at
                 FROM dinecore_order_timeline
                 WHERE order_id = ?
                 ORDER BY changed_at ASC, id ASC'
            );
            $timelineStmt->execute([$orderId]);

            $historyStmt = db()->prepare(
                'SELECT id, order_no, created_at, total_amount
                 FROM dinecore_orders
                 WHERE table_code = ?
                 ORDER BY created_at DESC, id DESC
                 LIMIT 5'
            );
            $historyStmt->execute([(string)$order['table_code']]);

            $response->ok([
                'order' => [
                    'id' => (int)$order['id'],
                    'orderNo' => (string)$order['order_no'],
                    'tableCode' => (string)$order['table_code'],
                    'status' => (string)$order['order_status'],
                    'paymentStatus' => (string)$order['payment_status'],
                    'estimatedWaitMinutes' => $order['estimated_wait_minutes'] !== null ? (int)$order['estimated_wait_minutes'] : null,
                ],
                'persons' => $this->collectOrderPersons($orderId),
                'batches' => $this->buildBatchSummaries($orderId),
                'timeline' => array_map(fn (array $row) => [
                    'status' => (string)$row['status'],
                    'source' => (string)$row['source'],
                    'note' => (string)$row['note'],
                    'changed_at' => (string)$row['changed_at'],
                ], $timelineStmt->fetchAll() ?: []),
                'history' => array_map(fn (array $row) => [
                    'id' => (int)$row['id'],
                    'orderNo' => (string)$row['order_no'],
                    'createdAt' => (string)$row['created_at'],
                    'totalAmount' => (int)$row['total_amount'],
                ], $historyStmt->fetchAll() ?: []),
            ]);
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    private function requireTableCode(Request $request, Response $response): ?string
    {
        $tableCode = trim((string)(
            $request->query['tableCode']
            ?? $request->query['table_code']
            ?? $request->body['tableCode']
            ?? $request->body['table_code']
            ?? ''
        ));
        if ($tableCode === '') {
            $response->validation('TABLE_CODE_REQUIRED');
            return null;
        }

        return strtoupper($tableCode);
    }

    private function resolveOrderingSessionToken(Request $request): string
    {
        return trim((string)(
            $request->query['orderingSessionToken']
            ?? $request->query['ordering_session_token']
            ?? $request->body['orderingSessionToken']
            ?? $request->body['ordering_session_token']
            ?? ''
        ));
    }

    private function requireTable(string $tableCode, Response $response): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, code, name, area_name, dine_mode, status, is_ordering_enabled
             FROM dinecore_tables
             WHERE code = ?
             LIMIT 1'
        );
        $stmt->execute([$tableCode]);
        $table = $stmt->fetch();
        if (!$table) {
            $response->notFound('TABLE_NOT_FOUND');
            return null;
        }

        if ((string)$table['status'] !== 'active') {
            $response->error('TABLE_INACTIVE', '甇斗????', 409);
            return null;
        }

        if ((int)$table['is_ordering_enabled'] !== 1) {
            $response->error('ORDERING_DISABLED', '甇斗??桀??怠??亙', 409);
            return null;
        }

        return $table;
    }

    private function buildEntryContextPayload(array $table, array $session, array $order): array
    {
        $batch = $this->resolveDraftBatchForOrder((int)$order['id']);

        return array_merge($this->normalizeTable($table), [
            'ordering_session_token' => (string)$session['session_token'],
            'ordering_cart_id' => (string)$session['cart_id'],
            'person_slot' => (int)$session['person_slot'],
            'ordering_label' => (string)$session['display_label'],
            'order_id' => (int)$order['id'],
            'order_no' => (string)$order['order_no'],
            'order_status' => (string)$order['order_status'],
            'current_batch_id' => (int)$batch['id'],
            'current_batch_no' => (int)$batch['batch_no'],
            'current_batch_status' => (string)$batch['status'],
        ]);
    }

    private function normalizeTable(array $table): array
    {
        return [
            'id' => (string)$table['id'],
            'code' => (string)$table['code'],
            'name' => (string)$table['name'],
            'area_name' => (string)$table['area_name'],
            'dine_mode' => (string)$table['dine_mode'],
            'status' => (string)$table['status'],
            'is_ordering_enabled' => (int)$table['is_ordering_enabled'] === 1,
        ];
    }

    private function resolveOrderingSession(string $tableCode, string $sessionToken, bool $allowCreate): array
    {
        $pdo = db();
        $startedTransaction = !$pdo->inTransaction();

        if ($startedTransaction) {
            $pdo->beginTransaction();
        }

        try {
            $this->lockTableForSession($tableCode);
            $order = $this->resolveActiveOrderForTable($tableCode, $allowCreate);
            $tableSession = $this->findTableSessionForUpdate($tableCode);
            if (!$tableSession) {
                throw new \RuntimeException('TABLE_SESSION_NOT_FOUND');
            }
            $guestState = $this->decodeGuestState((string)($tableSession['guest_state_json'] ?? '[]'));

            if ($sessionToken !== '') {
                $session = $this->findGuestStateSessionByToken($guestState, $sessionToken);
                if ($session !== null) {
                    if (
                        (int)$session['order_id'] === (int)$order['id']
                        && (string)$session['table_code'] === $tableCode
                        && (string)$session['status'] !== 'expired'
                        && !$this->isGuestSessionTimedOut($session)
                    ) {
                        $session['status'] = 'active';
                        $session['last_seen_at'] = date('Y-m-d H:i:s');
                        $guestState = $this->upsertGuestStateSession($guestState, $session);
                        $this->persistGuestStateForTableSession((int)$tableSession['id'], $guestState);

                        if ($startedTransaction) {
                            $pdo->commit();
                        }

                        return $session;
                    }

                    $session['status'] = 'expired';
                    $session['last_seen_at'] = date('Y-m-d H:i:s');
                    $guestState = $this->upsertGuestStateSession($guestState, $session);
                }
            }

            if (!$allowCreate) {
                $this->persistGuestStateForTableSession((int)$tableSession['id'], $guestState);
                throw new \RuntimeException('ORDERING_SESSION_REQUIRED');
            }

            $nextSlot = $this->nextPersonSlotFromGuestState($guestState);
            $displayLabel = $this->buildGuestDisplayLabel($tableCode, $guestState);
            $cartId = sprintf('guest-%d', $nextSlot);
            $token = sprintf('dcs_%s', bin2hex(random_bytes(16)));
            $now = date('Y-m-d H:i:s');

            $result = [
                'id' => 0,
                'session_token' => $token,
                'table_code' => $tableCode,
                'order_id' => (int)$order['id'],
                'person_slot' => $nextSlot,
                'cart_id' => $cartId,
                'display_label' => $displayLabel,
                'status' => 'active',
                'created_at' => $now,
                'last_seen_at' => $now,
            ];
            $guestState = $this->upsertGuestStateSession($guestState, $result);
            $this->persistGuestStateForTableSession((int)$tableSession['id'], $guestState);

            if ($startedTransaction) {
                $pdo->commit();
            }

            return $result;
        } catch (Throwable $error) {
            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }

    private function lockTableForSession(string $tableCode): void
    {
        $stmt = db()->prepare(
            'SELECT code
             FROM dinecore_tables
             WHERE code = ?
             FOR UPDATE'
        );
        $stmt->execute([$tableCode]);
    }

    private function resolveActiveOrderForTable(string $tableCode, bool $allowCreate): array
    {
        $tableSession = $this->findTableSessionForUpdate($tableCode);
        if ($tableSession && (int)($tableSession['order_id'] ?? 0) > 0 && (string)$tableSession['status'] === 'active') {
            $order = $this->findOrderById((int)$tableSession['order_id']);
            if ($order && !$this->isOrderSettled($order)) {
                return $order;
            }
            $this->clearTableSession((int)$tableSession['id']);
        }

        $openOrder = $this->findOpenOrderForTable($tableCode);
        if ($openOrder) {
            if ($tableSession) {
                $this->activateTableSession((int)$tableSession['id'], (int)$openOrder['id']);
            } else {
                $this->insertActiveTableSession($tableCode, (int)$openOrder['id']);
            }
            return $openOrder;
        }

        if (!$allowCreate) {
            throw new \RuntimeException('ORDERING_SESSION_REQUIRED');
        }

        $order = $this->createOpenOrder($tableCode);
        if ($tableSession) {
            $this->activateTableSession((int)$tableSession['id'], (int)$order['id']);
        } else {
            $this->insertActiveTableSession($tableCode, (int)$order['id']);
        }
        return $order;
    }

    private function findTableSessionForUpdate(string $tableCode): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, table_code, order_id, status, started_at, closed_at, guest_state_json, created_at, updated_at
             FROM dinecore_table_sessions
             WHERE table_code = ?
             ORDER BY id DESC
             FOR UPDATE'
        );
        $stmt->execute([$tableCode]);
        $rows = $stmt->fetchAll() ?: [];
        if ($rows !== []) {
            $current = $rows[0];
            if (count($rows) > 1) {
                $duplicateIds = array_map(
                    fn (array $row): int => (int)$row['id'],
                    array_slice($rows, 1)
                );
                $placeholders = implode(',', array_fill(0, count($duplicateIds), '?'));
                $delete = db()->prepare(
                    "DELETE FROM dinecore_table_sessions WHERE id IN ($placeholders)"
                );
                $delete->execute($duplicateIds);
            }
            return $current;
        }

        return null;
    }

    private function activateTableSession(int $tableSessionId, int $orderId): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_table_sessions
             SET order_id = ?,
                 status = ?,
                 started_at = NOW(),
                 closed_at = NULL,
                 guest_state_json = CASE WHEN order_id = ? THEN guest_state_json ELSE ? END,
                 updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$orderId, 'active', $orderId, '[]', $tableSessionId]);
    }

    private function insertActiveTableSession(string $tableCode, int $orderId): void
    {
        $stmt = db()->prepare(
            'INSERT INTO dinecore_table_sessions
                (table_code, order_id, status, started_at, closed_at, guest_state_json, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NULL, ?, NOW(), NOW())'
        );
        $stmt->execute([$tableCode, $orderId, 'active', '[]']);
    }

    private function clearTableSession(int $tableSessionId): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_table_sessions
             SET status = ?, closed_at = NOW(), guest_state_json = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute(['closed', '[]', $tableSessionId]);
    }

    private function findOpenOrderForTable(string $tableCode): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, order_no, table_code, order_status, payment_status, payment_method, estimated_wait_minutes, subtotal_amount, service_fee_amount, tax_amount, total_amount, created_at, updated_at
             FROM dinecore_orders
             WHERE table_code = ?
             ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([$tableCode]);
        $rows = $stmt->fetchAll() ?: [];

        foreach ($rows as $row) {
            if (!$this->isOrderSettled($row)) {
                return $row;
            }
        }

        return null;
    }

    private function isOrderSettled(array $order): bool
    {
        return (string)$order['payment_status'] === 'paid' || (string)$order['order_status'] === 'cancelled';
    }

    private function createOpenOrder(string $tableCode): array
    {
        $orderNo = $this->createOrderNo();
        $stmt = db()->prepare(
            'INSERT INTO dinecore_orders
                (order_no, table_code, order_status, payment_status, payment_method, estimated_wait_minutes, subtotal_amount, service_fee_amount, tax_amount, total_amount, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $stmt->execute([
            $orderNo,
            $tableCode,
            'draft',
            'unpaid',
            'unpaid',
            null,
            0,
            0,
            0,
            0,
        ]);

        $id = (int)db()->lastInsertId();
        $this->createInitialBatchForOrder($id);

        return $this->findOrderById($id) ?? [
            'id' => $id,
            'order_no' => $orderNo,
            'table_code' => $tableCode,
            'order_status' => 'draft',
            'payment_status' => 'unpaid',
            'payment_method' => 'unpaid',
            'estimated_wait_minutes' => null,
            'subtotal_amount' => 0,
            'service_fee_amount' => 0,
            'tax_amount' => 0,
            'total_amount' => 0,
        ];
    }

    private function createOrderNo(): string
    {
        $datePrefix = date('Ymd');
        $stmt = db()->prepare(
            'SELECT COUNT(*) AS total
             FROM dinecore_orders
             WHERE DATE(created_at) = CURDATE()'
        );
        $stmt->execute();
        $total = (int)($stmt->fetch()['total'] ?? 0);

        return sprintf('DC%s%04d', $datePrefix, $total + 1);
    }

    private function resolveCurrentBatchForOrder(int $orderId): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_id, batch_no, status, source_session_token, submitted_at, locked_at, created_at, updated_at
             FROM dinecore_order_batches
             WHERE order_id = ?
             ORDER BY batch_no DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$orderId]);
        $row = $stmt->fetch();
        if ($row) {
            return $row;
        }

        return $this->createBatchForOrder($orderId, 1, 'draft');
    }

    private function resolveDraftBatchForOrder(int $orderId): array
    {
        $stmt = db()->prepare(
            'SELECT id, order_id, batch_no, status, source_session_token, submitted_at, locked_at, created_at, updated_at
             FROM dinecore_order_batches
             WHERE order_id = ? AND status = ?
             ORDER BY batch_no DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$orderId, 'draft']);
        $row = $stmt->fetch();
        if ($row) {
            return $row;
        }

        return $this->createNextDraftBatchForOrder($orderId);
    }

    private function createInitialBatchForOrder(int $orderId): array
    {
        return $this->createBatchForOrder($orderId, 1, 'draft');
    }

    private function createNextDraftBatchForOrder(int $orderId): array
    {
        $stmt = db()->prepare(
            'SELECT COALESCE(MAX(batch_no), 0) AS max_batch_no
             FROM dinecore_order_batches
             WHERE order_id = ?'
        );
        $stmt->execute([$orderId]);
        $nextBatchNo = ((int)($stmt->fetch()['max_batch_no'] ?? 0)) + 1;

        return $this->createBatchForOrder($orderId, $nextBatchNo, 'draft');
    }

    private function createBatchForOrder(int $orderId, int $batchNo, string $status): array
    {
        $stmt = db()->prepare(
            'INSERT INTO dinecore_order_batches
                (order_id, batch_no, status, source_session_token, submitted_at, locked_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $stmt->execute([
            $orderId,
            $batchNo,
            $status,
            null,
            null,
            null,
        ]);

        $id = (int)db()->lastInsertId();

        return $this->findBatchById($id) ?? [
            'id' => $id,
            'order_id' => $orderId,
            'batch_no' => $batchNo,
            'status' => $status,
            'source_session_token' => null,
            'submitted_at' => null,
            'locked_at' => null,
        ];
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

    private function decodeGuestState(string $raw): array
    {
        if (trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        return array_values(array_filter($decoded, fn ($row): bool => is_array($row)));
    }

    private function findGuestStateSessionByToken(array $guestState, string $token): ?array
    {
        foreach ($guestState as $session) {
            if ((string)($session['session_token'] ?? '') === $token) {
                return $this->normalizeGuestStateSessionRow($session);
            }
        }

        return null;
    }

    private function upsertGuestStateSession(array $guestState, array $session): array
    {
        $normalized = $this->normalizeGuestStateSessionRow($session);
        $found = false;

        foreach ($guestState as $index => $row) {
            $rowToken = (string)($row['session_token'] ?? '');
            if ($rowToken !== '' && $rowToken === (string)$normalized['session_token']) {
                $guestState[$index] = $normalized;
                $found = true;
                break;
            }
        }

        if (!$found) {
            $guestState[] = $normalized;
        }

        usort($guestState, function (array $a, array $b): int {
            return ((int)$a['person_slot'] <=> (int)$b['person_slot'])
                ?: strcmp((string)$a['session_token'], (string)$b['session_token']);
        });

        return array_values($guestState);
    }

    private function persistGuestStateForTableSession(int $tableSessionId, array $guestState): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_table_sessions
             SET guest_state_json = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([
            json_encode($guestState, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $tableSessionId,
        ]);
    }

    private function nextPersonSlotFromGuestState(array $guestState): int
    {
        $max = 0;
        foreach ($guestState as $session) {
            $slot = (int)($session['person_slot'] ?? 0);
            if ($slot > $max) {
                $max = $slot;
            }
        }

        return $max + 1;
    }

    private function buildGuestDisplayLabel(string $tableCode, array $guestState): string
    {
        $tablePrefix = strtoupper(trim($tableCode));
        if ($tablePrefix === '') {
            $tablePrefix = 'TABLE';
        }

        $existingLabels = [];
        foreach ($guestState as $session) {
            $status = (string)($session['status'] ?? 'active');
            if ($status === 'expired') {
                continue;
            }
            $label = strtoupper(trim((string)($session['display_label'] ?? '')));
            if ($label !== '') {
                $existingLabels[$label] = true;
            }
        }

        for ($i = 0; $i < 8; $i += 1) {
            $label = sprintf('%s-%s', $tablePrefix, $this->randomAlphaNumeric(3));
            if (!isset($existingLabels[strtoupper($label)])) {
                return $label;
            }
        }

        return sprintf('%s-%s', $tablePrefix, $this->randomAlphaNumeric(4));
    }

    private function normalizeGuestStateSessionRow(array $session): array
    {
        return [
            'id' => (int)($session['id'] ?? 0),
            'session_token' => (string)($session['session_token'] ?? ''),
            'table_code' => strtoupper((string)($session['table_code'] ?? '')),
            'order_id' => (int)($session['order_id'] ?? 0),
            'person_slot' => max(1, (int)($session['person_slot'] ?? 1)),
            'cart_id' => (string)($session['cart_id'] ?? ''),
            'display_label' => (string)($session['display_label'] ?? ''),
            'status' => (string)($session['status'] ?? 'active'),
            'created_at' => (string)($session['created_at'] ?? date('Y-m-d H:i:s')),
            'last_seen_at' => (string)($session['last_seen_at'] ?? date('Y-m-d H:i:s')),
        ];
    }

    private function randomAlphaNumeric(int $length): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $maxIndex = strlen($chars) - 1;
        $code = '';
        for ($i = 0; $i < $length; $i += 1) {
            $code .= $chars[random_int(0, $maxIndex)];
        }

        return $code;
    }

    private function isGuestSessionTimedOut(array $session): bool
    {
        $lastSeenRaw = (string)($session['last_seen_at'] ?? '');
        if ($lastSeenRaw === '') {
            return true;
        }

        $lastSeenTs = strtotime($lastSeenRaw);
        if ($lastSeenTs === false) {
            return true;
        }

        return (time() - $lastSeenTs) > self::GUEST_SESSION_IDLE_TIMEOUT_SECONDS;
    }

    private function findOrderById(int $id): ?array
    {
        if ($id <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, order_no, table_code, order_status, payment_status, payment_method, estimated_wait_minutes, subtotal_amount, service_fee_amount, tax_amount, total_amount, created_at, updated_at
             FROM dinecore_orders
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function findMenuItem(string $menuItemId): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, category_id, name, description, base_price, image_url, sold_out, hidden, badge, tone, tags_json, default_note, default_option_ids_json, option_groups_json
             FROM dinecore_menu_items
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$menuItemId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function resolveCustomization(array $menuItem, array $payload): array
    {
        $optionGroups = $this->decodeJsonArray($menuItem['option_groups_json'] ?? '[]');
        $defaultOptionIds = $this->decodeJsonArray($menuItem['default_option_ids_json'] ?? '[]');
        $requestedOptionIds = is_array($payload['selectedOptionIds'] ?? null) ? $payload['selectedOptionIds'] : $defaultOptionIds;
        $normalizedOptionIds = $this->normalizeSelectedOptionIds($optionGroups, $requestedOptionIds);
        $optionLookup = $this->buildOptionLookup($optionGroups);
        $selectedOptions = array_values(array_filter(
            array_map(fn ($optionId) => $optionLookup[(string)$optionId] ?? null, $normalizedOptionIds)
        ));
        $extraPrice = array_reduce($selectedOptions, fn ($sum, array $option) => $sum + (int)($option['price_delta'] ?? 0), 0);

        return [
            'note' => trim((string)($payload['note'] ?? $menuItem['default_note'] ?? '')),
            'selectedOptionIds' => $normalizedOptionIds,
            'options' => array_map(fn (array $option) => (string)($option['label'] ?? ''), $selectedOptions),
            'price' => (int)$menuItem['base_price'] + $extraPrice,
        ];
    }

    private function buildOptionLookup(array $optionGroups): array
    {
        $lookup = [];
        foreach ($optionGroups as $group) {
            if (!is_array($group)) {
                continue;
            }

            $groupId = (string)($group['id'] ?? '');
            $groupType = (string)($group['type'] ?? 'single');
            foreach (($group['options'] ?? []) as $option) {
                if (!is_array($option)) {
                    continue;
                }

                $lookup[(string)($option['id'] ?? '')] = [
                    'id' => (string)($option['id'] ?? ''),
                    'label' => (string)($option['label'] ?? ''),
                    'price_delta' => (int)($option['price_delta'] ?? 0),
                    'group_id' => $groupId,
                    'group_type' => $groupType,
                ];
            }
        }

        return $lookup;
    }

    private function normalizeSelectedOptionIds(array $optionGroups, array $selectedOptionIds): array
    {
        $lookup = $this->buildOptionLookup($optionGroups);
        $safeIds = array_values(array_filter($selectedOptionIds, fn ($optionId) => isset($lookup[(string)$optionId])));
        $byGroup = [];

        foreach ($optionGroups as $group) {
            if (!is_array($group)) {
                continue;
            }

            $byGroup[(string)($group['id'] ?? '')] = [];
        }

        foreach ($safeIds as $optionId) {
            $option = $lookup[(string)$optionId] ?? null;
            if ($option === null) {
                continue;
            }

            if ($option['group_type'] === 'single') {
                $byGroup[$option['group_id']] = [(string)$optionId];
                continue;
            }

            $byGroup[$option['group_id']][] = (string)$optionId;
        }

        foreach ($optionGroups as $group) {
            if (!is_array($group)) {
                continue;
            }

            $groupId = (string)($group['id'] ?? '');
            $groupType = (string)($group['type'] ?? 'single');
            $options = is_array($group['options'] ?? null) ? $group['options'] : [];
            if ($groupType === 'single' && ($byGroup[$groupId] ?? []) === [] && $options !== []) {
                $byGroup[$groupId] = [(string)($options[0]['id'] ?? '')];
            }
        }

        $normalized = [];
        foreach ($optionGroups as $group) {
            $groupId = (string)($group['id'] ?? '');
            foreach (($byGroup[$groupId] ?? []) as $optionId) {
                if ($optionId !== '') {
                    $normalized[] = (string)$optionId;
                }
            }
        }

        return $normalized;
    }

    private function buildCartPayload(string $tableCode, array $orderingSession): array
    {
        $orderId = (int)$orderingSession['order_id'];
        $batch = $this->resolveDraftBatchForOrder($orderId);
        $sessions = $this->listSessionsForOrder($orderId, true);
        $cartItemsByCartId = [];
        $itemSchemasByMenuItemId = $this->buildItemSchemasByMenuItemId();

        $stmt = db()->prepare(
            'SELECT id, cart_id, menu_item_id, title, quantity, price, note, options_json, selected_option_ids_json
             FROM dinecore_cart_items
             WHERE order_id = ? AND batch_id = ?
             ORDER BY id ASC'
        );
        $stmt->execute([$orderId, (int)$batch['id']]);
        $itemRows = $stmt->fetchAll() ?: [];

        foreach ($itemRows as $itemRow) {
            $menuItem = $this->findMenuItem((string)$itemRow['menu_item_id']);
            $cartId = (string)$itemRow['cart_id'];
            $cartItemsByCartId[$cartId] = $cartItemsByCartId[$cartId] ?? [];
            $cartItemsByCartId[$cartId][] = [
                'id' => (int)$itemRow['id'],
                'menu_item_id' => (string)$itemRow['menu_item_id'],
                'title' => (string)$itemRow['title'],
                'quantity' => (int)$itemRow['quantity'],
                'price' => (int)$itemRow['price'],
                'note' => (string)($itemRow['note'] ?? ''),
                'options' => $this->decodeJsonArray($itemRow['options_json'] ?? '[]'),
                'selected_option_ids' => $this->decodeJsonArray($itemRow['selected_option_ids_json'] ?? '[]'),
                'cart_id' => $cartId,
                'editSchema' => $menuItem ? $this->buildCartItemEditSchema($menuItem, $itemRow) : null,
            ];
        }

        $visibleSessions = array_values(array_filter(
            $sessions,
            fn (array $session) => $this->shouldExposeSessionInCartPayload(
                $session,
                $cartItemsByCartId[(string)$session['cart_id']] ?? [],
                (string)$orderingSession['cart_id']
            )
        ));

        $carts = array_map(function (array $session) use ($cartItemsByCartId): array {
            $items = $cartItemsByCartId[(string)$session['cart_id']] ?? [];
            $subtotal = array_reduce(
                $items,
                fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']),
                0
            );
            $itemCount = array_reduce($items, fn ($sum, array $item) => $sum + (int)$item['quantity'], 0);

            return [
                'id' => (string)$session['cart_id'],
                'guestLabel' => (string)$session['display_label'],
                'note' => '',
                'itemCount' => $itemCount,
                'subtotal' => $subtotal,
            ];
        }, $visibleSessions);

        return [
            'orderingSessionToken' => (string)$orderingSession['session_token'],
            'orderingCartId' => (string)$orderingSession['cart_id'],
            'orderingLabel' => (string)$orderingSession['display_label'],
            'personSlot' => (int)$orderingSession['person_slot'],
            'currentBatchId' => (int)$batch['id'],
            'currentBatchNo' => (int)$batch['batch_no'],
            'currentBatchStatus' => (string)$batch['status'],
            'participantCount' => count($sessions),
            'carts' => $carts,
            'cartItemsByCartId' => $cartItemsByCartId,
            'itemSchemasByMenuItemId' => $itemSchemasByMenuItemId,
        ];
    }

    private function buildItemSchemasByMenuItemId(): array
    {
        $rows = db()->query(
            'SELECT id, name, base_price, default_note, default_option_ids_json, option_groups_json
             FROM dinecore_menu_items
             ORDER BY id ASC'
        )->fetchAll() ?: [];

        $lookup = [];
        foreach ($rows as $row) {
            $lookup[(string)$row['id']] = $this->buildMenuItemSchema($row);
        }

        return $lookup;
    }

    private function buildMenuItemSchema(array $menuItem): array
    {
        $optionGroups = array_values(array_filter(
            $this->decodeJsonArray($menuItem['option_groups_json'] ?? '[]'),
            fn ($group) => is_array($group)
        ));

        return [
            'id' => (string)$menuItem['id'],
            'title' => (string)$menuItem['name'],
            'basePrice' => (int)$menuItem['base_price'],
            'defaultNote' => (string)($menuItem['default_note'] ?? ''),
            'defaultOptionIds' => $this->decodeJsonArray($menuItem['default_option_ids_json'] ?? '[]'),
            'optionGroups' => array_map(fn (array $group) => [
                'id' => (string)($group['id'] ?? ''),
                'label' => (string)($group['label'] ?? ''),
                'type' => (string)($group['type'] ?? 'single'),
                'required' => (bool)($group['required'] ?? false),
                'options' => array_map(fn (array $option) => [
                    'id' => (string)($option['id'] ?? ''),
                    'label' => (string)($option['label'] ?? ''),
                    'priceDelta' => (int)($option['price_delta'] ?? 0),
                ], array_values(array_filter(
                    is_array($group['options'] ?? null) ? $group['options'] : [],
                    fn ($option) => is_array($option)
                ))),
            ], $optionGroups),
        ];
    }

    private function buildCartItemEditSchema(array $menuItem, array $cartItem): array
    {
        $schema = $this->buildMenuItemSchema($menuItem);
        $schema['note'] = (string)($cartItem['note'] ?? '');
        $schema['selectedOptionIds'] = $this->decodeJsonArray($cartItem['selected_option_ids_json'] ?? '[]');

        return $schema;
    }

    private function buildCheckoutSummary(string $tableCode, array $orderingSession): array
    {
        $order = $this->findOrderById((int)$orderingSession['order_id']);
        if ($order === null) {
            throw new \RuntimeException('ORDER_NOT_FOUND');
        }

        $batch = $this->resolveDraftBatchForOrder((int)$orderingSession['order_id']);

        return $this->buildCheckoutSummaryForBatch($order, $batch);
    }

    private function buildCheckoutSummaryForBatch(array $order, array $batch): array
    {
        $orderId = (int)$order['id'];
        $batchId = (int)$batch['id'];

        $sessions = $this->listSessionsForOrder($orderId, false);
        $itemsByCartId = $this->listCartItemsByCartId($orderId, $batchId);

        $persons = [];
        foreach ($sessions as $session) {
            $cartId = (string)$session['cart_id'];
            $items = $itemsByCartId[$cartId] ?? [];
            if (!$this->shouldExposeSessionInSummaryPayload($session, $items)) {
                continue;
            }
            $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
            $serviceFee = (int)round($subtotal * 0.05);
            $tax = (int)round($subtotal * 0.025);
            $persons[] = [
                'cartId' => $cartId,
                'personSlot' => (int)$session['person_slot'],
                'guestLabel' => (string)$session['display_label'],
                'subtotal' => $subtotal,
                'total' => $subtotal + $serviceFee + $tax,
                'items' => $items,
            ];
        }

        $subtotal = array_reduce($persons, fn ($sum, array $person) => $sum + (int)$person['subtotal'], 0);
        $serviceFee = (int)round($subtotal * 0.05);
        $tax = (int)round($subtotal * 0.025);

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
            'currentBatchId' => $batchId,
            'currentBatchNo' => (int)$batch['batch_no'],
            'currentBatchStatus' => (string)$batch['status'],
            'itemCount' => $itemCount,
            'subtotal' => $subtotal,
            'serviceFee' => $serviceFee,
            'tax' => $tax,
            'total' => $subtotal + $serviceFee + $tax,
            'participantCount' => count($sessions),
            'persons' => $persons,
            'paymentMethods' => [
                ['id' => 'cash', 'label' => 'Cash', 'description' => 'Pay at counter in cash'],
                ['id' => 'counter-card', 'label' => 'Card', 'description' => 'Pay at counter by card'],
            ],
        ];
    }

    private function buildSubmittedTotals(int $orderId): array
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

        return [
            'subtotal' => $subtotal,
            'serviceFee' => $serviceFee,
            'tax' => $tax,
            'total' => $subtotal + $serviceFee + $tax,
        ];
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

    private function shouldExposeSessionInCartPayload(array $session, array $items, string $currentCartId): bool
    {
        return true;
    }

    private function shouldExposeSessionInSummaryPayload(array $session, array $items): bool
    {
        return count($items) > 0;
    }

    private function listSessionsForOrder(int $orderId, bool $activeOnly): array
    {
        $tableSession = $this->findTableSessionByOrderId($orderId);
        if ($tableSession === null) {
            return [];
        }

        $guestState = $this->decodeGuestState((string)($tableSession['guest_state_json'] ?? '[]'));
        $rows = [];
        foreach ($guestState as $session) {
            $normalized = $this->normalizeGuestStateSessionRow($session);
            if ($activeOnly && (string)$normalized['status'] === 'expired') {
                continue;
            }
            if ((int)$normalized['order_id'] !== $orderId) {
                continue;
            }
            $rows[] = $normalized;
        }

        usort($rows, fn (array $a, array $b): int => ((int)$a['person_slot'] <=> (int)$b['person_slot']));
        return $rows;
    }

    private function findTableSessionByOrderId(int $orderId): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, table_code, order_id, status, guest_state_json
             FROM dinecore_table_sessions
             WHERE order_id = ?
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmt->execute([$orderId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function collectOrderPersons(int $orderId): array
    {
        $sessions = $this->listSessionsForOrder($orderId, false);
        $itemsByCartId = $this->listCartItemsByCartId($orderId, null);
        $persons = [];

        foreach ($sessions as $session) {
            $cartId = (string)$session['cart_id'];
            $items = $itemsByCartId[$cartId] ?? [];
            if (!$this->shouldExposeSessionInSummaryPayload($session, $items)) {
                continue;
            }

            $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
            $serviceFee = (int)round($subtotal * 0.05);
            $tax = (int)round($subtotal * 0.025);
            $persons[] = [
                'cartId' => $cartId,
                'personSlot' => (int)$session['person_slot'],
                'guestLabel' => (string)$session['display_label'],
                'subtotal' => $subtotal,
                'total' => $subtotal + $serviceFee + $tax,
                'items' => $items,
            ];
        }

        return $persons;
    }

    private function buildBatchSummaries(int $orderId): array
    {
        $sessions = $this->listSessionsForOrder($orderId, false);
        $stmt = db()->prepare(
            'SELECT id, batch_no, status, source_session_token, submitted_at, locked_at, created_at, updated_at
             FROM dinecore_order_batches
             WHERE order_id = ?
             ORDER BY batch_no ASC, id ASC'
        );
        $stmt->execute([$orderId]);
        $batches = $stmt->fetchAll() ?: [];

        return array_map(function (array $batch) use ($orderId, $sessions): array {
            $itemsByCartId = $this->listCartItemsByCartId($orderId, (int)$batch['id']);
            $persons = [];

            foreach ($sessions as $session) {
                $cartId = (string)$session['cart_id'];
                $items = $itemsByCartId[$cartId] ?? [];
                if (!$this->shouldExposeSessionInSummaryPayload($session, $items)) {
                    continue;
                }

                $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
                $persons[] = [
                    'cartId' => $cartId,
                    'personSlot' => (int)$session['person_slot'],
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
                'sourceSessionToken' => (string)($batch['source_session_token'] ?? ''),
                'submittedAt' => $batch['submitted_at'] !== null ? (string)$batch['submitted_at'] : null,
                'lockedAt' => $batch['locked_at'] !== null ? (string)$batch['locked_at'] : null,
                'itemCount' => $itemCount,
                'subtotal' => $subtotal,
                'persons' => $persons,
            ];
        }, $batches);
    }

    private function resolveCheckoutSuccessBatch(array $batches, int $submittedBatchNo): ?array
    {
        if ($submittedBatchNo > 0) {
            foreach ($batches as $batch) {
                if ((int)($batch['batchNo'] ?? 0) === $submittedBatchNo) {
                    return $batch;
                }
            }
        }

        $submittedBatches = array_values(array_filter(
            $batches,
            fn (array $batch): bool => (string)($batch['status'] ?? '') !== 'draft'
        ));

        if ($submittedBatches === []) {
            return null;
        }

        return $submittedBatches[array_key_last($submittedBatches)];
    }

    private function findCartItem(int $orderId, int $batchId, string $cartId, int $cartItemId): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, order_id, batch_id, cart_id, menu_item_id, quantity, note, price, options_json, selected_option_ids_json
             FROM dinecore_cart_items
             WHERE id = ? AND order_id = ? AND batch_id = ? AND cart_id = ?
             LIMIT 1'
        );
        $stmt->execute([$cartItemId, $orderId, $batchId, $cartId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function normalizeMenuItemForMenu(array $row): array
    {
        return [
            'id' => (string)$row['id'],
            'categoryId' => (string)$row['category_id'],
            'title' => (string)$row['name'],
            'subtitle' => (string)($row['description'] ?? ''),
            'price' => (int)$row['base_price'],
            'imageUrl' => (string)($row['image_url'] ?? ''),
            'soldOut' => (int)$row['sold_out'] === 1,
            'badge' => (string)($row['badge'] ?? ''),
            'tone' => (string)($row['tone'] ?? ''),
            'tags' => $this->decodeJsonArray($row['tags_json'] ?? '[]'),
            'customization' => $this->buildMenuItemSchema($row),
        ];
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

    private function handleThrowable(Response $response, Throwable $error): void
    {
        $code = $error->getMessage();
        if ($code === 'ORDER_NOT_FOUND') {
            $response->notFound('ORDER_NOT_FOUND');
            return;
        }

        if ($code === 'ORDERING_SESSION_REQUIRED') {
            $response->error('ORDERING_SESSION_REQUIRED', '?閬???暺?撌乩??挾', 409);
            return;
        }

        $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'DineCore 敺垢??憭望?');
    }
}


