<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use DateInterval;
use DateTimeImmutable;
use Throwable;

final class DineCoreVisitorStatsController
{
    private const TRACKING_QUERY_KEY = 'k';
    private const TRACKING_QUERY_VALUE = '9d2f';
    private const SOURCE_TAG_TAGGED = 'tagged';
    private const SOURCE_TAG_DIRECT = 'direct';
    private const ALLOWED_SOURCE_TAGS = [
        self::SOURCE_TAG_TAGGED,
        self::SOURCE_TAG_DIRECT,
    ];

    public function track(Request $request, Response $response): void
    {
        $rawPath = (string)($request->body['path'] ?? $request->body['currentPath'] ?? '/');
        $rawSearch = (string)($request->body['search'] ?? '');

        $path = $this->normalizeTrackedPath($rawPath);
        $sourceTag = $this->resolveSourceTag($rawPath, $rawSearch);
        $ipAddress = $this->resolveClientIp();

        if ($ipAddress === '') {
            $response->error('VISITOR_IP_REQUIRED', 'VISITOR_IP_REQUIRED', 422);
            return;
        }

        try {
            $today = (new DateTimeImmutable('now'))->format('Y-m-d');
            $stmt = db()->prepare(
                'INSERT INTO site_visit_daily
                    (visit_date, ip_address, path, source_tag, visit_count, first_visited_at, last_visited_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 1, NOW(), NOW(), NOW(), NOW())
                 ON DUPLICATE KEY UPDATE
                    visit_count = visit_count + 1,
                    last_visited_at = NOW(),
                    updated_at = NOW()'
            );
            $stmt->execute([$today, $ipAddress, $path, $sourceTag]);

            $response->ok([
                'visitDate' => $today,
                'path' => $path,
                'sourceTag' => $sourceTag,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'VISITOR_STATS_TRACK_FAILED');
        }
    }

    public function staffIndex(Request $request, Response $response): void
    {
        $context = $this->requireSuperAdminContext($request, $response);
        if ($context === null) {
            return;
        }

        $range = $this->normalizeRange((string)($request->query['range'] ?? 'today'));

        try {
            $startDate = $this->resolveRangeStartDate($range);
            $stmt = db()->prepare(
                'SELECT visit_date, ip_address, path, source_tag, visit_count, first_visited_at, last_visited_at
                 FROM site_visit_daily
                 WHERE visit_date >= ?
                 ORDER BY visit_date DESC, last_visited_at DESC, id DESC'
            );
            $stmt->execute([$startDate]);

            $rows = array_map(
                fn (array $row): array => [
                    'visitDate' => (string)($row['visit_date'] ?? ''),
                    'ipAddress' => (string)($row['ip_address'] ?? ''),
                    'path' => (string)($row['path'] ?? ''),
                    'sourceTag' => $this->normalizeStoredSourceTag((string)($row['source_tag'] ?? '')),
                    'visitCount' => (int)($row['visit_count'] ?? 0),
                    'firstVisitedAt' => (string)($row['first_visited_at'] ?? ''),
                    'lastVisitedAt' => (string)($row['last_visited_at'] ?? ''),
                ],
                $stmt->fetchAll() ?: []
            );

            $response->ok([
                'range' => $range,
                'rows' => $rows,
            ]);
        } catch (Throwable $error) {
            $response->internal($error->getMessage() !== '' ? $error->getMessage() : 'VISITOR_STATS_LOAD_FAILED');
        }
    }

    private function requireSuperAdminContext(Request $request, Response $response): ?array
    {
        $token = $this->resolveTokenFromRequest($request);
        if ($token === '') {
            $response->error('STAFF_SESSION_REQUIRED', 'STAFF_SESSION_REQUIRED', 401);
            return null;
        }

        $stmt = db()->prepare(
            'SELECT u.id AS user_id, u.tenant_id, u.username
             FROM user_tokens t
             JOIN users u ON u.id = t.user_id
             WHERE t.token = ? AND t.revoked_at IS NULL AND u.status = 1
             LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row) {
            $response->error('STAFF_SESSION_REQUIRED', 'STAFF_SESSION_REQUIRED', 401);
            return null;
        }

        if (!$this->isDineCoreSuperAdmin($row)) {
            $response->error('STAFF_ROLE_FORBIDDEN', 'STAFF_ROLE_FORBIDDEN', 403);
            return null;
        }

        return $row;
    }

    private function isDineCoreSuperAdmin(array $user): bool
    {
        return (string)($user['tenant_id'] ?? '') === 'dineCore'
            && (string)($user['username'] ?? '') === 'tako';
    }

    private function normalizeTrackedPath(string $rawPath): string
    {
        $path = parse_url(trim($rawPath), PHP_URL_PATH) ?: '/';
        $path = trim($path);

        if ($path === '') {
            return '/';
        }

        if (!str_starts_with($path, '/')) {
            $path = '/' . $path;
        }

        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }

        return $path === '' ? '/' : $path;
    }

    private function resolveSourceTag(string $rawPath, string $rawSearch): string
    {
        $queryString = '';
        $pathQuery = parse_url(trim($rawPath), PHP_URL_QUERY);
        if (is_string($pathQuery) && $pathQuery !== '') {
            $queryString = $pathQuery;
        } else {
            $queryString = ltrim(trim($rawSearch), '?');
        }

        parse_str($queryString, $query);
        $tagValue = trim((string)($query[self::TRACKING_QUERY_KEY] ?? ''));

        return $tagValue === self::TRACKING_QUERY_VALUE
            ? self::SOURCE_TAG_TAGGED
            : self::SOURCE_TAG_DIRECT;
    }

    private function normalizeStoredSourceTag(string $sourceTag): string
    {
        return in_array($sourceTag, self::ALLOWED_SOURCE_TAGS, true)
            ? $sourceTag
            : self::SOURCE_TAG_DIRECT;
    }

    private function resolveClientIp(): string
    {
        $candidates = [
            $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
            $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
            $_SERVER['REMOTE_ADDR'] ?? '',
        ];

        foreach ($candidates as $candidate) {
            $parts = array_map('trim', explode(',', (string)$candidate));
            foreach ($parts as $part) {
                if ($part !== '' && filter_var($part, FILTER_VALIDATE_IP)) {
                    return $part;
                }
            }
        }

        return '';
    }

    private function resolveTokenFromRequest(Request $request): string
    {
        $authHeader = (string)($request->headers['Authorization'] ?? $request->headers['authorization'] ?? '');
        if (stripos($authHeader, 'bearer ') === 0) {
            return trim(substr($authHeader, 7));
        }

        return trim((string)($request->query['token'] ?? ''));
    }

    private function normalizeRange(string $range): string
    {
        return match (trim($range)) {
            '7d' => '7d',
            '30d' => '30d',
            default => 'today',
        };
    }

    private function resolveRangeStartDate(string $range): string
    {
        $today = new DateTimeImmutable('today');

        return match ($range) {
            '7d' => $today->sub(new DateInterval('P6D'))->format('Y-m-d'),
            '30d' => $today->sub(new DateInterval('P29D'))->format('Y-m-d'),
            default => $today->format('Y-m-d'),
        };
    }
}
