# Backend (Minimal MVC for API)

## Structure
- `public/api.php` entry point
- `src/Controllers` controllers
- `src/Core` request/response/router
- `src/routes.php` route definitions

## Run
Use PHP's built-in server:

```powershell
cd f:\GitHub\moducore_platform\backend
php -S localhost:8080 -t public public/router.php
```

Test:

```powershell
curl http://localhost:8080/health
```
