<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterContextAware;
use App\FlowCenter\Auth\FlowCenterRequestContext;

final class FlowCenterDashboardController
{
    use FlowCenterContextAware;

    public function summary(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $response->ok([
            'counts' => [
                'my_leave_requests' => $this->countLeaveRequests($context),
                'my_purchase_requests' => $this->countPurchaseRequests($context),
                'my_tasks' => $this->countMyTasks($context),
                'pending_approvals' => $this->countPendingApprovals($context),
            ],
            'recent' => [
                'announcements' => $this->fetchRecentAnnouncements($context),
                'my_tasks' => $this->fetchRecentTasks($context),
            ],
        ]);
    }

    private function countLeaveRequests(FlowCenterRequestContext $context): int
    {
        $stmt = db()->prepare(
            'SELECT COUNT(*) FROM flowcenter_leave_requests WHERE company_id = ? AND user_id = ?'
        );
        $stmt->execute([$context->companyId, $context->userId]);
        return (int)$stmt->fetchColumn();
    }

    private function countPurchaseRequests(FlowCenterRequestContext $context): int
    {
        if ($context->companyId === 'company-b') {
            return 0;
        }

        $stmt = db()->prepare(
            'SELECT COUNT(*) FROM flowcenter_purchase_requests WHERE company_id = ? AND user_id = ?'
        );
        $stmt->execute([$context->companyId, $context->userId]);
        return (int)$stmt->fetchColumn();
    }

    private function countMyTasks(FlowCenterRequestContext $context): int
    {
        $stmt = db()->prepare(
            'SELECT COUNT(*)
             FROM flowcenter_tasks
             WHERE company_id = ?
               AND (creator_user_id = ? OR assignee_user_id = ?)'
        );
        $stmt->execute([$context->companyId, $context->userId, $context->userId]);
        return (int)$stmt->fetchColumn();
    }

    private function countPendingApprovals(FlowCenterRequestContext $context): int
    {
        if ($context->role !== 'manager') {
            return 0;
        }

        $stmt = db()->prepare(
            'SELECT
                (SELECT COUNT(*) FROM flowcenter_leave_requests WHERE company_id = ? AND status = ?) +
                (SELECT COUNT(*) FROM flowcenter_purchase_requests WHERE company_id = ? AND status = ?) AS total_pending'
        );
        $stmt->execute([$context->companyId, 'submitted', $context->companyId, 'submitted']);
        return (int)$stmt->fetchColumn();
    }

    private function fetchRecentAnnouncements(FlowCenterRequestContext $context): array
    {
        $stmt = db()->prepare(
            'SELECT id, title, published_at, created_at
             FROM flowcenter_announcements
             WHERE company_id = ?
             ORDER BY COALESCE(published_at, created_at) DESC
             LIMIT 5'
        );
        $stmt->execute([$context->companyId]);
        $rows = $stmt->fetchAll() ?: [];

        return array_map(fn (array $row) => [
            'id' => (int)$row['id'],
            'title' => (string)$row['title'],
            'time' => (string)($row['published_at'] ?: $row['created_at']),
        ], $rows);
    }

    private function fetchRecentTasks(FlowCenterRequestContext $context): array
    {
        $stmt = db()->prepare(
            'SELECT id, title, status, due_date, created_at
             FROM flowcenter_tasks
             WHERE company_id = ?
               AND (creator_user_id = ? OR assignee_user_id = ?)
             ORDER BY created_at DESC
             LIMIT 5'
        );
        $stmt->execute([$context->companyId, $context->userId, $context->userId]);
        $rows = $stmt->fetchAll() ?: [];

        return array_map(fn (array $row) => [
            'id' => (int)$row['id'],
            'title' => (string)$row['title'],
            'status' => (string)$row['status'],
            'due_date' => $row['due_date'],
            'created_at' => (string)$row['created_at'],
        ], $rows);
    }
}
