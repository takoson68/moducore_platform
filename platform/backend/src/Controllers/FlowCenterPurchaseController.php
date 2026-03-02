<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterEmployeeContextAware;
use App\FlowCenter\Auth\FlowCenterRequestContext;

final class FlowCenterPurchaseController
{
    use FlowCenterEmployeeContextAware;

    public function list(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null || !$this->ensureModuleEnabled($context, $response)) {
            return;
        }

        $stmt = db()->prepare(
            'SELECT id, item_name, amount, purpose, vendor_name, status, created_at, updated_at
             FROM flowcenter_purchase_requests
             WHERE company_id = ? AND user_id = ?
             ORDER BY id DESC'
        );
        $stmt->execute([$context->companyId, $context->userId]);
        $rows = $stmt->fetchAll() ?: [];

        $response->ok(array_map(fn (array $row) => $this->normalizeRecord($row), $rows));
    }

    public function detail(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null || !$this->ensureModuleEnabled($context, $response)) {
            return;
        }

        $record = $this->findOwnedRecord((int)($request->query['id'] ?? 0), $context);
        if ($record === null) {
            $response->notFound('Purchase request not found');
            return;
        }

        $response->ok($this->normalizeRecord($record));
    }

    public function create(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null || !$this->ensureModuleEnabled($context, $response)) {
            return;
        }

        $itemName = trim((string)($request->body['item_name'] ?? ''));
        $amount = (float)($request->body['amount'] ?? 0);
        if ($itemName === '' || $amount <= 0) {
            $response->validation('Missing item_name or invalid amount');
            return;
        }

        $status = (string)($request->body['status'] ?? 'submitted');
        if (!in_array($status, ['draft', 'submitted'], true)) {
            $response->validation('Invalid purchase status');
            return;
        }

        $stmt = db()->prepare(
            'INSERT INTO flowcenter_purchase_requests
                (company_id, user_id, item_name, amount, purpose, vendor_name, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $context->companyId,
            $context->userId,
            $itemName,
            $amount,
            $this->nullableText($request->body['purpose'] ?? null),
            $this->nullableText($request->body['vendor_name'] ?? null),
            $status,
        ]);

        $record = $this->findOwnedRecord((int)db()->lastInsertId(), $context);
        $response->ok($record ? $this->normalizeRecord($record) : null, 201);
    }

    public function update(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null || !$this->ensureModuleEnabled($context, $response)) {
            return;
        }

        $id = (int)($request->body['id'] ?? 0);
        $record = $this->findOwnedRecord($id, $context);
        if ($record === null) {
            $response->notFound('Purchase request not found');
            return;
        }

        if (!in_array((string)$record['status'], ['draft', 'submitted'], true)) {
            $response->forbidden('Purchase request is locked');
            return;
        }

        $nextStatus = $request->body['status'] ?? $record['status'];
        if (!in_array((string)$nextStatus, ['draft', 'submitted'], true)) {
            $response->validation('Invalid purchase status');
            return;
        }

        $amount = isset($request->body['amount']) ? (float)$request->body['amount'] : (float)$record['amount'];
        if ($amount <= 0) {
            $response->validation('Invalid amount');
            return;
        }

        $stmt = db()->prepare(
            'UPDATE flowcenter_purchase_requests
             SET item_name = ?, amount = ?, purpose = ?, vendor_name = ?, status = ?
             WHERE id = ? AND company_id = ? AND user_id = ?'
        );
        $stmt->execute([
            (string)($request->body['item_name'] ?? $record['item_name']),
            $amount,
            $this->nullableText($request->body['purpose'] ?? $record['purpose']),
            $this->nullableText($request->body['vendor_name'] ?? $record['vendor_name']),
            $nextStatus,
            $id,
            $context->companyId,
            $context->userId,
        ]);

        $updated = $this->findOwnedRecord($id, $context);
        $response->ok($updated ? $this->normalizeRecord($updated) : null);
    }

    private function ensureModuleEnabled(FlowCenterRequestContext $context, Response $response): bool
    {
        if ($context->companyId === 'company-b') {
            $response->notFound('Purchase module disabled');
            return false;
        }

        return true;
    }

    private function findOwnedRecord(int $id, FlowCenterRequestContext $context): ?array
    {
        if ($id <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, item_name, amount, purpose, vendor_name, status, created_at, updated_at
             FROM flowcenter_purchase_requests
             WHERE id = ? AND company_id = ? AND user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$id, $context->companyId, $context->userId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function normalizeRecord(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'item_name' => (string)$row['item_name'],
            'amount' => (float)$row['amount'],
            'purpose' => (string)($row['purpose'] ?? ''),
            'vendor_name' => (string)($row['vendor_name'] ?? ''),
            'status' => (string)$row['status'],
            'created_at' => (string)$row['created_at'],
            'updated_at' => (string)$row['updated_at'],
        ];
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string)$value);
        return $text === '' ? null : $text;
    }
}
