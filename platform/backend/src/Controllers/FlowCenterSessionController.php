<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\FlowCenter\Auth\FlowCenterContextAware;

final class FlowCenterSessionController
{
    use FlowCenterContextAware;

    public function show(Request $request, Response $response): void
    {
        $context = $this->requireFlowCenterContext($request, $response);
        if ($context === null) {
            return;
        }

        $response->ok([
            'authenticated' => true,
            'context' => $context->toArray(),
        ]);
    }
}
