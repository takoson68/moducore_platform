<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class VoteController
{
    private function fetchEmployees(): array
    {
        $stmt = db()->query('SELECT member_id, name, email FROM project_b_employees ORDER BY member_id ASC');
        $rows = $stmt->fetchAll();
        $map = [];
        foreach ($rows as $row) {
            $memberId = (int)$row['member_id'];
            $map[$memberId] = (string)($row['name'] ?: $row['email']);
        }
        return $map;
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
        return $row ? (int)$row['member_id'] : null;
    }

    private function buildVotePayload(array $vote, array $options, array $ballots, array $employeeNames): array
    {
        $voteId = (int)$vote['id'];
        $publisherId = (int)$vote['member_id'];

        $optionMap = [];
        foreach ($options as $opt) {
            if ((int)$opt['vote_id'] !== $voteId) {
                continue;
            }
            $optionMap[(int)$opt['id']] = [
                'id' => (int)$opt['id'],
                'label' => (string)$opt['label'],
                'votes' => 0,
                'voters' => [],
            ];
        }

        $votesReceived = 0;
        foreach ($ballots as $ballot) {
            if ((int)$ballot['vote_id'] !== $voteId) {
                continue;
            }
            $optionId = (int)$ballot['option_id'];
            if (!isset($optionMap[$optionId])) {
                continue;
            }
            $optionMap[$optionId]['votes'] += 1;
            $votesReceived += 1;
            $memberId = (int)$ballot['member_id'];
            $label = $employeeNames[$memberId] ?? (string)$memberId;
            if ((int)$vote['anonymous'] !== 1) {
                $optionMap[$optionId]['voters'][] = $label;
            }
        }

        return [
            'id' => $voteId,
            'title' => (string)$vote['title'],
            'description' => (string)$vote['description'],
            'publisher' => $employeeNames[$publisherId] ?? '未指定',
            'allowMultiple' => (bool)$vote['allow_multiple'],
            'anonymous' => (bool)$vote['anonymous'],
            'status' => (string)$vote['status'],
            'rule' => [
                'mode' => (string)$vote['rule_mode'],
                'deadline' => $vote['rule_deadline'],
                'totalVoters' => (int)$vote['rule_total_voters'],
            ],
            'votesReceived' => $votesReceived,
            'options' => array_values($optionMap),
        ];
    }

    private function fetchVotesPayload(?int $targetId = null): array
    {
        $employeeNames = $this->fetchEmployees();

        if ($targetId !== null) {
            $stmt = db()->prepare('SELECT * FROM project_b_votes WHERE id = ? LIMIT 1');
            $stmt->execute([$targetId]);
            $votes = $stmt->fetchAll();
        } else {
            $stmt = db()->query('SELECT * FROM project_b_votes ORDER BY id DESC');
            $votes = $stmt->fetchAll();
        }

        $voteIds = array_map(fn ($row) => (int)$row['id'], $votes ?: []);
        $options = [];
        $ballots = [];
        if ($voteIds !== []) {
            $placeholders = implode(',', array_fill(0, count($voteIds), '?'));
            $stmt = db()->prepare("SELECT id, vote_id, label FROM project_b_vote_options WHERE vote_id IN ($placeholders) ORDER BY id ASC");
            $stmt->execute($voteIds);
            $options = $stmt->fetchAll() ?: [];

            $stmt = db()->prepare("SELECT vote_id, option_id, member_id FROM project_b_vote_ballots WHERE vote_id IN ($placeholders)");
            $stmt->execute($voteIds);
            $ballots = $stmt->fetchAll() ?: [];
        }

        $payloads = array_map(fn ($vote) => $this->buildVotePayload($vote, $options, $ballots, $employeeNames), $votes ?: []);
        return $payloads;
    }

    public function list(Request $request, Response $response): void
    {
        $votes = $this->fetchVotesPayload();
        $response->json(['votes' => $votes]);
    }

    public function detail(Request $request, Response $response): void
    {
        $id = (int)($request->query['id'] ?? 0);
        if ($id <= 0) {
            $response->json(null);
            return;
        }
        $votes = $this->fetchVotesPayload($id);
        $response->json($votes[0] ?? null);
    }

    public function create(Request $request, Response $response): void
    {
        $title = trim((string)($request->body['title'] ?? ''));
        if ($title === '') {
            $response->json(['success' => false, 'message' => 'Missing title'], 400);
            return;
        }

        $publisherId = (int)($request->body['member_id'] ?? 0);
        if ($publisherId <= 0) {
            $publisherId = $this->resolveMemberIdByName((string)($request->body['publisher'] ?? '')) ?? 1;
        }

        $rule = $request->body['rule'] ?? [];
        $stmt = db()->prepare('INSERT INTO project_b_votes (member_id, title, description, allow_multiple, anonymous, status, rule_mode, rule_deadline, rule_total_voters) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $publisherId,
            $title,
            (string)($request->body['description'] ?? ''),
            (int)($request->body['allowMultiple'] ?? 0),
            (int)($request->body['anonymous'] ?? 0),
            (string)($request->body['status'] ?? 'open'),
            (string)($rule['mode'] ?? 'time'),
            $rule['deadline'] ?? null,
            (int)($rule['totalVoters'] ?? 0),
        ]);

        $voteId = (int)db()->lastInsertId();
        $options = $request->body['options'] ?? [];
        if (is_array($options)) {
            $insert = db()->prepare('INSERT INTO project_b_vote_options (vote_id, label, sort_order) VALUES (?, ?, ?)');
            $order = 1;
            foreach ($options as $option) {
                $label = trim((string)($option['label'] ?? ''));
                if ($label === '') {
                    continue;
                }
                $insert->execute([$voteId, $label, $order++]);
            }
        }

        $payloads = $this->fetchVotesPayload($voteId);
        $response->json(['vote' => $payloads[0] ?? null]);
    }

    public function cast(Request $request, Response $response): void
    {
        $voteId = (int)($request->body['vote_id'] ?? 0);
        if ($voteId <= 0) {
            $response->json(['success' => false, 'message' => 'Missing vote_id'], 400);
            return;
        }

        $memberId = (int)($request->body['user_id'] ?? 0);
        if ($memberId <= 0) {
            $memberId = $this->resolveMemberIdByName((string)($request->body['user'] ?? '')) ?? 0;
        }
        if ($memberId <= 0) {
            $memberId = 1;
        }

        $selections = $request->body['selections'] ?? [];
        if (!is_array($selections) || $selections === []) {
            $response->json(['success' => false, 'message' => 'Missing selections'], 400);
            return;
        }

        $insert = db()->prepare('INSERT IGNORE INTO project_b_vote_ballots (vote_id, option_id, member_id, created_at) VALUES (?, ?, ?, NOW())');
        foreach ($selections as $optionId) {
            $optionId = (int)$optionId;
            if ($optionId <= 0) {
                continue;
            }
            $insert->execute([$voteId, $optionId, $memberId]);
        }

        $payloads = $this->fetchVotesPayload($voteId);
        $response->json(['vote' => $payloads[0] ?? null]);
    }

    public function openResult(Request $request, Response $response): void
    {
        $voteId = (int)($request->body['vote_id'] ?? 0);
        if ($voteId <= 0) {
            $response->json(['success' => false, 'message' => 'Missing vote_id'], 400);
            return;
        }
        $stmt = db()->prepare('UPDATE project_b_votes SET status = ? WHERE id = ?');
        $stmt->execute(['closed', $voteId]);
        $payloads = $this->fetchVotesPayload($voteId);
        $response->json(['vote' => $payloads[0] ?? null]);
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
            $stmt = $pdo->prepare('DELETE FROM project_b_vote_ballots WHERE vote_id = ?');
            $stmt->execute([$id]);
            $stmt = $pdo->prepare('DELETE FROM project_b_vote_options WHERE vote_id = ?');
            $stmt->execute([$id]);
            $stmt = $pdo->prepare('DELETE FROM project_b_votes WHERE id = ?');
            $stmt->execute([$id]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        $response->json(['success' => true]);
    }
}
