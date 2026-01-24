<?php
declare(strict_types=1);

use App\Core\Router;

/** @var Router $router */
$router->add('GET', '/health', 'HealthController@ping');
$router->add('POST', '/api/login', 'AuthController@login');
$router->add('POST', '/api/logout', 'AuthController@logout');
$router->add('GET', '/api/session', 'AuthController@session');
$router->add('GET', '/api/restore-session', 'AuthController@session');
