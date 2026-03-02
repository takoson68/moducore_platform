<?php
declare(strict_types=1);

namespace App\Core;

final class Response
{
    public function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function ok(mixed $payload = null, int $status = 200): void
    {
        $this->json([
            'ok' => true,
            'data' => $payload,
        ], $status);
    }

    public function error(string $code, string $message, int $status): void
    {
        $this->json([
            'ok' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ], $status);
    }

    public function unauthorized(string $message = 'Unauthorized'): void
    {
        $this->error('UNAUTHORIZED', $message, 401);
    }

    public function forbidden(string $message = 'Forbidden'): void
    {
        $this->error('FORBIDDEN', $message, 403);
    }

    public function notFound(string $message = 'Not Found'): void
    {
        $this->error('NOT_FOUND', $message, 404);
    }

    public function validation(string $message = 'Validation Failed'): void
    {
        $this->error('VALIDATION_FAILED', $message, 422);
    }

    public function internal(string $message = 'Internal Server Error'): void
    {
        $this->error('INTERNAL_ERROR', $message, 500);
    }
}
