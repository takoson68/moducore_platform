<?php
declare(strict_types=1);

namespace App\FlowCenter\Auth;

use App\Core\Request;
use App\Core\Response;

trait FlowCenterManagerContextAware
{
    use FlowCenterContextAware;

    protected function requireManagerContext(Request $request, Response $response): ?FlowCenterRequestContext
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return null;
        }

        if ($context->role !== 'manager') {
            $response->forbidden('Manager role required');
            return null;
        }

        return $context;
    }
}
