<?php
declare(strict_types=1);

namespace App\FlowCenter\Auth;

use App\Core\Request;
use App\Core\Response;
use RuntimeException;

trait FlowCenterContextAware
{
    protected function requireFlowCenterContext(Request $request, Response $response): ?FlowCenterRequestContext
    {
        $resolver = new FlowCenterRequestContextResolver();

        try {
            return $resolver->resolve($request);
        } catch (RuntimeException $e) {
            $response->unauthorized($e->getMessage());
            return null;
        }
    }
}
