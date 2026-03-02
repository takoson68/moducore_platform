<?php
declare(strict_types=1);

use App\Core\Router;

/** @var Router $router */
$router->add('GET', '/health', 'HealthController@ping');
$router->add('GET', '/api/flowcenter/health', 'FlowCenterHealthController@status');
$router->add('GET', '/api/flowcenter/session', 'FlowCenterSessionController@show');
$router->add('GET', '/api/flowcenter/dashboard/summary', 'FlowCenterDashboardController@summary');
$router->add('GET', '/api/flowcenter/announcements', 'FlowCenterAnnouncementController@list');
$router->add('GET', '/api/flowcenter/announcements/detail', 'FlowCenterAnnouncementController@detail');
$router->add('POST', '/api/flowcenter/announcements', 'FlowCenterAnnouncementController@create');
$router->add('PATCH', '/api/flowcenter/announcements', 'FlowCenterAnnouncementController@update');
$router->add('POST', '/api/flowcenter/announcements/delete', 'FlowCenterAnnouncementController@delete');
$router->add('GET', '/api/flowcenter/tasks', 'FlowCenterTaskController@list');
$router->add('GET', '/api/flowcenter/tasks/detail', 'FlowCenterTaskController@detail');
$router->add('POST', '/api/flowcenter/tasks', 'FlowCenterTaskController@create');
$router->add('PATCH', '/api/flowcenter/tasks', 'FlowCenterTaskController@update');
$router->add('POST', '/api/flowcenter/tasks/delete', 'FlowCenterTaskController@delete');
$router->add('GET', '/api/flowcenter/leave', 'FlowCenterLeaveController@list');
$router->add('GET', '/api/flowcenter/leave/detail', 'FlowCenterLeaveController@detail');
$router->add('POST', '/api/flowcenter/leave', 'FlowCenterLeaveController@create');
$router->add('PATCH', '/api/flowcenter/leave', 'FlowCenterLeaveController@update');
$router->add('GET', '/api/flowcenter/purchase', 'FlowCenterPurchaseController@list');
$router->add('GET', '/api/flowcenter/purchase/detail', 'FlowCenterPurchaseController@detail');
$router->add('POST', '/api/flowcenter/purchase', 'FlowCenterPurchaseController@create');
$router->add('PATCH', '/api/flowcenter/purchase', 'FlowCenterPurchaseController@update');
$router->add('GET', '/api/flowcenter/approval/pending', 'FlowCenterApprovalController@pending');
$router->add('POST', '/api/flowcenter/approval/decide', 'FlowCenterApprovalController@decide');
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
