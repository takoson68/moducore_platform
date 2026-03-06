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
            $stmt = db()->query(
                'SELECT id, code, name, area_name, dine_mode, status, is_ordering_enabled
                 FROM dinecore_tables
                 ORDER BY code ASC, id ASC'
            );

            $tables = array_map(fn (array $table): array => [
                'id' => (int)$table['id'],
                'code' => (string)$table['code'],
                'name' => (string)$table['name'],
                'areaName' => (string)$table['area_name'],
                'dineMode' => (string)$table['dine_mode'],
                'status' => (string)$table['status'],
                'orderingEnabled' => (int)$table['is_ordering_enabled'] === 1,
                'qrImageUrl' => $this->resolveTableQrImageUrl((string)$table['code']),
            ], $stmt->fetchAll() ?: []);

            $response->ok($tables);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入桌號資料失敗');
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

            $sql = 'SELECT id, order_no, table_code, order_status, payment_status, payment_method, total_amount, created_at
                    FROM dinecore_orders
                    WHERE EXISTS (
                        SELECT 1
                        FROM dinecore_order_batches b
                        WHERE b.order_id = dinecore_orders.id
                          AND b.status <> "draft"
                    )';
            $params = [];

            if ($tableCode !== '') {
                $sql .= ' AND table_code LIKE ?';
                $params[] = '%' . $tableCode . '%';
            }
            if ($orderNo !== '') {
                $sql .= ' AND order_no LIKE ?';
                $params[] = '%' . $orderNo . '%';
            }
            if ($orderStatus !== '' && $orderStatus !== 'all') {
                $sql .= ' AND order_status = ?';
                $params[] = $orderStatus;
            }
            if ($paymentStatus !== '' && $paymentStatus !== 'all') {
                $sql .= ' AND payment_status = ?';
                $params[] = $paymentStatus;
            }

            $sql .= ' ORDER BY created_at DESC, id DESC';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            $orders = $stmt->fetchAll() ?: [];

            $response->ok(array_map(function (array $order): array {
                $batches = $this->listOrderBatches((int)$order['id']);
                $activeSessions = $this->listSessionsForOrder((int)$order['id'], true);
                $visibleBatches = array_values(array_filter(
                    $batches,
                    fn (array $batch): bool => (string)$batch['status'] !== 'draft'
                ));
                $latestBatch = $visibleBatches !== [] ? $visibleBatches[array_key_last($visibleBatches)] : null;

                return [
                    'id' => (int)$order['id'],
                    'orderNo' => (string)$order['order_no'],
                    'tableCode' => (string)$order['table_code'],
                    'orderStatus' => (string)$order['order_status'],
                    'paymentStatus' => (string)$order['payment_status'],
                    'paymentMethod' => (string)$order['payment_method'],
                    'totalAmount' => (int)$order['total_amount'],
                    'guestCount' => count($activeSessions),
                    'createdAt' => (string)$order['created_at'],
                    'batchCount' => count($visibleBatches),
                    'latestBatchNo' => $latestBatch ? (int)$latestBatch['batch_no'] : 0,
                    'latestBatchStatus' => $latestBatch ? (string)$latestBatch['status'] : '',
                ];
            }, $orders));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入櫃台訂單失敗');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入櫃台訂單明細失敗');
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
                $response->error('BUSINESS_DATE_LOCKED', '當前營業日已關帳', 409);
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
                $note !== '' ? $note : sprintf('櫃台已更新訂單狀態為「%s」', $this->labelOrderStatus($orderStatus)),
            ]);

            $response->ok([
                'id' => $orderId,
                'orderStatus' => $orderStatus,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '更新櫃台訂單狀態失敗');
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
                $response->error('BUSINESS_DATE_LOCKED', '當前營業日已關帳', 409);
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
                sprintf('櫃台已更新付款狀態為「%s」', $this->labelPaymentStatus($paymentStatus)),
            ]);

            $response->ok([
                'id' => $orderId,
                'paymentStatus' => $paymentStatus,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '更新付款狀態失敗');
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
                        o.order_no, o.table_code, o.estimated_wait_minutes, o.created_at
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
                    'waitLabel' => sprintf('%d 分鐘', (int)($row['estimated_wait_minutes'] ?? 0)),
                    'items' => $items,
                ];
            }, $rows));
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入廚房訂單失敗');
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
                $response->error('BUSINESS_DATE_LOCKED', '當前營業日已關帳', 409);
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
                sprintf('廚房已更新第 %d 批狀態為「%s」', (int)$batch['batch_no'], $this->labelOrderStatus($orderStatus)),
            ]);

            $response->ok([
                'id' => $batchId,
                'orderStatus' => $orderStatus,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '更新廚房訂單狀態失敗');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入報表摘要失敗');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入報表訂單明細失敗');
        }
    }

    public function menuAdminItems(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        try {
            $response->ok([
                'categories' => $this->loadMenuAdminCategories(),
                'items' => $this->loadMenuAdminItems(),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_ITEMS_FAILED');
        }
    }

    public function generateTableQr(Request $request, Response $response): void
    {
        $context = $this->requireStaffContext($request, $response, ['counter', 'deputy_manager', 'manager']);
        if ($context === null) {
            return;
        }

        $tableCode = strtoupper(trim((string)($request->body['table_code'] ?? $request->body['tableCode'] ?? '')));

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

            $publicPath = '/assets/QRC/' . rawurlencode($fileName);
            $publicUrl = rtrim($this->resolveBackendBaseUrl(), '/') . $publicPath;
            $response->ok([
                'tableCode' => $tableCode,
                'fileName' => $fileName,
                'publicPath' => $publicPath,
                'publicUrl' => $publicUrl,
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

            $response->ok([
                'categories' => $this->loadMenuAdminCategories(),
                'items' => $this->loadMenuAdminItems(),
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'MENU_ADMIN_CREATE_ITEM_FAILED');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入關帳摘要失敗');
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '載入關帳歷程失敗');
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
                $response->error('BUSINESS_DATE_ALREADY_CLOSED', '當前營業日已關帳', 409);
                return;
            }

            if (($summary['blockingIssues'] ?? []) !== []) {
                $response->error('AUDIT_CLOSE_BLOCKED', '仍有阻塞項目，無法關帳', 409);
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '執行關帳失敗');
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
                $response->error('BUSINESS_DATE_NOT_CLOSED', '該營業日尚未關帳', 409);
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
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '執行解鎖失敗');
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
                 FROM dinecore_table_sessions
                 WHERE UPPER(TRIM(table_code)) = ?'
            );
            $countStmt->execute([$tableCode]);
            $matched = (int)($countStmt->fetch()['total'] ?? 0);
            if ($matched <= 0) {
                $response->notFound('TABLE_SESSION_NOT_FOUND');
                return;
            }

            $closeTableSession = db()->prepare(
                'UPDATE dinecore_table_sessions
                 SET status = ?, closed_at = NOW(), guest_state_json = ?, updated_at = NOW()
                 WHERE UPPER(TRIM(table_code)) = ?'
            );
            $closeTableSession->execute(['closed', '[]', $tableCode]);

            $response->ok([
                'matched' => $matched,
                'updated' => (int)$closeTableSession->rowCount(),
                'cleared' => (int)$closeTableSession->rowCount(),
                'scope' => 'table',
                'tableCode' => $tableCode,
                'actor' => (string)$context['username'],
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : '頛頝餅?極??餃');
        }
    }

    private function closeTableSessionsForOrder(int $orderId): void
    {
        $stmt = db()->prepare(
            'UPDATE dinecore_table_sessions
             SET status = ?, closed_at = NOW(), guest_state_json = ?, updated_at = NOW()
             WHERE order_id = ?'
        );
        $stmt->execute(['closed', '[]', $orderId]);
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
                     started_at = NOW(),
                     closed_at = NULL,
                     guest_state_json = CASE WHEN order_id = ? THEN guest_state_json ELSE ? END,
                     updated_at = NOW()
                 WHERE id = ?'
            );
            $update->execute([$orderId, 'active', $orderId, '[]', (int)$row['id']]);
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
            $response->error('STAFF_SESSION_REQUIRED', '需要有效的員工登入狀態', 401);
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
            $response->error('STAFF_SESSION_REQUIRED', '需要有效的員工登入狀態', 401);
            return null;
        }

        if (!in_array((string)$row['role'], $allowedRoles, true)) {
            $response->error('STAFF_ROLE_FORBIDDEN', '目前帳號無法執行此操作', 403);
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

    private function findTableByCode(string $tableCode): ?array
    {
        $stmt = db()->prepare(
            'SELECT id, code, name
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
            $origin = $this->extractOriginFromUrl($fromBody);
            if ($origin !== '') {
                return $origin;
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
        return rtrim($this->resolveBackendBaseUrl(), '/') . '/assets/QRC/' . rawurlencode($fileName) . $version;
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
        $optionGroups = [];

        foreach ($this->decodeJsonArray($row['option_groups_json'] ?? '[]') as $group) {
            if (!is_array($group)) {
                continue;
            }

            $options = [];
            foreach ((array)($group['options'] ?? []) as $option) {
                if (!is_array($option)) {
                    continue;
                }

                $options[] = [
                    'id' => (string)($option['id'] ?? ''),
                    'label' => (string)($option['label'] ?? ''),
                    'priceDelta' => (int)($option['price_delta'] ?? $option['priceDelta'] ?? 0),
                ];
            }

            $optionGroups[] = [
                'id' => (string)($group['id'] ?? ''),
                'label' => (string)($group['label'] ?? ''),
                'type' => (string)($group['type'] ?? 'single'),
                'required' => (bool)($group['required'] ?? false),
                'options' => $options,
            ];
        }

        return [
            'id' => (string)$row['id'],
            'title' => (string)$row['name'],
            'categoryId' => $categoryId,
            'categoryName' => $categoryNameById[$categoryId] ?? $categoryId,
            'description' => (string)($row['description'] ?? ''),
            'price' => (int)$row['base_price'],
            'imageUrl' => (string)($row['image_url'] ?? ''),
            'defaultOptionIds' => array_values(array_map(
                static fn ($id): string => (string)$id,
                $this->decodeJsonArray($row['default_option_ids_json'] ?? '[]')
            )),
            'optionGroups' => $optionGroups,
            'soldOut' => (int)$row['sold_out'] === 1,
            'hidden' => (int)$row['hidden'] === 1,
        ];
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
                )';
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
             JOIN dinecore_order_batches b ON b.id = ci.batch_id
             WHERE b.status <> "draft"
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
        $tableSession = $this->findTableSessionByOrderId($orderId);
        if ($tableSession === null) {
            return [];
        }

        $sessions = [];
        foreach ($this->decodeJsonArray($tableSession['guest_state_json'] ?? '[]') as $row) {
            if (!is_array($row)) {
                continue;
            }
            $status = (string)($row['status'] ?? 'active');
            if ($activeOnly && $status === 'expired') {
                continue;
            }
            if ((int)($row['order_id'] ?? 0) !== $orderId) {
                continue;
            }
            $sessions[] = [
                'id' => (int)($row['id'] ?? 0),
                'session_token' => (string)($row['session_token'] ?? ''),
                'table_code' => (string)($row['table_code'] ?? ''),
                'order_id' => (int)($row['order_id'] ?? 0),
                'person_slot' => max(1, (int)($row['person_slot'] ?? 1)),
                'cart_id' => (string)($row['cart_id'] ?? ''),
                'display_label' => (string)($row['display_label'] ?? ''),
                'status' => $status,
            ];
        }
        usort($sessions, fn (array $a, array $b): int => ((int)$a['person_slot'] <=> (int)$b['person_slot']));

        return $sessions;
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
        $visibleBatches = array_values(array_filter(
            $this->listOrderBatches($orderId),
            fn (array $batch): bool => (string)$batch['status'] !== 'draft'
        ));

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
        $status = (string)($stmt->fetch()['status'] ?? 'draft');
        if ($status === 'submitted') {
            $status = 'pending';
        }

        $update = db()->prepare(
            'UPDATE dinecore_orders
             SET order_status = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $update->execute([$status, $orderId]);
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

    private function labelOrderStatus(string $status): string
    {
        return match ($status) {
            'draft' => '草稿',
            'pending' => '待送出',
            'submitted' => '已送出',
            'preparing' => '製作中',
            'ready' => '可取餐',
            'picked_up' => '已取餐',
            'cancelled' => '已取消',
            default => $status,
        };
    }

    private function labelPaymentStatus(string $status): string
    {
        return match ($status) {
            'unpaid' => '未付款',
            'paid' => '已付款',
            default => $status,
        };
    }
}
