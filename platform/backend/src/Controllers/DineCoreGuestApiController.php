<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use Throwable;

final class DineCoreGuestApiController
{
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

            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
            $order = $this->findOrderById((int)$session['order_id']);
            if ($order === null) {
                $response->notFound('Order not found');
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

            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
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
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
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
            $response->validation('Missing menu item id');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
            $menuItem = $this->findMenuItem($menuItemId);
            if ($menuItem === null || (int)$menuItem['hidden'] === 1) {
                $response->notFound('Menu item not found');
                return;
            }
            if ((int)$menuItem['sold_out'] === 1) {
                $response->error('MENU_ITEM_SOLD_OUT', 'Menu item sold out', 409);
                return;
            }

            $customization = is_array($request->body['customization'] ?? null) ? $request->body['customization'] : [];
            $resolved = $this->resolveCustomization($menuItem, $customization);

            $stmt = db()->prepare(
                'INSERT INTO dinecore_cart_items
                    (order_id, table_code, cart_id, menu_item_id, title, quantity, price, note, options_json, selected_option_ids_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                (int)$session['order_id'],
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
            $response->validation('Missing cart mutation payload');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
            $item = $this->findCartItem((int)$session['order_id'], $cartId, $cartItemId);
            if ($item === null) {
                $response->notFound('Cart item not found');
                return;
            }

            $nextQuantity = (int)$item['quantity'] + $delta;
            if ($nextQuantity <= 0) {
                $stmt = db()->prepare('DELETE FROM dinecore_cart_items WHERE id = ? AND order_id = ?');
                $stmt->execute([$cartItemId, (int)$session['order_id']]);
            } else {
                $stmt = db()->prepare(
                    'UPDATE dinecore_cart_items
                     SET quantity = ?, updated_at = NOW()
                     WHERE id = ? AND order_id = ?'
                );
                $stmt->execute([$nextQuantity, $cartItemId, (int)$session['order_id']]);
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
            $response->validation('Missing cart item');
            return;
        }

        try {
            $table = $this->requireTable($tableCode, $response);
            if ($table === null) {
                return;
            }
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
            $item = $this->findCartItem((int)$session['order_id'], $cartId, $cartItemId);
            if ($item === null) {
                $response->notFound('Cart item not found');
                return;
            }

            $menuItem = $this->findMenuItem((string)$item['menu_item_id']);
            if ($menuItem === null) {
                $response->notFound('Menu item not found');
                return;
            }

            $customization = is_array($request->body['customization'] ?? null) ? $request->body['customization'] : [];
            $resolved = $this->resolveCustomization($menuItem, $customization);

            $stmt = db()->prepare(
                'UPDATE dinecore_cart_items
                 SET price = ?, note = ?, options_json = ?, selected_option_ids_json = ?, updated_at = NOW()
                 WHERE id = ? AND order_id = ?'
            );
            $stmt->execute([
                (int)$resolved['price'],
                $resolved['note'],
                json_encode($resolved['options'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                json_encode($resolved['selectedOptionIds'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $cartItemId,
                (int)$session['order_id'],
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
            $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
            $response->ok($this->buildCheckoutSummary($tableCode));
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function checkoutSuccess(Request $request, Response $response): void
    {
        $orderId = (int)($request->query['orderId'] ?? $request->query['order_id'] ?? 0);
        if ($orderId <= 0) {
            $response->validation('Missing order id');
            return;
        }

        try {
            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('Order not found');
                return;
            }

            $response->ok([
                'orderId' => (int)$order['id'],
                'orderNo' => (string)$order['order_no'],
                'tableCode' => (string)$order['table_code'],
                'status' => (string)$order['order_status'],
                'paymentMethod' => (string)$order['payment_method'],
                'estimatedWaitMinutes' => $order['estimated_wait_minutes'] !== null ? (int)$order['estimated_wait_minutes'] : null,
                'persons' => $this->collectOrderPersons((int)$order['id']),
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
            $session = $this->resolveOrderingSession($tableCode, $this->resolveOrderingSessionToken($request));
            $summary = $this->buildCheckoutSummary($tableCode);
            $order = $this->findOrderById((int)$session['order_id']);
            if ($order === null) {
                $response->notFound('Order not found');
                return;
            }

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
                (int)$summary['subtotal'],
                (int)$summary['serviceFee'],
                (int)$summary['tax'],
                (int)$summary['total'],
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
                '顧客已送出訂單',
            ]);

            $response->ok([
                'orderId' => (int)$session['order_id'],
                'orderNo' => (string)$order['order_no'],
            ]);
        } catch (Throwable $error) {
            $this->handleThrowable($response, $error);
        }
    }

    public function orderTracker(Request $request, Response $response): void
    {
        $orderId = (int)($request->query['orderId'] ?? $request->query['order_id'] ?? 0);
        if ($orderId <= 0) {
            $response->validation('Missing order id');
            return;
        }

        try {
            $order = $this->findOrderById($orderId);
            if ($order === null) {
                $response->notFound('Order not found');
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
            $response->validation('Missing table code');
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
            $response->notFound('Table not found');
            return null;
        }

        if ((string)$table['status'] !== 'active') {
            $response->error('TABLE_INACTIVE', 'Table inactive', 409);
            return null;
        }

        if ((int)$table['is_ordering_enabled'] !== 1) {
            $response->error('ORDERING_DISABLED', 'Ordering disabled', 409);
            return null;
        }

        return $table;
    }

    private function buildEntryContextPayload(array $table, array $session, array $order): array
    {
        return array_merge($this->normalizeTable($table), [
            'ordering_session_token' => (string)$session['session_token'],
            'ordering_cart_id' => (string)$session['cart_id'],
            'person_slot' => (int)$session['person_slot'],
            'ordering_label' => (string)$session['display_label'],
            'order_id' => (int)$order['id'],
            'order_no' => (string)$order['order_no'],
            'order_status' => (string)$order['order_status'],
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

    private function resolveOrderingSession(string $tableCode, string $sessionToken): array
    {
        $openOrder = $this->findOpenOrderForTable($tableCode);
        if ($sessionToken !== '') {
            $session = $this->findSessionByToken($sessionToken);
            if ($session) {
                $order = $this->findOrderById((int)$session['order_id']);
                if ($order && !$this->isOrderSettled($order) && (string)$session['table_code'] === $tableCode) {
                    $stmt = db()->prepare(
                        'UPDATE dinecore_guest_sessions
                         SET status = ?, last_seen_at = NOW()
                         WHERE id = ?'
                    );
                    $stmt->execute(['active', (int)$session['id']]);
                    $session['status'] = 'active';
                    return $session;
                }

                $stmt = db()->prepare(
                    'UPDATE dinecore_guest_sessions
                     SET status = ?, last_seen_at = NOW()
                     WHERE id = ?'
                );
                $stmt->execute(['expired', (int)$session['id']]);
            }
        }

        $order = $openOrder ?? $this->createOpenOrder($tableCode);
        $nextSlot = $this->nextPersonSlot((int)$order['id']);
        $displayLabel = sprintf('%d號顧客', $nextSlot);
        $cartId = sprintf('guest-%d', $nextSlot);
        $token = sprintf('dcs_%s', bin2hex(random_bytes(16)));

        $stmt = db()->prepare(
            'INSERT INTO dinecore_guest_sessions
                (session_token, table_code, order_id, person_slot, cart_id, display_label, status, created_at, last_seen_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $stmt->execute([
            $token,
            $tableCode,
            (int)$order['id'],
            $nextSlot,
            $cartId,
            $displayLabel,
            'active',
        ]);

        return [
            'id' => (int)db()->lastInsertId(),
            'session_token' => $token,
            'table_code' => $tableCode,
            'order_id' => (int)$order['id'],
            'person_slot' => $nextSlot,
            'cart_id' => $cartId,
            'display_label' => $displayLabel,
            'status' => 'active',
        ];
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

    private function nextPersonSlot(int $orderId): int
    {
        $stmt = db()->prepare(
            'SELECT MAX(person_slot) AS max_slot
             FROM dinecore_guest_sessions
             WHERE order_id = ? AND status <> ?'
        );
        $stmt->execute([$orderId, 'expired']);

        return ((int)($stmt->fetch()['max_slot'] ?? 0)) + 1;
    }

    private function findSessionByToken(string $token): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, session_token, table_code, order_id, person_slot, cart_id, display_label, status
             FROM dinecore_guest_sessions
             WHERE session_token = ?
             LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        return $row ?: null;
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
            $groupId = (string)($group['id'] ?? '');
            $groupType = (string)($group['type'] ?? 'single');
            foreach (($group['options'] ?? []) as $option) {
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
        $sessions = $this->listSessionsForOrder($orderId, true);
        $cartItemsByCartId = [];
        $itemSchemasByMenuItemId = $this->buildItemSchemasByMenuItemId();

        $stmt = db()->prepare(
            'SELECT id, cart_id, menu_item_id, title, quantity, price, note, options_json, selected_option_ids_json
             FROM dinecore_cart_items
             WHERE order_id = ?
             ORDER BY id ASC'
        );
        $stmt->execute([$orderId]);
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
        }, $sessions);

        return [
            'orderingSessionToken' => (string)$orderingSession['session_token'],
            'orderingCartId' => (string)$orderingSession['cart_id'],
            'orderingLabel' => (string)$orderingSession['display_label'],
            'personSlot' => (int)$orderingSession['person_slot'],
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
        $optionGroups = $this->decodeJsonArray($menuItem['option_groups_json'] ?? '[]');

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
                ], is_array($group['options'] ?? null) ? $group['options'] : []),
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

    private function buildCheckoutSummary(string $tableCode): array
    {
        $order = $this->findOpenOrderForTable($tableCode);
        if ($order === null) {
            throw new \RuntimeException('ORDER_NOT_FOUND');
        }

        return $this->buildCheckoutSummaryForOrder($order);
    }

    private function buildCheckoutSummaryForOrder(array $order): array
    {
        $orderId = (int)$order['id'];

        $sessions = $this->listSessionsForOrder($orderId, false);
        $stmt = db()->prepare(
            'SELECT id, cart_id, title, quantity, price, note, options_json
             FROM dinecore_cart_items
             WHERE order_id = ?
             ORDER BY id ASC'
        );
        $stmt->execute([$orderId]);
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

        $persons = [];
        foreach ($sessions as $session) {
            $cartId = (string)$session['cart_id'];
            $items = $itemsByCartId[$cartId] ?? [];
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

        return [
            'subtotal' => $subtotal,
            'serviceFee' => $serviceFee,
            'tax' => $tax,
            'total' => $subtotal + $serviceFee + $tax,
            'persons' => $persons,
            'paymentMethods' => [
                ['id' => 'cash', 'label' => '櫃台現金付款', 'description' => '由櫃台人工確認現金收款。'],
                ['id' => 'counter-card', 'label' => '櫃台刷卡付款', 'description' => '由店員協助完成刷卡付款。'],
            ],
        ];
    }

    private function listSessionsForOrder(int $orderId, bool $activeOnly): array
    {
        $sql = 'SELECT id, session_token, table_code, order_id, person_slot, cart_id, display_label, status
                FROM dinecore_guest_sessions
                WHERE order_id = ?';
        if ($activeOnly) {
            $sql .= ' AND status <> ?';
        }
        $sql .= ' ORDER BY person_slot ASC, id ASC';

        $stmt = db()->prepare($sql);
        $stmt->execute($activeOnly ? [$orderId, 'expired'] : [$orderId]);

        return $stmt->fetchAll() ?: [];
    }

    private function collectOrderPersons(int $orderId): array
    {
        $order = $this->findOrderById($orderId);
        if ($order === null) {
            return [];
        }

        $summary = $this->buildCheckoutSummaryForOrder($order);
        return $summary['persons'];
    }

    private function findCartItem(int $orderId, string $cartId, int $cartItemId): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, order_id, cart_id, menu_item_id, quantity, note, price, options_json, selected_option_ids_json
             FROM dinecore_cart_items
             WHERE id = ? AND order_id = ? AND cart_id = ?
             LIMIT 1'
        );
        $stmt->execute([$cartItemId, $orderId, $cartId]);
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
            $response->notFound('Order not found');
            return;
        }

        $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'DineCore backend failed');
    }
}
