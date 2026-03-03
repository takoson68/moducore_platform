<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use Throwable;

final class DineCoreStaffApiController
{
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'Reports summary failed');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'Reports orders failed');
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
            $response->ok($this->buildAuditSummaryPayload($businessDate));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'Audit summary failed');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'Audit history failed');
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
            $summary = $this->buildAuditSummaryPayload($businessDate);
            if (($summary['lockState']['isLocked'] ?? false) === true) {
                $response->error('BUSINESS_DATE_ALREADY_CLOSED', 'Business date already closed', 409);
                return;
            }

            if (($summary['blockingIssues'] ?? []) !== []) {
                $response->error('AUDIT_CLOSE_BLOCKED', 'Audit close blocked', 409);
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'Audit close failed');
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
                $response->error('BUSINESS_DATE_NOT_CLOSED', 'Business date not closed', 409);
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'Audit unlock failed');
        }
    }

    private function requireStaffContext(Request $request, Response $response, array $allowedRoles): ?array
    {
        $token = $this->resolveTokenFromRequest($request);
        if ($token === '') {
            $response->unauthorized('STAFF_SESSION_REQUIRED');
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
            $response->unauthorized('STAFF_SESSION_REQUIRED');
            return null;
        }

        if (!in_array((string)$row['role'], $allowedRoles, true)) {
            $response->forbidden('STAFF_ROLE_FORBIDDEN');
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
                WHERE 1 = 1';
        $params = [];

        if ($filters['date_from'] !== '') {
            $sql .= ' AND DATE(created_at) >= ?';
            $params[] = $filters['date_from'];
        }
        if ($filters['date_to'] !== '') {
            $sql .= ' AND DATE(created_at) <= ?';
            $params[] = $filters['date_to'];
        }
        if ($filters['status'] !== '' && $filters['status'] !== 'all') {
            $sql .= ' AND order_status = ?';
            $params[] = $filters['status'];
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
        return $stmt->fetchAll() ?: [];
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
             FROM dinecore_cart_items
             WHERE order_id = ?'
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
                'label' => '仍有未付款訂單',
                'count' => count($unpaidOrders),
                'orderIds' => array_map(fn (array $order) => (int)$order['id'], $unpaidOrders),
            ];
        }
        if ($unfinishedOrders !== []) {
            $blockingIssues[] = [
                'type' => 'unfinished_orders',
                'label' => '仍有未完成訂單',
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
}
