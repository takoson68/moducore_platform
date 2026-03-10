<?php
declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

// 後端一律以台灣時間作為預設應用層時區，避免 PHP 端日期判斷落到 UTC。
date_default_timezone_set('Asia/Taipei');

require_once BASE_PATH . '/src/lib/db.php';
$composerAutoload = BASE_PATH . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = BASE_PATH . '/src/';

    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($file)) {
        require $file;
    }
});

// Basic JSON response header for API usage.
header('Content-Type: application/json; charset=utf-8');
