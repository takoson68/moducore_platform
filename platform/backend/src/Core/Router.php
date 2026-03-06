<?php
declare(strict_types=1);

namespace App\Core;

final class Router
{
    private array $routes = [];

    public function add(string $method, string $path, callable|string $handler): void
    {
        $method = strtoupper($method);
        $this->routes[$method][$path] = $handler;
    }

    public function dispatch(Request $request, Response $response): void
    {
        $method = $request->method;
        $path = $request->path;

        $handler = $this->routes[$method][$path] ?? null;
        if ($handler === null) {
            $response->notFound(sprintf('Route Not Found: %s %s', $method, $path));
            return;
        }

        if (is_string($handler)) {
            [$class, $methodName] = explode('@', $handler, 2);
            $fqcn = 'App\\Controllers\\' . $class;
            if (!class_exists($fqcn) || !method_exists($fqcn, $methodName)) {
                $response->internal('Handler Not Found');
                return;
            }
            $instance = new $fqcn();
            $instance->{$methodName}($request, $response);
            return;
        }

        $handler($request, $response);
    }
}
