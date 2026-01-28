<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class NotificationController
{
    private function resolveMemberId(Request $request): int
    {
        $memberId = (int)($request->query['member_id'] ?? $request->body['member_id'] ?? 0);
        return $memberId > 0 ? $memberId : 1;
    }

    public function list(Request $request, Response $response): void
    {
        $memberId = $this->resolveMemberId($request);
        $stmt = db()->prepare('SELECT id, type, title, content, is_read, created_at FROM project_b_notifications WHERE member_id = ? ORDER BY id DESC');
        $stmt->execute([$memberId]);
        $rows = $stmt->fetchAll() ?: [];
        $items = array_map(fn ($row) => [
            'id' => (int)$row['id'],
            'type' => (string)$row['type'],
            'title' => (string)$row['title'],
            'content' => (string)$row['content'],
            'created_at' => (string)$row['created_at'],
            'read' => (bool)$row['is_read'],
        ], $rows);
        $response->json($items);
    }

    public function create(Request $request, Response $response): void
    {
        $memberId = $this->resolveMemberId($request);
        $title = trim((string)($request->body['title'] ?? ''));
        if ($title === '') {
            $response->json(['success' => false, 'message' => 'Missing title'], 400);
            return;
        }
        $stmt = db()->prepare('INSERT INTO project_b_notifications (member_id, type, title, content, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())');
        $stmt->execute([
            $memberId,
            (string)($request->body['type'] ?? 'system'),
            $title,
            (string)($request->body['content'] ?? ''),
        ]);
        $response->json(['success' => true, 'id' => (int)db()->lastInsertId()]);
    }

    public function markRead(Request $request, Response $response): void
    {
        $id = (int)($request->query['id'] ?? $request->body['id'] ?? 0);
        if ($id <= 0) {
            $response->json(['success' => false, 'message' => 'Missing id'], 400);
            return;
        }
        $stmt = db()->prepare('UPDATE project_b_notifications SET is_read = 1, read_at = NOW() WHERE id = ?');
        $stmt->execute([$id]);
        $response->json(['success' => true]);
    }

    public function clear(Request $request, Response $response): void
    {
        $memberId = $this->resolveMemberId($request);
        $stmt = db()->prepare('DELETE FROM project_b_notifications WHERE member_id = ?');
        $stmt->execute([$memberId]);
        $response->json(['success' => true]);
    }
}
