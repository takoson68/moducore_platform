<?php
declare(strict_types=1);

use App\Core\Router;

/** @var Router $router */
$router->add('GET', '/health', 'HealthController@ping');
