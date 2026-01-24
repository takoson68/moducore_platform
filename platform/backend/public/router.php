<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($path === '/health' || str_starts_with($path, '/api')) {
    require __DIR__ . '/api.php';
    return;
}

$fullPath = __DIR__ . $path;
if (is_file($fullPath)) {
    return false;
}

require __DIR__ . '/index.html';
