<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterEmployeeContextAware;
use App\FlowCenter\Auth\FlowCenterRequestContext;

final class FlowCenterLeaveController
{
    use FlowCenterEmployeeContextAware;

    public function list(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null) {
            return;
        }

        $stmt = db()->prepare(
            'SELECT id, leave_type, start_date, end_date, days, status, reason, delegate_name, created_at, updated_at
             FROM flowcenter_leave_requests
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
        if ($context === null) {
            return;
        }

        $record = $this->findOwnedRecord((int)($request->query['id'] ?? 0), $context);
        if ($record === null) {
            $response->notFound('Leave request not found');
            return;
        }

        $response->ok($this->normalizeRecord($record));
    }

    public function create(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null) {
            return;
        }

        $leaveType = trim((string)($request->body['leave_type'] ?? ''));
        $startDate = trim((string)($request->body['start_date'] ?? ''));
        $endDate = trim((string)($request->body['end_date'] ?? ''));

        if ($leaveType === '' || $startDate === '' || $endDate === '') {
            $response->validation('Missing leave_type, start_date, or end_date');
            return;
        }

        $status = (string)($request->body['status'] ?? 'submitted');
        if (!in_array($status, ['draft', 'submitted'], true)) {
            $response->validation('Invalid leave status');
            return;
        }

        $days = $this->calculateDays($startDate, $endDate);
        if ($days <= 0) {
            $response->validation('Invalid leave date range');
            return;
        }

        $stmt = db()->prepare(
            'INSERT INTO flowcenter_leave_requests
                (company_id, user_id, leave_type, start_date, end_date, days, status, reason, delegate_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $context->companyId,
            $context->userId,
            $leaveType,
            $startDate,
            $endDate,
            $days,
            $status,
            $this->nullableText($request->body['reason'] ?? null),
            $this->nullableText($request->body['delegate_name'] ?? null),
        ]);

        $record = $this->findOwnedRecord((int)db()->lastInsertId(), $context);
        $response->ok($record ? $this->normalizeRecord($record) : null, 201);
    }

    public function update(Request $request, Response $response): void
    {
        $context = $this->requireEmployeeContext($request, $response);
        if ($context === null) {
            return;
        }

        $id = (int)($request->body['id'] ?? 0);
        $record = $this->findOwnedRecord($id, $context);
        if ($record === null) {
            $response->notFound('Leave request not found');
            return;
        }

        if (!in_array((string)$record['status'], ['draft', 'submitted'], true)) {
            $response->forbidden('Leave request is locked');
            return;
        }

        $nextStatus = $request->body['status'] ?? $record['status'];
        if (!in_array((string)$nextStatus, ['draft', 'submitted'], true)) {
            $response->validation('Invalid leave status');
            return;
        }

        $startDate = (string)($request->body['start_date'] ?? $record['start_date']);
        $endDate = (string)($request->body['end_date'] ?? $record['end_date']);
        $days = $this->calculateDays($startDate, $endDate);
        if ($days <= 0) {
            $response->validation('Invalid leave date range');
            return;
        }

        $stmt = db()->prepare(
            'UPDATE flowcenter_leave_requests
             SET leave_type = ?, start_date = ?, end_date = ?, days = ?, status = ?, reason = ?, delegate_name = ?
             WHERE id = ? AND company_id = ? AND user_id = ?'
        );
        $stmt->execute([
            (string)($request->body['leave_type'] ?? $record['leave_type']),
            $startDate,
            $endDate,
            $days,
            $nextStatus,
            $this->nullableText($request->body['reason'] ?? $record['reason']),
            $this->nullableText($request->body['delegate_name'] ?? $record['delegate_name']),
            $id,
            $context->companyId,
            $context->userId,
        ]);

        $updated = $this->findOwnedRecord($id, $context);
        $response->ok($updated ? $this->normalizeRecord($updated) : null);
    }

    private function findOwnedRecord(int $id, FlowCenterRequestContext $context): ?array
    {
        if ($id <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, leave_type, start_date, end_date, days, status, reason, delegate_name, created_at, updated_at
             FROM flowcenter_leave_requests
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
            'leave_type' => (string)$row['leave_type'],
            'start_date' => (string)$row['start_date'],
            'end_date' => (string)$row['end_date'],
            'days' => (float)$row['days'],
            'status' => (string)$row['status'],
            'reason' => (string)($row['reason'] ?? ''),
            'delegate_name' => (string)($row['delegate_name'] ?? ''),
            'created_at' => (string)$row['created_at'],
            'updated_at' => (string)$row['updated_at'],
        ];
    }

    private function calculateDays(string $startDate, string $endDate): float
    {
        $start = strtotime($startDate);
        $end = strtotime($endDate);
        if ($start === false || $end === false || $end < $start) {
            return 0;
        }

        return (float)(int)floor((($end - $start) / 86400)) + 1;
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string)$value);
        return $text === '' ? null : $text;
    }
}
