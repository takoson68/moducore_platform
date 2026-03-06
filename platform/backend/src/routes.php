<?php
declare(strict_types=1);

use App\Core\Router;

/** @var Router $router */
$router->add('GET', '/health', 'HealthController@ping');
$router->add('GET', '/api/dinecore/entry-context', 'DineCoreGuestApiController@entryContext');
$router->add('GET', '/api/dinecore/menu', 'DineCoreGuestApiController@menu');
$router->add('GET', '/api/dinecore/carts', 'DineCoreGuestApiController@carts');
$router->add('POST', '/api/dinecore/cart/add-item', 'DineCoreGuestApiController@addItem');
$router->add('POST', '/api/dinecore/cart/change-item-quantity', 'DineCoreGuestApiController@changeItemQuantity');
$router->add('POST', '/api/dinecore/cart/update-item', 'DineCoreGuestApiController@updateItem');
$router->add('PATCH', '/api/dinecore/cart/update-item', 'DineCoreGuestApiController@updateItem');
$router->add('GET', '/api/dinecore/checkout-summary', 'DineCoreGuestApiController@checkoutSummary');
$router->add('GET', '/api/dinecore/checkout-success', 'DineCoreGuestApiController@checkoutSuccess');
$router->add('POST', '/api/dinecore/checkout-submit', 'DineCoreGuestApiController@checkoutSubmit');
$router->add('GET', '/api/dinecore/order-tracker', 'DineCoreGuestApiController@orderTracker');
$router->add('GET', '/api/dinecore/staff/tables', 'DineCoreStaffApiController@staffTables');
$router->add('GET', '/api/dinecore/staff/counter/orders', 'DineCoreStaffApiController@counterOrders');
$router->add('GET', '/api/dinecore/staff/counter/order-detail', 'DineCoreStaffApiController@counterOrderDetail');
$router->add('POST', '/api/dinecore/staff/counter/update-order-status', 'DineCoreStaffApiController@counterUpdateOrderStatus');
$router->add('POST', '/api/dinecore/staff/counter/update-payment-status', 'DineCoreStaffApiController@counterUpdatePaymentStatus');
$router->add('GET', '/api/dinecore/staff/kitchen/orders', 'DineCoreStaffApiController@kitchenOrders');
$router->add('POST', '/api/dinecore/staff/kitchen/update-order-status', 'DineCoreStaffApiController@kitchenUpdateOrderStatus');
$router->add('GET', '/api/dinecore/staff/reports/summary', 'DineCoreStaffApiController@reportsSummary');
$router->add('GET', '/api/dinecore/staff/reports/orders', 'DineCoreStaffApiController@reportsOrders');
$router->add('POST', '/api/dinecore/staff/sessions/clear', 'DineCoreStaffApiController@clearGuestSessions');
$router->add('GET', '/api/dinecore/staff/sessions/clear', 'DineCoreStaffApiController@clearGuestSessions');
// Backward/edge compatibility: tolerate singular path and trailing slash.
$router->add('POST', '/api/dinecore/staff/session/clear', 'DineCoreStaffApiController@clearGuestSessions');
$router->add('GET', '/api/dinecore/staff/session/clear', 'DineCoreStaffApiController@clearGuestSessions');
$router->add('POST', '/api/dinecore/staff/sessions/clear/', 'DineCoreStaffApiController@clearGuestSessions');
$router->add('GET', '/api/dinecore/staff/sessions/clear/', 'DineCoreStaffApiController@clearGuestSessions');
$router->add('GET', '/api/dinecore/staff/audit-close/summary', 'DineCoreStaffApiController@auditCloseSummary');
$router->add('GET', '/api/dinecore/staff/audit-close/history', 'DineCoreStaffApiController@auditCloseHistory');
$router->add('POST', '/api/dinecore/staff/audit-close/close', 'DineCoreStaffApiController@closeBusinessDate');
$router->add('POST', '/api/dinecore/staff/audit-close/unlock', 'DineCoreStaffApiController@unlockBusinessDate');
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
