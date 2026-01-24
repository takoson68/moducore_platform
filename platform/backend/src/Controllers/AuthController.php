<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class AuthController
{
    private const MOCK_USERNAME = 'demo';
    private const MOCK_PASSWORD = 'demo123';
    private const MOCK_TOKEN = 'mock-token-123';

    private function mockUser(): array
    {
        return [
            'id' => 1,
            'name' => 'Demo User',
            'email' => 'demo@example.com',
        ];
    }

    public function login(Request $request, Response $response): void
    {
        $project = (string)($request->headers['X-Project'] ?? $request->headers['x-project'] ?? '');
        if ($project === '') {
            $response->json([
                'success' => false,
                'message' => 'Missing project',
            ], 400);
            return;
        }

        $username = trim((string)($request->body['username'] ?? ''));
        $password = trim((string)($request->body['password'] ?? ''));

        if ($username === self::MOCK_USERNAME && $password === self::MOCK_PASSWORD) {
            $response->json([
                'success' => true,
                'user' => $this->mockUser(),
                'token' => self::MOCK_TOKEN,
            ]);
            return;
        }

        $response->json([
            'success' => false,
            'message' => 'Invalid username or password',
        ], 401);
    }

    public function logout(Request $request, Response $response): void
    {
        $project = (string)($request->headers['X-Project'] ?? $request->headers['x-project'] ?? '');
        if ($project === '') {
            $response->json([
                'success' => false,
                'message' => 'Missing project',
            ], 400);
            return;
        }

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
                'message' => 'Missing project',
            ], 400);
            return;
        }

        $authHeader = (string)($request->headers['Authorization'] ?? $request->headers['authorization'] ?? '');
        $token = '';
        if (stripos($authHeader, 'bearer ') === 0) {
            $token = trim(substr($authHeader, 7));
        }
        if ($token === '') {
            $token = (string)($request->query['token'] ?? '');
        }

        $isLoggedIn = $token !== '' && $token === self::MOCK_TOKEN;

        $response->json([
            'success' => true,
            'authenticated' => $isLoggedIn,
            'user' => $isLoggedIn ? $this->mockUser() : null,
            'token' => $isLoggedIn ? self::MOCK_TOKEN : null,
        ]);
    }
}
