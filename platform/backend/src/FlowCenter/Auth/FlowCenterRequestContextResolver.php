<?php
declare(strict_types=1);

namespace App\FlowCenter\Auth;

use App\Core\Request;
use RuntimeException;

final class FlowCenterRequestContextResolver
{
    public function resolve(Request $request): FlowCenterRequestContext
    {
        $token = $this->resolveToken($request);
        if ($token === '') {
            throw new RuntimeException('Missing token');
        }

        $stmt = db()->prepare(
            'SELECT u.id, u.username, p.company_id, p.role, p.display_name
             FROM user_tokens t
             JOIN users u ON u.id = t.user_id
             JOIN flowcenter_user_profiles p ON p.user_id = u.id
             WHERE t.token = ?
               AND t.revoked_at IS NULL
               AND u.status = 1
               AND p.status = 1
             LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new RuntimeException('Invalid session');
        }

        $role = (string)($row['role'] ?? '');
        $companyId = trim((string)($row['company_id'] ?? ''));
        if ($role === '' || $companyId === '') {
            throw new RuntimeException('Incomplete request context');
        }

        return new FlowCenterRequestContext(
            userId: (int)$row['id'],
            role: $role,
            companyId: $companyId,
            token: $token,
            username: (string)$row['username'],
            displayName: (string)($row['display_name'] ?? $row['username']),
        );
    }

    private function resolveToken(Request $request): string
    {
        $authHeader = (string)($request->headers['Authorization'] ?? $request->headers['authorization'] ?? '');
        if (stripos($authHeader, 'bearer ') === 0) {
            return trim(substr($authHeader, 7));
        }

        return trim((string)($request->query['token'] ?? ''));
    }
}
