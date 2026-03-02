<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use PDO;

final class FlowCenterHealthController
{
    public function status(Request $request, Response $response): void
    {
        $connection = db();
        $sqlPath = BASE_PATH . '/sql/flowcenter/001_flowcenter_base.sql';

        $response->ok([
            'service' => 'flowCenter-backend',
            'db' => [
                'connected' => $connection instanceof PDO,
                'driver' => $connection->getAttribute(PDO::ATTR_DRIVER_NAME),
            ],
            'schema' => [
                'base_sql' => is_file($sqlPath),
                'path' => 'platform/backend/sql/flowcenter/001_flowcenter_base.sql',
            ],
            'phase' => 'B0',
        ]);
    }
}
