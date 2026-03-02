<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterContextAware;
use App\FlowCenter\Auth\FlowCenterManagerContextAware;
use App\FlowCenter\Auth\FlowCenterRequestContext;

final class FlowCenterAnnouncementController
{
    use FlowCenterContextAware;
    use FlowCenterManagerContextAware {
        requireManagerContext as private requireManager;
    }

    public function list(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $stmt = db()->prepare(
            'SELECT id, title, content, published_at, created_at, updated_at
             FROM flowcenter_announcements
             WHERE company_id = ?
             ORDER BY COALESCE(published_at, created_at) DESC, id DESC'
        );
        $stmt->execute([$context->companyId]);
        $rows = $stmt->fetchAll() ?: [];

        $response->ok(array_map(fn (array $row) => $this->normalizeRecord($row), $rows));
    }

    public function detail(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $record = $this->findCompanyRecord((int)($request->query['id'] ?? 0), $context->companyId);
        if ($record === null) {
            $response->notFound('Announcement not found');
            return;
        }

        $response->ok($this->normalizeRecord($record));
    }

    public function create(Request $request, Response $response): void
    {
        $context = $this->requireManager($request, $response);
        if ($context === null) {
            return;
        }

        $title = trim((string)($request->body['title'] ?? ''));
        $content = trim((string)($request->body['content'] ?? ''));
        if ($title === '' || $content === '') {
            $response->validation('Missing title or content');
            return;
        }

        $publishNow = (bool)($request->body['publish_now'] ?? true);
        $stmt = db()->prepare(
            'INSERT INTO flowcenter_announcements
                (company_id, author_user_id, title, content, published_at)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $context->companyId,
            $context->userId,
            $title,
            $content,
            $publishNow ? date('Y-m-d H:i:s') : null,
        ]);

        $record = $this->findCompanyRecord((int)db()->lastInsertId(), $context->companyId);
        $response->ok($record ? $this->normalizeRecord($record) : null, 201);
    }

    public function update(Request $request, Response $response): void
    {
        $context = $this->requireManager($request, $response);
        if ($context === null) {
            return;
        }

        $id = (int)($request->body['id'] ?? 0);
        $record = $this->findCompanyRecord($id, $context->companyId);
        if ($record === null) {
            $response->notFound('Announcement not found');
            return;
        }

        $title = trim((string)($request->body['title'] ?? $record['title']));
        $content = trim((string)($request->body['content'] ?? $record['content']));
        if ($title === '' || $content === '') {
            $response->validation('Missing title or content');
            return;
        }

        $publishNow = array_key_exists('publish_now', $request->body)
            ? (bool)$request->body['publish_now']
            : ($record['published_at'] !== null);

        $stmt = db()->prepare(
            'UPDATE flowcenter_announcements
             SET title = ?, content = ?, published_at = ?
             WHERE id = ? AND company_id = ?'
        );
        $stmt->execute([
            $title,
            $content,
            $publishNow ? ($record['published_at'] ?: date('Y-m-d H:i:s')) : null,
            $id,
            $context->companyId,
        ]);

        $updated = $this->findCompanyRecord($id, $context->companyId);
        $response->ok($updated ? $this->normalizeRecord($updated) : null);
    }

    public function delete(Request $request, Response $response): void
    {
        $context = $this->requireManager($request, $response);
        if ($context === null) {
            return;
        }

        $id = (int)($request->body['id'] ?? 0);
        if ($id <= 0) {
            $response->validation('Missing announcement id');
            return;
        }

        $stmt = db()->prepare('DELETE FROM flowcenter_announcements WHERE id = ? AND company_id = ?');
        $stmt->execute([$id, $context->companyId]);
        $response->ok(['deleted' => $stmt->rowCount() > 0]);
    }

    private function findCompanyRecord(int $id, string $companyId): ?array
    {
        if ($id <= 0) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, title, content, published_at, created_at, updated_at
             FROM flowcenter_announcements
             WHERE id = ? AND company_id = ?
             LIMIT 1'
        );
        $stmt->execute([$id, $companyId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function normalizeRecord(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'title' => (string)$row['title'],
            'content' => (string)$row['content'],
            'published_at' => $row['published_at'],
            'created_at' => (string)$row['created_at'],
            'updated_at' => (string)$row['updated_at'],
        ];
    }
}
