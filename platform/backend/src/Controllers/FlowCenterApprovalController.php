<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterManagerContextAware;
use App\FlowCenter\Auth\FlowCenterRequestContext;
use Throwable;

final class FlowCenterApprovalController
{
    use FlowCenterManagerContextAware;

    public function pending(Request $request, Response $response): void
    {
        $context = $this->requireManagerContext($request, $response);
        if ($context === null) {
            return;
        }

        $items = array_merge(
            $this->fetchPendingLeaveRequests($context),
            $this->fetchPendingPurchaseRequests($context),
        );

        usort($items, fn (array $left, array $right) => strcmp($right['created_at'], $left['created_at']));

        $response->ok($items);
    }

    public function decide(Request $request, Response $response): void
    {
        $context = $this->requireManagerContext($request, $response);
        if ($context === null) {
            return;
        }

        $sourceType = trim((string)($request->body['source_type'] ?? ''));
        $sourceId = (int)($request->body['source_id'] ?? 0);
        $decision = trim((string)($request->body['decision'] ?? ''));

        if (!in_array($sourceType, ['leave', 'purchase'], true) || $sourceId <= 0) {
            $response->validation('Invalid approval source');
            return;
        }

        if (!in_array($decision, ['approve', 'reject'], true)) {
            $response->validation('Invalid approval decision');
            return;
        }

        $pdo = db();
        $pdo->beginTransaction();

        try {
            $sourceRecord = $this->lockSourceRecord($sourceType, $sourceId, $context);
            if ($sourceRecord === null) {
                $pdo->rollBack();
                $response->notFound('Approval source not found');
                return;
            }

            if ((string)$sourceRecord['status'] !== 'submitted') {
                $pdo->rollBack();
                $response->forbidden('Approval source is not pending');
                return;
            }

            $nextStatus = $decision === 'approve' ? 'approved' : 'rejected';

            $this->insertApprovalDecision(
                context: $context,
                sourceType: $sourceType,
                sourceId: $sourceId,
                decision: $decision,
                comment: $this->nullableText($request->body['comment'] ?? null),
            );

            $this->updateSourceStatus($sourceType, $sourceId, $context, $nextStatus);

            $pdo->commit();

            $response->ok([
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'decision' => $decision,
                'status' => $nextStatus,
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    private function fetchPendingLeaveRequests(FlowCenterRequestContext $context): array
    {
        $stmt = db()->prepare(
            'SELECT id, user_id, leave_type, start_date, end_date, days, reason, created_at
             FROM flowcenter_leave_requests
             WHERE company_id = ? AND status = ?
             ORDER BY id DESC'
        );
        $stmt->execute([$context->companyId, 'submitted']);
        $rows = $stmt->fetchAll() ?: [];

        return array_map(fn (array $row) => [
            'source_type' => 'leave',
            'source_id' => (int)$row['id'],
            'applicant_user_id' => (int)$row['user_id'],
            'title' => (string)$row['leave_type'],
            'summary' => trim((string)$row['start_date'] . ' 至 ' . (string)$row['end_date']),
            'status' => 'submitted',
            'created_at' => (string)$row['created_at'],
            'payload' => [
                'days' => (float)$row['days'],
                'reason' => (string)($row['reason'] ?? ''),
            ],
        ], $rows);
    }

    private function fetchPendingPurchaseRequests(FlowCenterRequestContext $context): array
    {
        if ($context->companyId === 'company-b') {
            return [];
        }

        $stmt = db()->prepare(
            'SELECT id, user_id, item_name, amount, purpose, vendor_name, created_at
             FROM flowcenter_purchase_requests
             WHERE company_id = ? AND status = ?
             ORDER BY id DESC'
        );
        $stmt->execute([$context->companyId, 'submitted']);
        $rows = $stmt->fetchAll() ?: [];

        return array_map(fn (array $row) => [
            'source_type' => 'purchase',
            'source_id' => (int)$row['id'],
            'applicant_user_id' => (int)$row['user_id'],
            'title' => (string)$row['item_name'],
            'summary' => 'NT$ ' . number_format((float)$row['amount'], 0),
            'status' => 'submitted',
            'created_at' => (string)$row['created_at'],
            'payload' => [
                'purpose' => (string)($row['purpose'] ?? ''),
                'vendor_name' => (string)($row['vendor_name'] ?? ''),
            ],
        ], $rows);
    }

    private function lockSourceRecord(string $sourceType, int $sourceId, FlowCenterRequestContext $context): ?array
    {
        if ($sourceType === 'leave') {
            $stmt = db()->prepare(
                'SELECT id, status
                 FROM flowcenter_leave_requests
                 WHERE id = ? AND company_id = ?
                 LIMIT 1
                 FOR UPDATE'
            );
            $stmt->execute([$sourceId, $context->companyId]);
            $row = $stmt->fetch();
            return $row ?: null;
        }

        if ($context->companyId === 'company-b') {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, status
             FROM flowcenter_purchase_requests
             WHERE id = ? AND company_id = ?
             LIMIT 1
             FOR UPDATE'
        );
        $stmt->execute([$sourceId, $context->companyId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function insertApprovalDecision(
        FlowCenterRequestContext $context,
        string $sourceType,
        int $sourceId,
        string $decision,
        ?string $comment
    ): void {
        $stmt = db()->prepare(
            'INSERT INTO flowcenter_approvals
                (company_id, approver_user_id, source_type, source_id, decision, comment)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $context->companyId,
            $context->userId,
            $sourceType,
            $sourceId,
            $decision,
            $comment,
        ]);
    }

    private function updateSourceStatus(
        string $sourceType,
        int $sourceId,
        FlowCenterRequestContext $context,
        string $nextStatus
    ): void {
        if ($sourceType === 'leave') {
            $stmt = db()->prepare(
                'UPDATE flowcenter_leave_requests
                 SET status = ?
                 WHERE id = ? AND company_id = ?'
            );
            $stmt->execute([$nextStatus, $sourceId, $context->companyId]);
            return;
        }

        $stmt = db()->prepare(
            'UPDATE flowcenter_purchase_requests
             SET status = ?
             WHERE id = ? AND company_id = ?'
        );
        $stmt->execute([$nextStatus, $sourceId, $context->companyId]);
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string)$value);
        return $text === '' ? null : $text;
    }
}
