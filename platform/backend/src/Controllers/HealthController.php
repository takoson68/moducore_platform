<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class HealthController
{
    public function ping(Request $request, Response $response): void
    {
        $response->json([
            'ok' => true,
            'time' => date('c'),
        ]);
    }
}
