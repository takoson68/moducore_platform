<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Core\Request;
use App\Core\Response;
use App\Core\Router;

$request = Request::fromGlobals();
$response = new Response();

$router = new Router();
require __DIR__ . '/../src/routes.php';

try {
    $router->dispatch($request, $response);
} catch (Throwable $e) {
    $response->json([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage(),
    ], 500);
}
