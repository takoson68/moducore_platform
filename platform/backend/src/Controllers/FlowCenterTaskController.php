<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterContextAware;
use App\FlowCenter\Auth\FlowCenterRequestContext;

final class FlowCenterTaskController
{
    use FlowCenterContextAware;

    public function list(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $stmt = db()->prepare(
            'SELECT id, creator_user_id, assignee_user_id, title, description, priority, status, due_date, created_at, updated_at
             FROM flowcenter_tasks
             WHERE company_id = ?
               AND (creator_user_id = ? OR assignee_user_id = ? OR ? = ?)
             ORDER BY id DESC'
        );
        $stmt->execute([
            $context->companyId,
            $context->userId,
            $context->userId,
            $context->role,
            'manager',
        ]);
        $rows = $stmt->fetchAll() ?: [];

        $response->ok(array_map(fn (array $row) => $this->normalizeRecord($row), $rows));
    }

    public function detail(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $record = $this->findVisibleRecord((int)($request->query['id'] ?? 0), $context);
        if ($record === null) {
            $response->notFound('Task not found');
            return;
        }

        $response->ok($this->normalizeRecord($record));
    }

    public function create(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $title = trim((string)($request->body['title'] ?? ''));
        if ($title === '') {
            $response->validation('Missing task title');
            return;
        }

        $priority = (string)($request->body['priority'] ?? 'medium');
        if (!in_array($priority, ['low', 'medium', 'high'], true)) {
            $response->validation('Invalid task priority');
            return;
        }

        $status = (string)($request->body['status'] ?? 'todo');
        if (!in_array($status, ['todo', 'doing', 'done'], true)) {
            $response->validation('Invalid task status');
            return;
        }

        $stmt = db()->prepare(
            'INSERT INTO flowcenter_tasks
                (company_id, creator_user_id, assignee_user_id, title, description, priority, status, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $context->companyId,
            $context->userId,
            $this->nullableInt($request->body['assignee_user_id'] ?? null),
            $title,
            $this->nullableText($request->body['description'] ?? null),
            $priority,
            $status,
            $this->nullableText($request->body['due_date'] ?? null),
        ]);

        $record = $this->findVisibleRecord((int)db()->lastInsertId(), $context);
        $response->ok($record ? $this->normalizeRecord($record) : null, 201);
    }

    public function update(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $id = (int)($request->body['id'] ?? 0);
        $record = $this->findVisibleRecord($id, $context);
        if ($record === null) {
            $response->notFound('Task not found');
            return;
        }

        if (!$this->canMutateRecord($record, $context)) {
            $response->forbidden('Task update not allowed');
            return;
        }

        $priority = (string)($request->body['priority'] ?? $record['priority']);
        if (!in_array($priority, ['low', 'medium', 'high'], true)) {
            $response->validation('Invalid task priority');
            return;
        }

        $status = (string)($request->body['status'] ?? $record['status']);
        if (!in_array($status, ['todo', 'doing', 'done'], true)) {
            $response->validation('Invalid task status');
            return;
        }

        $stmt = db()->prepare(
            'UPDATE flowcenter_tasks
             SET assignee_user_id = ?, title = ?, description = ?, priority = ?, status = ?, due_date = ?
             WHERE id = ? AND company_id = ?'
        );
        $stmt->execute([
            $this->nullableInt($request->body['assignee_user_id'] ?? $record['assignee_user_id']),
            (string)($request->body['title'] ?? $record['title']),
            $this->nullableText($request->body['description'] ?? $record['description']),
            $priority,
            $status,
            $this->nullableText($request->body['due_date'] ?? $record['due_date']),
            $id,
            $context->companyId,
        ]);

        $updated = $this->findVisibleRecord($id, $context);
        $response->ok($updated ? $this->normalizeRecord($updated) : null);
    }

    public function delete(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $id = (int)($request->body['id'] ?? 0);
        $record = $this->findVisibleRecord($id, $context);
        if ($record === null) {
            $response->notFound('Task not found');
            return;
        }

        if (!$this->canMutateRecord($record, $context)) {
            $response->forbidden('Task delete not allowed');
            return;
        }

        $stmt = db()->prepare('DELETE FROM flowcenter_tasks WHERE id = ? AND company_id = ?');
        $stmt->execute([$id, $context->companyId]);
        $response->ok(['deleted' => $stmt->rowCount() > 0]);
    }

    private function findVisibleRecord(int $id, FlowCenterRequestContext $context): ?array
    {
        if ($id <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, creator_user_id, assignee_user_id, title, description, priority, status, due_date, created_at, updated_at
             FROM flowcenter_tasks
             WHERE id = ? AND company_id = ?
             LIMIT 1'
        );
        $stmt->execute([$id, $context->companyId]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        if ($context->role === 'manager') {
            return $row;
        }

        $creatorUserId = (int)$row['creator_user_id'];
        $assigneeUserId = $row['assignee_user_id'] !== null ? (int)$row['assignee_user_id'] : null;

        return ($creatorUserId === $context->userId || $assigneeUserId === $context->userId) ? $row : null;
    }

    private function canMutateRecord(array $record, FlowCenterRequestContext $context): bool
    {
        if ($context->role === 'manager') {
            return true;
        }

        $creatorUserId = (int)$record['creator_user_id'];
        $assigneeUserId = $record['assignee_user_id'] !== null ? (int)$record['assignee_user_id'] : null;

        return $creatorUserId === $context->userId || $assigneeUserId === $context->userId;
    }

    private function normalizeRecord(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'creator_user_id' => (int)$row['creator_user_id'],
            'assignee_user_id' => $row['assignee_user_id'] !== null ? (int)$row['assignee_user_id'] : null,
            'title' => (string)$row['title'],
            'description' => (string)($row['description'] ?? ''),
            'priority' => (string)$row['priority'],
            'status' => (string)$row['status'],
            'due_date' => $row['due_date'],
            'created_at' => (string)$row['created_at'],
            'updated_at' => (string)$row['updated_at'],
        ];
    }

    private function nullableText(mixed $value): ?string
    {
        $text = trim((string)$value);
        return $text === '' ? null : $text;
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $intValue = (int)$value;
        return $intValue > 0 ? $intValue : null;
    }
}
