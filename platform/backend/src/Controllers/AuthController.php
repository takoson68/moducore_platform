<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class AuthController
{
    private function buildUserPayload(array $user): array
    {
        return [
            'id' => (int)$user['id'],
            'tenant_id' => (string)$user['tenant_id'],
            'username' => (string)$user['username'],
            'name' => (string)($user['name'] ?? $user['username']),
            'role' => (string)($user['role'] ?? ''),
            'company_id' => (string)($user['company_id'] ?? ''),
            'is_super_admin' => $this->isDineCoreSuperAdmin($user),
        ];
    }

    private function isDineCoreSuperAdmin(array $user): bool
    {
        return (string)($user['tenant_id'] ?? '') === 'dineCore'
            && (string)($user['username'] ?? '') === 'tako';
    }

    private function resolveFlowCenterProfile(int $userId): ?array
    {
        $stmt = db()->prepare(
            'SELECT role, company_id, display_name
             FROM flowcenter_user_profiles
             WHERE user_id = ? AND status = 1
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function resolveDineCoreProfile(int $userId): ?array
    {
        $stmt = db()->prepare(
            'SELECT role, display_name
             FROM dinecore_staff_profiles
             WHERE user_id = ? AND status = 1
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    private function resolveTenantIds(string $project): array
    {
        $project = trim($project);
        if ($project === '') {
            return [];
        }

        $tenantIds = [$project];
        $normalized = str_replace('-', '_', $project);
        if ($normalized !== $project) {
            $tenantIds[] = $normalized;
        }

        return $tenantIds;
    }

    private function findUserForLogin(array $tenantIds, string $username, string $password): ?array
    {
        if ($tenantIds === []) {
            return null;
        }

        $placeholders = implode(',', array_fill(0, count($tenantIds), '?'));
        $sql = "SELECT id, tenant_id, username, status FROM users WHERE tenant_id IN ($placeholders) AND username = ? AND password = ? AND status = 1 LIMIT 1";
        $params = array_merge($tenantIds, [$username, $password]);

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    private function resolveEmployeeRole(string $project, int $userId): ?string
    {
        $project = trim($project);
        if ($project === 'project-b' || $project === 'project_b') {
            $stmt = db()->prepare('SELECT role FROM project_b_employees WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            if ($row && isset($row['role'])) {
                return (string)$row['role'];
            }
        }

        if ($project === 'flowCenter' || $project === 'flow_center') {
            $profile = $this->resolveFlowCenterProfile($userId);
            if ($profile && isset($profile['role'])) {
                return (string)$profile['role'];
            }
        }

        if ($project === 'dineCore' || $project === 'dine_core') {
            $profile = $this->resolveDineCoreProfile($userId);
            if ($profile && isset($profile['role'])) {
                return (string)$profile['role'];
            }
        }

        return null;
    }

    private function resolveEmployeeName(string $project, int $userId): ?string
    {
        $project = trim($project);
        if ($project === 'project-b' || $project === 'project_b') {
            $stmt = db()->prepare('SELECT name FROM project_b_employees WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            if ($row && isset($row['name'])) {
                return (string)$row['name'];
            }
        }

        if ($project === 'flowCenter' || $project === 'flow_center') {
            $profile = $this->resolveFlowCenterProfile($userId);
            if ($profile && isset($profile['display_name'])) {
                return (string)$profile['display_name'];
            }
        }

        if ($project === 'dineCore' || $project === 'dine_core') {
            $profile = $this->resolveDineCoreProfile($userId);
            if ($profile && isset($profile['display_name'])) {
                return (string)$profile['display_name'];
            }
        }

        return null;
    }

    private function resolveEmployeeCompanyId(string $project, int $userId): ?string
    {
        $project = trim($project);
        if ($project === 'flowCenter' || $project === 'flow_center') {
            $profile = $this->resolveFlowCenterProfile($userId);
            if ($profile && isset($profile['company_id'])) {
                return (string)$profile['company_id'];
            }
        }

        return null;
    }

    private function resolveTokenFromRequest(Request $request): string
    {
        $authHeader = (string)($request->headers['Authorization'] ?? $request->headers['authorization'] ?? '');
        if (stripos($authHeader, 'bearer ') === 0) {
            return trim(substr($authHeader, 7));
        }

        return (string)($request->query['token'] ?? '');
    }

    private function createTokenForUser(array $user): string
    {
        $token = bin2hex(random_bytes(32));
        $stmt = db()->prepare('INSERT INTO user_tokens (user_id, token, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([(int)$user['id'], $token]);

        return $token;
    }

    private function revokeToken(string $token): void
    {
        if ($token === '') {
            return;
        }

        $stmt = db()->prepare('UPDATE user_tokens SET revoked_at = NOW() WHERE token = ? AND revoked_at IS NULL');
        $stmt->execute([$token]);
    }

    private function findUserForSession(string $token): ?array
    {
        if ($token === '') {
            return null;
        }

        $stmt = db()->prepare('SELECT u.id, u.tenant_id, u.username, u.status FROM users u JOIN user_tokens t ON t.user_id = u.id WHERE t.token = ? AND t.revoked_at IS NULL AND u.status = 1 LIMIT 1');
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function login(Request $request, Response $response): void
    {
        $project = (string)($request->headers['X-Project'] ?? $request->headers['x-project'] ?? '');
        if ($project === '') {
            $response->json([
                'success' => false,
                'message' => '缺少專案識別',
            ], 400);
            return;
        }

        $username = trim((string)($request->body['username'] ?? ''));
        $password = trim((string)($request->body['password'] ?? ''));

        if ($username === '' || $password === '') {
            $response->json([
                'success' => false,
                'message' => '缺少帳號或密碼',
            ], 400);
            return;
        }

        $tenantIds = $this->resolveTenantIds($project);
        $user = $this->findUserForLogin($tenantIds, $username, $password);
        if ($user) {
            $role = $this->resolveEmployeeRole($project, (int)$user['id']);
            $name = $this->resolveEmployeeName($project, (int)$user['id']);
            $companyId = $this->resolveEmployeeCompanyId($project, (int)$user['id']);
            $token = $this->createTokenForUser($user);
            $response->json([
                'success' => true,
                'user' => $this->buildUserPayload(array_merge($user, ['role' => $role, 'name' => $name, 'company_id' => $companyId])),
                'token' => $token,
            ]);
            return;
        }

        $response->json([
            'success' => false,
            'message' => '帳號或密碼錯誤',
        ], 401);
    }

    public function logout(Request $request, Response $response): void
    {
        $project = (string)($request->headers['X-Project'] ?? $request->headers['x-project'] ?? '');
        if ($project === '') {
            $response->json([
                'success' => false,
                'message' => '缺少專案識別',
            ], 400);
            return;
        }

        $token = $this->resolveTokenFromRequest($request);
        $this->revokeToken($token);

        $response->json([
            'success' => true,
        ]);
    }

    public function session(Request $request, Response $response): void
    {
        $project = (string)($request->headers['X-Project'] ?? $request->headers['x-project'] ?? '');
        if ($project === '') {
            $response->json([
                'success' => false,
                'message' => '缺少專案識別',
            ], 400);
            return;
        }

        $token = $this->resolveTokenFromRequest($request);
        $user = $this->findUserForSession($token);
        $isLoggedIn = $user !== null;
        $role = $user ? $this->resolveEmployeeRole($project, (int)$user['id']) : null;
        $name = $user ? $this->resolveEmployeeName($project, (int)$user['id']) : null;
        $companyId = $user ? $this->resolveEmployeeCompanyId($project, (int)$user['id']) : null;

        $response->json([
            'success' => true,
            'authenticated' => $isLoggedIn,
            'user' => $isLoggedIn ? $this->buildUserPayload(array_merge($user, ['role' => $role, 'name' => $name, 'company_id' => $companyId])) : null,
            'token' => $isLoggedIn ? $token : null,
        ]);
    }
}
