<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
final class TaskController
{
    private function fetchEmployees(): array
    {
        $stmt = db()->query('SELECT member_id, name, email FROM project_b_employees ORDER BY member_id ASC');
        $rows = $stmt->fetchAll();
        return array_map(fn ($row) => [
            'id' => (int)$row['member_id'],
            'member_id' => (int)$row['member_id'],
            'name' => (string)$row['name'],
            'email' => (string)$row['email'],
        ], $rows ?: []);
    }

    private function mapEmployeeNames(array $employees): array
    {
        $map = [];
        foreach ($employees as $emp) {
            $map[(int)$emp['id']] = (string)($emp['name'] ?: $emp['email']);
        }
        return $map;
    }

    private function fetchTaskMembers(array $taskIds): array
    {
        if ($taskIds === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($taskIds), '?'));
        $stmt = db()->prepare("SELECT task_id, member_id FROM project_b_task_members WHERE task_id IN ($placeholders)");
        $stmt->execute($taskIds);
        $rows = $stmt->fetchAll();
        $grouped = [];
        foreach ($rows as $row) {
            $taskId = (int)$row['task_id'];
            $memberId = (int)$row['member_id'];
            $grouped[$taskId][] = $memberId;
        }
        return $grouped;
    }

    private function fetchTaskEvents(int $taskId): array
    {
        $stmt = db()->prepare('SELECT member_id, event_type, content, created_at FROM project_b_task_events WHERE task_id = ? ORDER BY id ASC');
        $stmt->execute([$taskId]);
        return $stmt->fetchAll() ?: [];
    }

    private function buildTaskDetail(int $id, array $employees, array $employeeNames): ?array
    {
        $stmt = db()->prepare('SELECT id, member_id, publisher_member_id, assignee_member_id, title, description, status, priority, due_date FROM project_b_tasks WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $memberMap = $this->fetchTaskMembers([$id]);
        $memberIds = $memberMap[$id] ?? [];
        $members = array_values(array_filter(array_map(fn ($mid) => $this->memberName((int)$mid, $employeeNames), $memberIds)));
        $eventsRaw = $this->fetchTaskEvents($id);
        $events = array_map(function ($event) use ($employeeNames) {
            $memberId = $event['member_id'] !== null ? (int)$event['member_id'] : null;
            return [
                'type' => (string)$event['event_type'],
                'user' => $memberId ? $this->memberName($memberId, $employeeNames) : '系統',
                'text' => (string)$event['content'],
                'created_at' => (string)$event['created_at'],
            ];
        }, $eventsRaw);

        $publisherId = (int)$row['publisher_member_id'];
        $assigneeId = $row['assignee_member_id'] !== null ? (int)$row['assignee_member_id'] : null;

        return [
            'id' => (int)$row['id'],
            'title' => (string)$row['title'],
            'desc' => (string)$row['description'],
            'status' => (string)$row['status'],
            'priority' => (string)$row['priority'],
            'due_date' => $row['due_date'],
            'publisher' => $this->memberName($publisherId, $employeeNames),
            'publisher_id' => $publisherId > 0 ? $publisherId : null,
            'assignee' => $assigneeId ? $this->memberName($assigneeId, $employeeNames) : '',
            'assignee_id' => $assigneeId,
            'members' => $members,
            'events' => $events,
        ];
    }

    private function memberName(int $memberId, array $employeeNames): string
    {
        return $employeeNames[$memberId] ?? '';
    }

    private function resolveMemberIdByName(string $name): ?int
    {
        $name = trim($name);
        if ($name === '') {
            return null;
        }
        $stmt = db()->prepare('SELECT member_id FROM project_b_employees WHERE name = ? OR email = ? LIMIT 1');
        $stmt->execute([$name, $name]);
        $row = $stmt->fetch();
        if ($row) {
            return (int)$row['member_id'];
        }
        return null;
    }

    public function list(Request $request, Response $response): void
    {
        $employees = $this->fetchEmployees();
        $employeeNames = $this->mapEmployeeNames($employees);

        $stmt = db()->query('SELECT id, member_id, publisher_member_id, assignee_member_id, title, description, status, priority, due_date FROM project_b_tasks ORDER BY id DESC');
        $rows = $stmt->fetchAll();
        $taskIds = array_map(fn ($row) => (int)$row['id'], $rows ?: []);
        $memberMap = $this->fetchTaskMembers($taskIds);

        $tasks = [];
        foreach ($rows as $row) {
            $taskId = (int)$row['id'];
            $publisherId = (int)$row['publisher_member_id'];
            $assigneeId = $row['assignee_member_id'] !== null ? (int)$row['assignee_member_id'] : null;
            $memberIds = $memberMap[$taskId] ?? [];
            $members = array_values(array_filter(array_map(fn ($id) => $this->memberName((int)$id, $employeeNames), $memberIds)));
            $tasks[] = [
                'id' => $taskId,
                'title' => (string)$row['title'],
                'desc' => (string)$row['description'],
                'status' => (string)$row['status'],
                'priority' => (string)$row['priority'],
                'due_date' => $row['due_date'],
                'publisher' => $this->memberName($publisherId, $employeeNames),
                'publisher_id' => $publisherId > 0 ? $publisherId : null,
                'assignee' => $assigneeId ? $this->memberName($assigneeId, $employeeNames) : '',
                'assignee_id' => $assigneeId,
                'members' => $members,
            ];
        }

        $response->json([
            'tasks' => $tasks,
            'employees' => $employees,
        ]);
    }

    public function detail(Request $request, Response $response): void
    {
        $id = (int)($request->query['id'] ?? 0);
        if ($id <= 0) {
            $response->json(null);
            return;
        }

        $employees = $this->fetchEmployees();
        $employeeNames = $this->mapEmployeeNames($employees);
        $payload = $this->buildTaskDetail($id, $employees, $employeeNames);
        $response->json($payload);
    }

    public function create(Request $request, Response $response): void
    {
        $title = trim((string)($request->body['title'] ?? ''));
        if ($title === '') {
            $response->json(['success' => false, 'message' => 'Missing title'], 400);
            return;
        }

        $publisherId = (int)($request->body['publisher_id'] ?? 0);
        if ($publisherId <= 0) {
            $publisherId = $this->resolveMemberIdByName((string)($request->body['publisher'] ?? '')) ?? 0;
        }
        $assigneeId = (int)($request->body['assignee_id'] ?? 0);
        if ($assigneeId <= 0) {
            $assigneeId = $this->resolveMemberIdByName((string)($request->body['assignee'] ?? '')) ?? 0;
        }

        $stmt = db()->prepare('INSERT INTO project_b_tasks (member_id, publisher_member_id, assignee_member_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $publisherId > 0 ? $publisherId : 1,
            $publisherId > 0 ? $publisherId : 1,
            $assigneeId > 0 ? $assigneeId : null,
            $title,
            (string)($request->body['desc'] ?? $request->body['description'] ?? ''),
            (string)($request->body['status'] ?? 'todo'),
            (string)($request->body['priority'] ?? 'medium'),
            $request->body['due_date'] ?? null,
        ]);

        $taskId = (int)db()->lastInsertId();
        $members = $request->body['members'] ?? [];
        if (is_array($members) && $members !== []) {
            $insert = db()->prepare('INSERT INTO project_b_task_members (task_id, member_id, role) VALUES (?, ?, ?)');
            foreach ($members as $memberId) {
                $value = (int)$memberId;
                if ($value <= 0) {
                    continue;
                }
                $insert->execute([$taskId, $value, 'participant']);
            }
        }

        $employees = $this->fetchEmployees();
        $employeeNames = $this->mapEmployeeNames($employees);
        $payload = $this->buildTaskDetail($taskId, $employees, $employeeNames);
        $response->json($payload);
    }

    public function update(Request $request, Response $response): void
    {
        $id = (int)($request->body['id'] ?? 0);
        if ($id <= 0) {
            $response->json(['success' => false, 'message' => 'Missing id'], 400);
            return;
        }

        $fields = [
            'title' => $request->body['title'] ?? null,
            'description' => $request->body['desc'] ?? $request->body['description'] ?? null,
            'status' => $request->body['status'] ?? null,
            'priority' => $request->body['priority'] ?? null,
            'due_date' => $request->body['due_date'] ?? null,
        ];

        $publisherId = $request->body['publisher_id'] ?? null;
        $assigneeId = $request->body['assignee_id'] ?? null;

        $sets = [];
        $params = [];
        foreach ($fields as $key => $value) {
            if ($value === null) {
                continue;
            }
            $sets[] = "{$key} = ?";
            $params[] = $value;
        }

        if ($publisherId !== null) {
            $sets[] = 'publisher_member_id = ?';
            $params[] = (int)$publisherId;
        }
        if ($assigneeId !== null) {
            $sets[] = 'assignee_member_id = ?';
            $params[] = $assigneeId !== '' ? (int)$assigneeId : null;
        }

        if ($sets !== []) {
            $params[] = $id;
            $sql = 'UPDATE project_b_tasks SET ' . implode(', ', $sets) . ' WHERE id = ?';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
        }

        if (isset($request->body['members']) && is_array($request->body['members'])) {
            $delete = db()->prepare('DELETE FROM project_b_task_members WHERE task_id = ?');
            $delete->execute([$id]);
            $insert = db()->prepare('INSERT INTO project_b_task_members (task_id, member_id, role) VALUES (?, ?, ?)');
            foreach ($request->body['members'] as $memberId) {
                $value = (int)$memberId;
                if ($value <= 0) {
                    continue;
                }
                $insert->execute([$id, $value, 'participant']);
            }
        }

        $employees = $this->fetchEmployees();
        $employeeNames = $this->mapEmployeeNames($employees);
        $payload = $this->buildTaskDetail($id, $employees, $employeeNames);
        $response->json($payload);
    }

    public function addEvent(Request $request, Response $response): void
    {
        $taskId = (int)($request->body['task_id'] ?? 0);
        if ($taskId <= 0) {
            $response->json(['success' => false, 'message' => 'Missing task_id'], 400);
            return;
        }

        $type = (string)($request->body['type'] ?? 'note');
        $content = trim((string)($request->body['text'] ?? ''));
        if ($content === '') {
            $response->json(['success' => false, 'message' => 'Missing content'], 400);
            return;
        }

        $memberId = $this->resolveMemberIdByName((string)($request->body['user'] ?? ''));

        $stmt = db()->prepare('INSERT INTO project_b_task_events (task_id, member_id, event_type, content, created_at) VALUES (?, ?, ?, ?, NOW())');
        $stmt->execute([$taskId, $memberId, $type, $content]);

        $employees = $this->fetchEmployees();
        $employeeNames = $this->mapEmployeeNames($employees);
        $payload = $this->buildTaskDetail($taskId, $employees, $employeeNames);
        $response->json($payload);
    }

    public function delete(Request $request, Response $response): void
    {
        $id = (int)($request->body['id'] ?? 0);
        if ($id <= 0) {
            $response->json(['success' => false, 'message' => 'Missing id'], 400);
            return;
        }

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('DELETE FROM project_b_task_events WHERE task_id = ?');
            $stmt->execute([$id]);
            $stmt = $pdo->prepare('DELETE FROM project_b_task_members WHERE task_id = ?');
            $stmt->execute([$id]);
            $stmt = $pdo->prepare('DELETE FROM project_b_tasks WHERE id = ?');
            $stmt->execute([$id]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        $response->json(['success' => true]);
    }
}
