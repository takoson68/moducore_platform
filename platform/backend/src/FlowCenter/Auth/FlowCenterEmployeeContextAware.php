<?php
declare(strict_types=1);

namespace App\FlowCenter\Auth;

use App\Core\Request;
use App\Core\Response;

trait FlowCenterEmployeeContextAware
{
    use FlowCenterContextAware;

    protected function requireEmployeeContext(Request $request, Response $response): ?FlowCenterRequestContext
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return null;
        }

        if ($context->role !== 'employee') {
            $response->forbidden('Employee role required');
            return null;
        }

        return $context;
    }
}
