<?php
declare(strict_types=1);

use App\Core\Router;

/** @var Router $router */
$router->add('GET', '/health', 'HealthController@ping');
$router->add('POST', '/api/login', 'AuthController@login');
$router->add('POST', '/api/logout', 'AuthController@logout');
$router->add('GET', '/api/session', 'AuthController@session');
$router->add('GET', '/api/restore-session', 'AuthController@session');

$router->add('GET', '/api/employees/list', 'EmployeeController@list');
$router->add('POST', '/api/employees/create', 'EmployeeController@create');
$router->add('POST', '/api/employees/update', 'EmployeeController@update');
$router->add('POST', '/api/employees/delete', 'EmployeeController@delete');

$router->add('GET', '/api/tasks/list', 'TaskController@list');
$router->add('GET', '/api/tasks/detail', 'TaskController@detail');
$router->add('POST', '/api/tasks/create', 'TaskController@create');
$router->add('POST', '/api/tasks/update', 'TaskController@update');
$router->add('POST', '/api/tasks/messages_create', 'TaskController@addEvent');
$router->add('POST', '/api/tasks/delete', 'TaskController@delete');

$router->add('GET', '/api/vote/list', 'VoteController@list');
$router->add('GET', '/api/vote/detail', 'VoteController@detail');
$router->add('POST', '/api/vote/create', 'VoteController@create');
$router->add('POST', '/api/vote/cast', 'VoteController@cast');
$router->add('POST', '/api/vote/open_result', 'VoteController@openResult');
$router->add('POST', '/api/vote/delete', 'VoteController@delete');

$router->add('GET', '/api/notifications', 'NotificationController@list');
$router->add('POST', '/api/notifications', 'NotificationController@create');
$router->add('POST', '/api/notifications/read', 'NotificationController@markRead');
$router->add('POST', '/api/notifications/clear', 'NotificationController@clear');
