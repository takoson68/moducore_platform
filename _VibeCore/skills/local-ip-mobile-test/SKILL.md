---
name: local-ip-mobile-test
description: 將本機服務開成同網段手機可測（取得 LAN IP、啟動 0.0.0.0 服務、回報可用 URL 與連線檢查結果）。
---

# Local IP Mobile Test

## 何時使用

- 使用者要用手機測試本機網站
- 需要提供可直接開啟的 IP 網址

## 固定流程

1. 取得 LAN IP（通常 `en0`）
2. 啟動後端服務到 `0.0.0.0:<port>`
   - 例如：`php -S 0.0.0.0:8080 -t public public/router.php`
3. 確認 listen
   - `lsof -iTCP:<port> -sTCP:LISTEN`
4. 本機回測
   - `curl http://<LAN_IP>:<port>/`
   - `curl http://<LAN_IP>:<port>/api/dinecore/entry-context?table_code=A01`
5. 回報手機可用 URL

## 常見阻塞

- 手機與電腦不同 Wi-Fi
- 防火牆阻擋連線
- 服務綁在 `127.0.0.1` 而非 `0.0.0.0`

## 輸出

- LAN IP
- Port
- 可用 URL（首頁 + 主要 API）
- 若失敗，明確指出阻塞點
