<?php
declare(strict_types=1);

namespace App\FlowCenter\Auth;

final class FlowCenterRequestContext
{
    public function __construct(
        public readonly int $userId,
        public readonly string $role,
        public readonly string $companyId,
        public readonly string $token,
        public readonly string $username,
        public readonly string $displayName,
    ) {
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'role' => $this->role,
            'company_id' => $this->companyId,
            'token' => $this->token,
            'username' => $this->username,
            'display_name' => $this->displayName,
        ];
    }
}
