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

    public function unauthorized(string $message = '未授權'): void
    {
        $this->error('UNAUTHORIZED', $message, 401);
    }

    public function forbidden(string $message = '禁止存取'): void
    {
        $this->error('FORBIDDEN', $message, 403);
    }

    public function notFound(string $message = '找不到資料'): void
    {
        $this->error('NOT_FOUND', $message, 404);
    }

    public function validation(string $message = '資料驗證失敗'): void
    {
        $this->error('VALIDATION_FAILED', $message, 422);
    }

    public function internal(string $message = '伺服器內部錯誤'): void
    {
        $this->error('INTERNAL_ERROR', $message, 500);
    }
}
