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

            $this->runDelayedGuestCleanup();
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), true);
            $order = (int)($session['order_id'] ?? 0) > 0 ? $this->findOrderById((int)$session['order_id']) : null;

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

            $this->runDelayedGuestCleanup();
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
            if ((int)($session['order_id'] ?? 0) <= 0) {
                $response->ok($this->buildEmptyCartPayload($session));
                return;
            }

            $response->ok($this->buildCartPayload($tableCode, $session));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function addItem(Request $request, Response $response): void
    {
        $response->error('LOCAL_CART_ONLY', 'LOCAL_CART_ONLY', 410);
    }

    public function changeItemQuantity(Request $request, Response $response): void
    {
        $response->error('LOCAL_CART_ONLY', 'LOCAL_CART_ONLY', 410);
    }

    public function updateItem(Request $request, Response $response): void
    {
        $response->error('LOCAL_CART_ONLY', 'LOCAL_CART_ONLY', 410);
    }

    public function checkoutSummary(Request $request, Response $response): void
    {
        $response->error('LOCAL_CART_ONLY', 'LOCAL_CART_ONLY', 410);
    }

    public function checkoutSuccess(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        $orderId = (int)($request->query['orderId'] ?? $request->query['order_id'] ?? 0);
        $submittedBatchNo = (int)($request->query['submittedBatchNo'] ?? $request->query['submitted_batch_no'] ?? 0);
        if ($orderId <= 0) {
            $response->validation('ORDER_ID_REQUIRED');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            if (!$this->sessionCanAccessOrder($session, $orderId, $tableCode)) {
                $response->error('ORDER_FORBIDDEN', 'ORDER_FORBIDDEN', 403);
                return;
            }

            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }
            if ((string)$order['table_code'] !== $tableCode) {
                $response->error('ORDER_FORBIDDEN', 'ORDER_FORBIDDEN', 403);
                return;
            }

            $batches = $this->buildBatchSummaries((int)$order['id'], (string)$session['cart_id']);
            $latestSubmittedBatch = $this->resolveCheckoutSuccessBatch($batches, $submittedBatchNo);

            $response->ok([
                'orderId' => (int)$order['id'],
                'orderNo' => (string)$order['order_no'],
                'tableCode' => (string)$order['table_code'],
                'status' => $this->resolveEffectiveOrderStatus($order),
                'paymentMethod' => (string)$order['payment_method'],
                'estimatedWaitMinutes' => $order['estimated_wait_minutes'] !== null ? (int)$order['estimated_wait_minutes'] : null,
                'persons' => $this->collectOrderPersons((int)$order['id'], (string)$session['cart_id']),
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

        $clientSubmissionId = trim((string)($request->body['clientSubmissionId'] ?? $request->body['client_submission_id'] ?? ''));
        $items = is_array($request->body['items'] ?? null) ? $request->body['items'] : [];
        $orderingLabel = trim((string)($request->body['orderingLabel'] ?? $request->body['ordering_label'] ?? ''));
        $personSlot = (int)($request->body['personSlot'] ?? $request->body['person_slot'] ?? 0);
        if ($clientSubmissionId === '') {
            $response->validation('CLIENT_SUBMISSION_ID_REQUIRED');
            return;
        }
        if ($items === []) {
            $response->validation('EMPTY_ORDER_ITEMS');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $this->runDelayedGuestCleanup();
            $response->ok($this->submitLocalCartOrder(
                $tableCode,
                $this->resolveOrderingSessionToken($request),
                $clientSubmissionId,
                $items,
                $orderingLabel,
                $personSlot
            ));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function orderTracker(Request $request, Response $response): void
    {
        $tableCode = $this->requireTableCode($request, $response);
        if ($tableCode === null) {
            return;
        }

        $orderId = (int)($request->query['orderId'] ?? $request->query['order_id'] ?? 0);
        if ($orderId <= 0) {
            $response->validation('ORDER_ID_REQUIRED');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request), false);
            if (!$this->sessionCanAccessOrder($session, $orderId, $tableCode)) {
                $response->error('ORDER_FORBIDDEN', 'ORDER_FORBIDDEN', 403);
                return;
            }

            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('ORDER_NOT_FOUND');
                return;
            }
            if ((string)$order['table_code'] !== $tableCode) {
                $response->error('ORDER_FORBIDDEN', 'ORDER_FORBIDDEN', 403);
                return;
            }

            $response->ok([
                'order' => [
                    'id' => (int)$order['id'],
                    'orderNo' => (string)$order['order_no'],
                    'tableCode' => (string)$order['table_code'],
                    'status' => $this->resolveEffectiveOrderStatus($order),
                    'paymentStatus' => (string)$order['payment_status'],
                    'estimatedWaitMinutes' => $order['estimated_wait_minutes'] !== null ? (int)$order['estimated_wait_minutes'] : null,
                ],
                'persons' => $this->collectOrderPersons($orderId, (string)$session['cart_id']),
                'batches' => $this->buildBatchSummaries($orderId, (string)$session['cart_id']),
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
            $response->error('TABLE_INACTIVE', 'TABLE_INACTIVE', 409);
            return null;
        }

        if ((int)$table['is_ordering_enabled'] !== 1) {
            $response->error('ORDERING_DISABLED', 'ORDERING_DISABLED', 409);
            return null;
        }

        return $table;
    }

    private function buildEntryContextPayload(array $table, array $session, ?array $order): array
    {
        $batch = null;
        if ($order !== null && (int)$order['id'] > 0 && !$this->isOrderSettled($order)) {
            $batch = $this->resolveDraftBatchForOrder((int)$order['id']);
        }

        return array_merge($this->normalizeTable($table), [
            'ordering_session_token' => (string)$session['session_token'],
            'ordering_cart_id' => (string)$session['cart_id'],
            'person_slot' => (int)$session['person_slot'],
            'ordering_label' => (string)$session['display_label'],
            'order_id' => $order !== null ? (int)$order['id'] : 0,
            'order_no' => $order !== null ? (string)$order['order_no'] : '',
            'order_status' => $order !== null ? $this->resolveEffectiveOrderStatus($order) : '',
            'current_batch_id' => $batch !== null ? (int)$batch['id'] : 0,
            'current_batch_no' => $batch !== null ? (int)$batch['batch_no'] : 0,
            'current_batch_status' => $batch !== null ? (string)$batch['status'] : '',
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

    private function buildEmptyCartPayload(array $orderingSession): array
    {
        return [
            'orderingSessionToken' => (string)$orderingSession['session_token'],
            'orderingCartId' => (string)$orderingSession['cart_id'],
            'orderingLabel' => (string)$orderingSession['display_label'],
            'personSlot' => (int)$orderingSession['person_slot'],
            'currentBatchId' => 0,
            'currentBatchNo' => 0,
            'currentBatchStatus' => '',
            'participantCount' => 1,
            'carts' => [
                [
                    'id' => (string)$orderingSession['cart_id'],
                    'guestLabel' => (string)$orderingSession['display_label'],
                    'note' => '',
                    'itemCount' => 0,
                    'subtotal' => 0,
                ],
            ],
            'cartItemsByCartId' => [
                (string)$orderingSession['cart_id'] => [],
            ],
            'itemSchemasByMenuItemId' => $this->buildItemSchemasByMenuItemId(),
        ];
    }

    private function sessionCanAccessOrder(array $session, int $orderId, string $tableCode): bool
    {
        if ((int)($session['order_id'] ?? 0) === $orderId) {
            return true;
        }

        $stmt = db()->prepare(
            'SELECT 1
             FROM dinecore_order_batches
             WHERE order_id = ? AND source_session_token = ?
             LIMIT 1'
        );
        $stmt->execute([$orderId, (string)$session['session_token']]);

        return (bool)$stmt->fetch();
    }

    private function submitLocalCartOrder(
        string $tableCode,
        string $sessionToken,
        string $clientSubmissionId,
        array $items,
        string $orderingLabel,
        int $personSlot
    ): array {
        $pdo = db();
        $startedTransaction = !$pdo->inTransaction();
        if ($startedTransaction) {
            $pdo->beginTransaction();
        }

        try {
            $this->lockTableForSession($tableCode);
            $session = $this->resolveOrderingSession($tableCode, $sessionToken, false);
            $duplicate = $this->findCheckoutSubmission((string)$session['session_token'], $clientSubmissionId);
            if ($duplicate !== null && (string)($duplicate['status'] ?? '') === 'completed') {
                if ($startedTransaction && $pdo->inTransaction()) {
                    $pdo->commit();
                }

                $payload = $this->decodeJsonArray((string)($duplicate['response_json'] ?? '[]'));
                $payload['duplicateHit'] = true;
                return $payload;
            }
            if ($duplicate !== null && (string)($duplicate['status'] ?? '') === 'processing') {
                throw new \RuntimeException('CHECKOUT_SUBMISSION_IN_PROGRESS');
            }

            if ($duplicate === null) {
                try {
                    $this->insertCheckoutSubmission((string)$session['session_token'], $clientSubmissionId, $tableCode);
                } catch (Throwable $error) {
                    if (!$this->isDuplicateCheckoutSubmissionError($error)) {
                        throw $error;
                    }

                    $duplicate = $this->findCheckoutSubmission((string)$session['session_token'], $clientSubmissionId);
                    if ($duplicate !== null && (string)($duplicate['status'] ?? '') === 'completed') {
                        $payload = $this->decodeJsonArray((string)($duplicate['response_json'] ?? '[]'));
                        $payload['duplicateHit'] = true;
                        if ($startedTransaction && $pdo->inTransaction()) {
                            $pdo->commit();
                        }
                        return $payload;
                    }

                    throw new \RuntimeException('CHECKOUT_SUBMISSION_IN_PROGRESS');
                }
            }

            $order = $this->resolveAppendableOrderForSession($tableCode, $session);
            if ($order === null) {
                $order = $this->createOpenOrder($tableCode);
            }

            $batch = $this->resolveDraftBatchForOrder((int)$order['id']);
            $this->replaceDraftBatchItems(
                (int)$order['id'],
                (int)$batch['id'],
                $tableCode,
                $session,
                $items
            );

            $normalizedLabel = $orderingLabel !== '' ? $orderingLabel : (string)$session['display_label'];
            $normalizedSlot = $personSlot > 0 ? $personSlot : (int)$session['person_slot'];
            $session = $this->assignSessionToOrder(
                $tableCode,
                (string)$session['session_token'],
                (int)$order['id'],
                $normalizedLabel,
                $normalizedSlot
            );

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

            $nextBatch = $this->createNextDraftBatchForOrder((int)$order['id']);
            $submittedTotal = $this->buildSubmittedTotals((int)$order['id']);
            $orderStatus = $this->deriveOrderStatus((int)$order['id']);

            $stmt = db()->prepare(
                'UPDATE dinecore_orders
                 SET order_status = ?, payment_status = ?, payment_method = ?, estimated_wait_minutes = ?, subtotal_amount = ?, service_fee_amount = ?, tax_amount = ?, total_amount = ?, updated_at = NOW()
                 WHERE id = ?'
            );
            $stmt->execute([
                $orderStatus,
                'unpaid',
                'unpaid',
                18,
                (int)$submittedTotal['subtotal'],
                (int)$submittedTotal['serviceFee'],
                (int)$submittedTotal['tax'],
                (int)$submittedTotal['total'],
                (int)$order['id'],
            ]);

            $timeline = db()->prepare(
                'INSERT INTO dinecore_order_timeline (order_id, status, source, note, changed_at)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $timeline->execute([
                (int)$order['id'],
                $orderStatus,
                'customer',
                sprintf('Customer submitted batch %d', (int)$batch['batch_no']),
            ]);

            $response = [
                'ok' => true,
                'duplicateHit' => false,
                'orderId' => (int)$order['id'],
                'orderNo' => (string)$order['order_no'],
                'orderStatus' => $orderStatus,
                'submittedBatchId' => (int)$batch['id'],
                'submittedBatchNo' => (int)$batch['batch_no'],
                'nextBatchId' => (int)$nextBatch['id'],
                'nextBatchNo' => (int)$nextBatch['batch_no'],
                'successPath' => sprintf('/t/%s/checkout/success/%d', $tableCode, (int)$order['id']),
                'trackerPath' => sprintf('/t/%s/order/%d', $tableCode, (int)$order['id']),
            ];

            $this->completeCheckoutSubmission(
                (string)$session['session_token'],
                $clientSubmissionId,
                (int)$order['id'],
                (int)$batch['id'],
                (int)$batch['batch_no'],
                $response
            );

            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->commit();
            }

            return $response;
        } catch (Throwable $error) {
            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $error;
        }
    }

    private function resolveAppendableOrderForSession(string $tableCode, array $session): ?array
    {
        $orderId = (int)($session['order_id'] ?? 0);
        if ($orderId <= 0) {
            return null;
        }

        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return null;
        }

        if ((string)$order['table_code'] !== $tableCode || $this->isOrderSettled($order)) {
            return null;
        }

        if ((string)$order['order_status'] === 'merged') {
            return null;
        }

        return $order;
    }

    private function replaceDraftBatchItems(
        int $orderId,
        int $batchId,
        string $tableCode,
        array $session,
        array $items
    ): void {
        $delete = db()->prepare('DELETE FROM dinecore_cart_items WHERE order_id = ? AND batch_id = ?');
        $delete->execute([$orderId, $batchId]);

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $menuItemId = trim((string)($item['menuItemId'] ?? $item['menu_item_id'] ?? ''));
            $quantity = max(1, (int)($item['quantity'] ?? 1));
            if ($menuItemId === '') {
                continue;
            }

            $menuItem = $this->findMenuItem($menuItemId);
            if ($menuItem === null || (int)$menuItem['hidden'] === 1) {
                throw new \RuntimeException('MENU_ITEM_NOT_FOUND');
            }
            if ((int)$menuItem['sold_out'] === 1) {
                throw new \RuntimeException('MENU_ITEM_SOLD_OUT');
            }

            $customization = [
                'note' => (string)($item['note'] ?? ''),
                'selectedOptionIds' => is_array($item['selectedOptionIds'] ?? null) ? $item['selectedOptionIds'] : [],
            ];
            $resolved = $this->resolveCustomization($menuItem, $customization);

            $stmt = db()->prepare(
                'INSERT INTO dinecore_cart_items
                    (order_id, batch_id, table_code, cart_id, menu_item_id, title, quantity, price, note, options_json, selected_option_ids_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $orderId,
                $batchId,
                $tableCode,
                (string)$session['cart_id'],
                $menuItemId,
                (string)$menuItem['name'],
                $quantity,
                (int)$resolved['price'],
                $resolved['note'],
                json_encode($resolved['options'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                json_encode($resolved['selectedOptionIds'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);
        }
    }

    private function assignSessionToOrder(
        string $tableCode,
        string $sessionToken,
        int $orderId,
        string $displayLabel,
        int $personSlot
    ): array {
        $tableSession = $this->findTableSessionForUpdate($tableCode);
        if ($tableSession === null) {
            throw new \RuntimeException('TABLE_SESSION_NOT_FOUND');
        }

        $session = $this->findGuestSessionByToken($tableCode, $sessionToken, true);
        if ($session === null) {
            throw new \RuntimeException('ORDERING_SESSION_REQUIRED');
        }

        $session = $this->updateGuestSessionAssignment(
            (int)$session['id'],
            $orderId,
            $displayLabel !== '' ? $displayLabel : (string)$session['display_label'],
            $personSlot > 0 ? $personSlot : (int)$session['person_slot'],
            'active'
        );
        $this->activateTableSession((int)$tableSession['id'], $orderId);

        return $session;
    }

    private function deriveOrderStatus(int $orderId): string
    {
        $stmt = db()->prepare(
            'SELECT status
             FROM dinecore_order_batches
             WHERE order_id = ? AND status <> ?
             ORDER BY batch_no DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$orderId, 'draft']);
        $status = (string)($stmt->fetch()['status'] ?? 'draft');

        return $status === 'submitted' ? 'pending' : $status;
    }

    private function insertCheckoutSubmission(string $sessionToken, string $clientSubmissionId, string $tableCode): void
    {
        $stmt = db()->prepare(
            'INSERT INTO dinecore_checkout_submissions
                (session_token, client_submission_id, table_code, status, response_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $stmt->execute([
            $sessionToken,
            $clientSubmissionId,
            $tableCode,
            'processing',
            json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }

    private function findCheckoutSubmission(string $sessionToken, string $clientSubmissionId): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, session_token, client_submission_id, table_code, order_id, submitted_batch_id, submitted_batch_no, status, response_json
             FROM dinecore_checkout_submissions
             WHERE session_token = ? AND client_submission_id = ?
             LIMIT 1
             FOR UPDATE'
        );
        $stmt->execute([$sessionToken, $clientSubmissionId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function completeCheckoutSubmission(
        string $sessionToken,
        string $clientSubmissionId,
        int $orderId,
        int $batchId,
        int $batchNo,
        array $response
    ): void {
        $stmt = db()->prepare(
            'UPDATE dinecore_checkout_submissions
             SET order_id = ?, submitted_batch_id = ?, submitted_batch_no = ?, status = ?, response_json = ?, updated_at = NOW()
             WHERE session_token = ? AND client_submission_id = ?'
        );
        $stmt->execute([
            $orderId,
            $batchId,
            $batchNo,
            'completed',
            json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $sessionToken,
            $clientSubmissionId,
        ]);
    }

    private function isDuplicateCheckoutSubmissionError(Throwable $error): bool
    {
        if (!$error instanceof \PDOException) {
            return false;
        }

        return $error->getCode() === '23000'
            && str_contains($error->getMessage(), 'ux_dinecore_checkout_submissions_session_client');
    }

    private function runDelayedGuestCleanup(): void
    {
        try {
            $pdo = db();
            $startedTransaction = !$pdo->inTransaction();
            if ($startedTransaction) {
                $pdo->beginTransaction();
            }

            $stmt = $pdo->prepare(
                'SELECT id, job_key, last_run_at, locked_until
                 FROM dinecore_housekeeping_jobs
                 WHERE job_key = ?
                 LIMIT 1
                 FOR UPDATE'
            );
            $stmt->execute(['dinecore_guest_cleanup']);
            $job = $stmt->fetch();
            if (!$job) {
                $insert = $pdo->prepare(
                    'INSERT INTO dinecore_housekeeping_jobs (job_key, last_run_at, locked_until, meta_json, created_at, updated_at)
                     VALUES (?, NULL, NULL, ?, NOW(), NOW())'
                );
                $insert->execute(['dinecore_guest_cleanup', json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
                $stmt->execute(['dinecore_guest_cleanup']);
                $job = $stmt->fetch();
            }

            $lastRunAt = strtotime((string)($job['last_run_at'] ?? ''));
            if ($lastRunAt !== false && (time() - $lastRunAt) < 1800) {
                if ($startedTransaction && $pdo->inTransaction()) {
                    $pdo->commit();
                }
                return;
            }

            $expire = $pdo->prepare(
                'UPDATE dinecore_guest_sessions
                 SET status = ?, last_seen_at = COALESCE(last_seen_at, NOW())
                 WHERE status <> ?
                   AND last_seen_at < DATE_SUB(NOW(), INTERVAL ? SECOND)'
            );
            $expire->execute(['expired', 'expired', self::GUEST_SESSION_IDLE_TIMEOUT_SECONDS]);

            $update = $pdo->prepare(
                'UPDATE dinecore_housekeeping_jobs
                 SET last_run_at = NOW(), locked_until = NULL, updated_at = NOW()
                 WHERE id = ?'
            );
            $update->execute([(int)$job['id']]);

            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->commit();
            }
        } catch (Throwable $error) {
            if (db()->inTransaction()) {
                db()->rollBack();
            }
        }
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
            $tableSession = $this->findTableSessionForUpdate($tableCode);
            if (!$tableSession && $allowCreate) {
                $this->insertActiveTableSession($tableCode, null);
                $tableSession = $this->findTableSessionForUpdate($tableCode);
            }
            if (!$tableSession) {
                throw new \RuntimeException('TABLE_SESSION_NOT_FOUND');
            }

            if ($sessionToken !== '') {
                $session = $this->findGuestSessionByToken($tableCode, $sessionToken, true);
                if ($session !== null) {
                    $sessionOrder = (int)$session['order_id'] > 0 ? $this->findOrderById((int)$session['order_id']) : null;
                    if (
                        (string)$session['table_code'] === $tableCode
                        && (string)$session['status'] !== 'expired'
                        && !$this->isGuestSessionTimedOut($session)
                        && ($sessionOrder === null || !$this->isOrderSettled($sessionOrder))
                    ) {
                        $session = $this->touchGuestSession((int)$session['id'], 'active');
                        $this->activateTableSession((int)$tableSession['id'], (int)($session['order_id'] ?? 0) > 0 ? (int)$session['order_id'] : null);

                        if ($startedTransaction) {
                            $pdo->commit();
                        }

                        return $session;
                    }

                    $this->touchGuestSession((int)$session['id'], 'expired');
                }
            }

            if (!$allowCreate) {
                throw new \RuntimeException('ORDERING_SESSION_REQUIRED');
            }

            $nextSlot = $this->nextPersonSlotForTable($tableCode);
            $displayLabel = $this->buildGuestDisplayLabel($tableCode);
            $cartId = sprintf('guest-%d', $nextSlot);
            $token = sprintf('dcs_%s', bin2hex(random_bytes(16)));
            $result = $this->insertGuestSession($tableCode, $token, $nextSlot, $cartId, $displayLabel);
            $this->activateTableSession((int)$tableSession['id'], null);

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
            'SELECT id, table_code, order_id, status, started_at, closed_at, created_at, updated_at
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

    private function activateTableSession(int $tableSessionId, ?int $orderId): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_table_sessions
             SET order_id = ?,
                 status = ?,
                 started_at = COALESCE(started_at, NOW()),
                 closed_at = NULL,
                 updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$orderId, 'active', $tableSessionId]);
    }

    private function insertActiveTableSession(string $tableCode, ?int $orderId): void
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
        return (string)$order['payment_status'] === 'paid'
            || in_array((string)$order['order_status'], ['cancelled', 'merged'], true);
    }

    private function isOrderActiveById(int $orderId): bool
    {
        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return false;
        }

        return !$this->isOrderSettled($order);
    }

    private function createOpenOrder(string $tableCode): array
    {
        $id = 0;
        $orderNo = '';
        $attempts = 0;

        while ($attempts < 5) {
            $attempts += 1;
            $orderNo = $this->createOrderNo($attempts);
            $stmt = db()->prepare(
                'INSERT INTO dinecore_orders
                    (order_no, table_code, order_status, payment_status, payment_method, estimated_wait_minutes, subtotal_amount, service_fee_amount, tax_amount, total_amount, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
            );

            try {
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
                break;
            } catch (Throwable $error) {
                if (!$this->isDuplicateOrderNoError($error) || $attempts >= 5) {
                    throw $error;
                }
            }
        }

        if ($id <= 0) {
            throw new \RuntimeException('CREATE_ORDER_FAILED');
        }

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

    private function createOrderNo(int $attempt = 1): string
    {
        $datePrefix = date('Ymd');
        $orderPrefix = sprintf('DC%s', $datePrefix);
        $stmt = db()->prepare(
            'SELECT COALESCE(MAX(CAST(RIGHT(order_no, 4) AS UNSIGNED)), 0) AS max_seq
             FROM dinecore_orders
             WHERE order_no LIKE ?'
        );
        $stmt->execute([$orderPrefix . '%']);
        $maxSeq = (int)($stmt->fetch()['max_seq'] ?? 0);

        $baseOrderNo = sprintf('%s%04d', $orderPrefix, $maxSeq + 1);
        if ($attempt <= 1) {
            return $baseOrderNo;
        }

        // 第二次以上重試加上短隨機碼，避免高併發下再次撞號。
        return sprintf('%s%s', $baseOrderNo, $this->randomAlphaNumeric(2));
    }

    private function isDuplicateOrderNoError(Throwable $error): bool
    {
        if (!$error instanceof \PDOException) {
            return false;
        }

        return $error->getCode() === '23000'
            && str_contains($error->getMessage(), "for key 'order_no'");
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

    private function nextPersonSlotForTable(string $tableCode): int
    {
        $stmt = db()->prepare(
            'SELECT COALESCE(MAX(person_slot), 0) AS max_slot
             FROM dinecore_guest_sessions
             WHERE table_code = ?'
        );
        $stmt->execute([$tableCode]);
        return ((int)($stmt->fetch()['max_slot'] ?? 0)) + 1;
    }

    private function buildGuestDisplayLabel(string $tableCode): string
    {
        $tablePrefix = strtoupper(trim($tableCode));
        if ($tablePrefix === '') {
            $tablePrefix = 'TABLE';
        }

        $existingLabels = [];
        $stmt = db()->prepare(
            'SELECT display_label
             FROM dinecore_guest_sessions
             WHERE table_code = ? AND status <> ?'
        );
        $stmt->execute([$tableCode, 'expired']);
        foreach ($stmt->fetchAll() ?: [] as $session) {
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

    private function normalizeGuestSessionRow(array $session): array
    {
        $orderId = (int)($session['order_id'] ?? 0);
        if ($orderId <= 0) {
            $orderId = null;
        }

        return [
            'id' => (int)($session['id'] ?? 0),
            'session_token' => (string)($session['session_token'] ?? ''),
            'table_code' => strtoupper((string)($session['table_code'] ?? '')),
            'order_id' => $orderId,
            'person_slot' => max(1, (int)($session['person_slot'] ?? 1)),
            'cart_id' => (string)($session['cart_id'] ?? ''),
            'display_label' => (string)($session['display_label'] ?? ''),
            'status' => (string)($session['status'] ?? 'active'),
            'created_at' => (string)($session['created_at'] ?? date('Y-m-d H:i:s')),
            'last_seen_at' => (string)($session['last_seen_at'] ?? date('Y-m-d H:i:s')),
        ];
    }

    private function findGuestSessionByToken(string $tableCode, string $sessionToken, bool $forUpdate = false): ?array
    {
        if ($sessionToken === '') {
            return null;
        }

        $sql = 'SELECT id, session_token, table_code, order_id, person_slot, cart_id, display_label, status, created_at, last_seen_at
                FROM dinecore_guest_sessions
                WHERE table_code = ? AND session_token = ?
                LIMIT 1';
        if ($forUpdate) {
            $sql .= ' FOR UPDATE';
        }

        $stmt = db()->prepare($sql);
        $stmt->execute([$tableCode, $sessionToken]);
        $row = $stmt->fetch();

        return $row ? $this->normalizeGuestSessionRow($row) : null;
    }

    private function insertGuestSession(string $tableCode, string $sessionToken, int $personSlot, string $cartId, string $displayLabel): array
    {
        $stmt = db()->prepare(
            'INSERT INTO dinecore_guest_sessions
                (session_token, table_code, order_id, person_slot, cart_id, display_label, status, created_at, last_seen_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $stmt->execute([$sessionToken, $tableCode, null, $personSlot, $cartId, $displayLabel, 'active']);

        return $this->findGuestSessionByToken($tableCode, $sessionToken) ?? [
            'id' => (int)db()->lastInsertId(),
            'session_token' => $sessionToken,
            'table_code' => $tableCode,
            'order_id' => null,
            'person_slot' => $personSlot,
            'cart_id' => $cartId,
            'display_label' => $displayLabel,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'last_seen_at' => date('Y-m-d H:i:s'),
        ];
    }

    private function touchGuestSession(int $sessionId, string $status): array
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_guest_sessions
             SET status = ?, last_seen_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$status, $sessionId]);

        $fetch = db()->prepare(
            'SELECT id, session_token, table_code, order_id, person_slot, cart_id, display_label, status, created_at, last_seen_at
             FROM dinecore_guest_sessions
             WHERE id = ?
             LIMIT 1'
        );
        $fetch->execute([$sessionId]);
        $row = $fetch->fetch();
        if (!$row) {
            throw new \RuntimeException('ORDERING_SESSION_REQUIRED');
        }

        return $this->normalizeGuestSessionRow($row);
    }

    private function updateGuestSessionAssignment(int $sessionId, int $orderId, string $displayLabel, int $personSlot, string $status): array
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_guest_sessions
             SET order_id = ?, display_label = ?, person_slot = ?, status = ?, last_seen_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$orderId, $displayLabel, $personSlot, $status, $sessionId]);

        return $this->touchGuestSession($sessionId, $status);
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
            'participantCount' => count($visibleSessions),
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

        return $this->buildCheckoutSummaryForBatch($order, $batch, (string)$orderingSession['cart_id']);
    }

    private function buildCheckoutSummaryForBatch(array $order, array $batch, string $currentCartId = ''): array
    {
        $orderId = (int)$order['id'];
        $batchId = (int)$batch['id'];

        $sessions = $this->listSessionsForOrder($orderId, false);
        $itemsByCartId = $this->listCartItemsByCartId($orderId, $batchId);

        $persons = [];
        foreach ($sessions as $session) {
            $cartId = (string)$session['cart_id'];
            $items = $itemsByCartId[$cartId] ?? [];
            if (!$this->shouldExposeSessionInSummaryPayload($session, $items, $currentCartId)) {
                continue;
            }
            $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
            $serviceFee = (int)round($subtotal * 0.1);
            $tax = 0;
            $persons[] = [
                'cartId' => $cartId,
                'personSlot' => (int)$session['person_slot'],
                'guestLabel' => (string)$session['display_label'],
                'subtotal' => $subtotal,
                'serviceFee' => $serviceFee,
                'tax' => $tax,
                'total' => $subtotal + $serviceFee,
                'items' => $items,
            ];
        }

        $subtotal = array_reduce($persons, fn ($sum, array $person) => $sum + (int)$person['subtotal'], 0);
        $serviceFee = (int)round($subtotal * 0.1);
        $tax = 0;

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
            'total' => $subtotal + $serviceFee,
            'participantCount' => count($persons),
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
        $serviceFee = (int)round($subtotal * 0.1);
        $tax = 0;

        return [
            'subtotal' => $subtotal,
            'serviceFee' => $serviceFee,
            'tax' => $tax,
            'total' => $subtotal + $serviceFee,
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
        return (string)($session['cart_id'] ?? '') === $currentCartId;
    }

    private function shouldExposeSessionInSummaryPayload(array $session, array $items, string $currentCartId = ''): bool
    {
        if (count($items) <= 0) {
            return false;
        }

        if ($currentCartId === '') {
            return true;
        }

        return (string)($session['cart_id'] ?? '') === $currentCartId;
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

        return array_map(
            fn (array $row): array => $this->normalizeGuestSessionRow($row),
            $stmt->fetchAll() ?: []
        );
    }

    private function findTableSessionByOrderId(int $orderId): ?array
    {
        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, table_code, order_id, status
             FROM dinecore_table_sessions
             WHERE table_code = ?
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmt->execute([(string)$order['table_code']]);
        $row = $stmt->fetch();

        return $row ?: null;
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

    private function collectOrderPersons(int $orderId, string $currentCartId = ''): array
    {
        $sessions = $this->listSessionsForOrder($orderId, false);
        $itemsByCartId = $this->listCartItemsByCartId($orderId, null);
        $persons = [];

        foreach ($sessions as $session) {
            $cartId = (string)$session['cart_id'];
            $items = $itemsByCartId[$cartId] ?? [];
            if (!$this->shouldExposeSessionInSummaryPayload($session, $items, $currentCartId)) {
                continue;
            }

            $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
            $serviceFee = (int)round($subtotal * 0.1);
            $tax = 0;
            $persons[] = [
                'cartId' => $cartId,
                'personSlot' => (int)$session['person_slot'],
                'guestLabel' => (string)$session['display_label'],
                'subtotal' => $subtotal,
                'serviceFee' => $serviceFee,
                'tax' => $tax,
                'total' => $subtotal + $serviceFee,
                'items' => $items,
            ];
        }

        return $persons;
    }

    private function buildBatchSummaries(int $orderId, string $currentCartId = ''): array
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

        return array_map(function (array $batch) use ($orderId, $sessions, $currentCartId): array {
            $itemsByCartId = $this->listCartItemsByCartId($orderId, (int)$batch['id']);
            $persons = [];

            foreach ($sessions as $session) {
                $cartId = (string)$session['cart_id'];
                $items = $itemsByCartId[$cartId] ?? [];
                if (!$this->shouldExposeSessionInSummaryPayload($session, $items, $currentCartId)) {
                    continue;
                }

                $subtotal = array_reduce($items, fn ($sum, array $item) => $sum + ((int)$item['price'] * (int)$item['quantity']), 0);
                $persons[] = [
                    'cartId' => $cartId,
                    'personSlot' => (int)$session['person_slot'],
                    'guestLabel' => (string)$session['display_label'],
                    'subtotal' => $subtotal,
                    'serviceFee' => (int)round($subtotal * 0.1),
                    'tax' => 0,
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
            fn (array $batch): bool => $this->isEffectiveBatchStatus((string)($batch['status'] ?? ''))
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

    private function isEffectiveBatchStatus(string $status): bool
    {
        return $status !== '' && $status !== 'draft';
    }

    private function normalizeBatchDrivenOrderStatus(string $status): string
    {
        return $status === 'submitted' ? 'pending' : $status;
    }

    private function resolveEffectiveOrderStatus(array $order): string
    {
        $currentStatus = (string)($order['order_status'] ?? 'draft');
        if (in_array($currentStatus, ['cancelled', 'merged', 'picked_up'], true)) {
            return $currentStatus;
        }

        $stmt = db()->prepare(
            'SELECT status
             FROM dinecore_order_batches
             WHERE order_id = ? AND status <> ?
             ORDER BY batch_no DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([(int)($order['id'] ?? 0), 'draft']);
        $latestBatchStatus = (string)($stmt->fetch()['status'] ?? '');

        if ($latestBatchStatus === '') {
            return $currentStatus;
        }

        return $this->normalizeBatchDrivenOrderStatus($latestBatchStatus);
    }

    private function handleThrowable(Response $response, Throwable $error): void
    {
        $code = $error->getMessage();
        if ($code === 'ORDER_NOT_FOUND') {
            $response->notFound('ORDER_NOT_FOUND');
            return;
        }

        if ($code === 'ORDERING_SESSION_REQUIRED') {
            $response->error('ORDERING_SESSION_REQUIRED', 'ORDERING_SESSION_REQUIRED', 409);
            return;
        }

        if ($code === 'ORDER_FORBIDDEN') {
            $response->error('ORDER_FORBIDDEN', 'ORDER_FORBIDDEN', 403);
            return;
        }

        if ($code === 'MENU_ITEM_NOT_FOUND') {
            $response->notFound('MENU_ITEM_NOT_FOUND');
            return;
        }

        if ($code === 'MENU_ITEM_SOLD_OUT') {
            $response->error('MENU_ITEM_SOLD_OUT', 'MENU_ITEM_SOLD_OUT', 409);
            return;
        }

        if ($code === 'CHECKOUT_SUBMISSION_IN_PROGRESS') {
            $response->error('CHECKOUT_SUBMISSION_IN_PROGRESS', 'CHECKOUT_SUBMISSION_IN_PROGRESS', 409);
            return;
        }

        $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'DINECORE_GUEST_API_FAILED');
    }
}

