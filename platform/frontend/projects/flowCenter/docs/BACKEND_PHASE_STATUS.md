## BACKEND_PHASE_STATUS（唯一真實來源）

### 目前階段
Phase B5

### 下一個允許階段
後端 MVP 完成

### blockedByCore
false

### 階段時間線
- Phase B0：已完成 | Migration: 已建立 flowCenter 基礎 SQL | API: 新增 /api/flowcenter/health 與統一 response helper | Auth Context: 未開始 | Core Modified: 否 | Files: platform/backend/sql/flowcenter/001_flowcenter_base.sql, platform/backend/src/Controllers/FlowCenterHealthController.php, platform/backend/src/Core/Response.php, platform/backend/src/Core/Router.php, platform/backend/public/api.php, platform/backend/src/Controllers/HealthController.php, platform/backend/src/routes.php
- Phase B1：已完成 | Migration: 已建立 flowCenter user profile / auth context SQL | API: 新增 /api/flowcenter/session | Auth Context: 已建立 unified resolver 與 controller trait | Core Modified: 否 | Files: platform/backend/sql/flowcenter/002_flowcenter_auth_context.sql, platform/backend/src/FlowCenter/Auth/FlowCenterRequestContext.php, platform/backend/src/FlowCenter/Auth/FlowCenterRequestContextResolver.php, platform/backend/src/FlowCenter/Auth/FlowCenterContextAware.php, platform/backend/src/Controllers/FlowCenterSessionController.php, platform/backend/src/routes.php
- Phase B2：已完成 | Migration: 沿用 B0 資料表 | API: 新增 leave / purchase list/detail/create/update | Auth Context: employee-only 與 ownership 已落地 | Core Modified: 否 | Files: platform/backend/src/FlowCenter/Auth/FlowCenterEmployeeContextAware.php, platform/backend/src/Controllers/FlowCenterLeaveController.php, platform/backend/src/Controllers/FlowCenterPurchaseController.php, platform/backend/src/routes.php
- Phase B3：已完成 | Migration: 沿用 B0 approvals 資料表 | API: 新增 approval pending / decide | Auth Context: manager-only 已落地 | Core Modified: 否 | Files: platform/backend/src/FlowCenter/Auth/FlowCenterManagerContextAware.php, platform/backend/src/Controllers/FlowCenterApprovalController.php, platform/backend/src/routes.php
- Phase B4：已完成 | Migration: 沿用 B0 announcements / tasks 資料表 | API: 新增 dashboard/summary | Auth Context: 沿用 unified flowCenter context | Core Modified: 否 | Files: platform/backend/src/Controllers/FlowCenterDashboardController.php, platform/backend/src/routes.php
- Phase B5：已完成 | Migration: 沿用 B0 announcements / tasks 資料表 | API: 新增 announcements / tasks 最小 CRUD | Auth Context: announcement manager-only，task 依 role 與可見性控管 | Core Modified: 否 | Files: platform/backend/src/Controllers/FlowCenterAnnouncementController.php, platform/backend/src/Controllers/FlowCenterTaskController.php, platform/backend/src/routes.php

### 阻塞項
- (none)
