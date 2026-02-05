<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class EmployeeController
{
    private function normalizeEmployee(array $row): array
    {
        return [
            'id' => (int)$row['member_id'],
            'member_id' => (int)$row['member_id'],
            'user_id' => isset($row['user_id']) ? (int)$row['user_id'] : null,
            'name' => (string)$row['name'],
            'title' => (string)$row['title'],
            'department' => (string)$row['department'],
            'email' => (string)$row['email'],
            'phone' => (string)$row['phone'],
            'status' => (string)$row['status'],
            'role' => (string)$row['role'],
            'username' => isset($row['username']) ? (string)$row['username'] : '',
            'user_status' => isset($row['user_status']) ? (int)$row['user_status'] : null,
            'tenant_id' => isset($row['tenant_id']) ? (string)$row['tenant_id'] : '',
        ];
    }

    private function findByMemberId(int $memberId): ?array
    {
        $stmt = db()->prepare('SELECT e.id, e.member_id, e.user_id, e.name, e.title, e.department, e.email, e.phone, e.status, e.role, u.username, u.status AS user_status, u.tenant_id FROM project_b_employees e LEFT JOIN users u ON u.id = e.user_id AND u.tenant_id = ? WHERE e.member_id = ? LIMIT 1');
        $stmt->execute(['project_b', $memberId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function resolveNextMemberId(): int
    {
        $stmt = db()->query('SELECT MAX(member_id) AS max_id FROM project_b_employees');
        $row = $stmt->fetch();
        $max = $row ? (int)$row['max_id'] : 0;
        return $max + 1;
    }

    public function list(Request $request, Response $response): void
    {
        $stmt = db()->prepare('SELECT e.id, e.member_id, e.user_id, e.name, e.title, e.department, e.email, e.phone, e.status, e.role, u.username, u.status AS user_status, u.tenant_id FROM project_b_employees e LEFT JOIN users u ON u.id = e.user_id AND u.tenant_id = ? ORDER BY e.id ASC');
        $stmt->execute(['project_b']);
        $rows = $stmt->fetchAll();
        $data = array_map(fn ($row) => $this->normalizeEmployee($row), $rows ?: []);
        $response->json($data);
    }

    public function create(Request $request, Response $response): void
    {
        $name = trim((string)($request->body['name'] ?? ''));
        $email = trim((string)($request->body['email'] ?? ''));
        if ($name === '' || $email === '') {
            $response->json(['success' => false, 'message' => 'Missing name or email'], 400);
            return;
        }

        $memberId = (int)($request->body['member_id'] ?? 0);
        if ($memberId <= 0) {
            $memberId = $this->resolveNextMemberId();
        }

        $userId = (int)($request->body['user_id'] ?? 0);
        $stmt = db()->prepare('INSERT INTO project_b_employees (member_id, user_id, name, title, department, email, phone, status, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $memberId,
            $userId > 0 ? $userId : null,
            $name,
            (string)($request->body['title'] ?? ''),
            (string)($request->body['department'] ?? ''),
            $email,
            (string)($request->body['phone'] ?? ''),
            (string)($request->body['status'] ?? 'active'),
            (string)($request->body['role'] ?? 'staff'),
        ]);

        $notifyTitle = '新增成員';
        $notifyContent = "新增成員「{$name}」";
        $stmt = db()->prepare('INSERT INTO project_b_notifications (member_id, type, title, content, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())');
        $stmt->execute([1, 'member', $notifyTitle, $notifyContent]);

        $row = $this->findByMemberId($memberId);
        $response->json($row ? $this->normalizeEmployee($row) : ['id' => $memberId]);
    }

    public function update(Request $request, Response $response): void
    {
        $memberId = (int)($request->body['id'] ?? 0);
        if ($memberId <= 0) {
            $response->json(['success' => false, 'message' => 'Missing id'], 400);
            return;
        }

        $fields = [
            'name' => $request->body['name'] ?? null,
            'title' => $request->body['title'] ?? null,
            'department' => $request->body['department'] ?? null,
            'email' => $request->body['email'] ?? null,
            'phone' => $request->body['phone'] ?? null,
            'status' => $request->body['status'] ?? null,
            'role' => $request->body['role'] ?? null,
            'user_id' => $request->body['user_id'] ?? null,
        ];

        $sets = [];
        $params = [];
        foreach ($fields as $key => $value) {
            if ($value === null) {
                continue;
            }
            $sets[] = "{$key} = ?";
            if ($key === 'user_id') {
                $intValue = (int)$value;
                $params[] = $intValue > 0 ? $intValue : null;
            } else {
                $params[] = (string)$value;
            }
        }

        if ($sets !== []) {
            $params[] = $memberId;
            $sql = 'UPDATE project_b_employees SET ' . implode(', ', $sets) . ' WHERE member_id = ?';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
        }

        $row = $this->findByMemberId($memberId);
        $response->json($row ? $this->normalizeEmployee($row) : ['id' => $memberId]);
    }

    public function delete(Request $request, Response $response): void
    {
        $memberId = (int)($request->body['id'] ?? 0);
        if ($memberId <= 0) {
            $response->json(['success' => false, 'message' => 'Missing id'], 400);
            return;
        }
        $stmt = db()->prepare('DELETE FROM project_b_employees WHERE member_id = ?');
        $stmt->execute([$memberId]);
        $response->json(['success' => true]);
    }
}
