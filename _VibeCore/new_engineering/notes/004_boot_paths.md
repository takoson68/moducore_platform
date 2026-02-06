# Observation

觀察對象：platform 內 boot / bootstrap 的引用關係
實際行為描述：frontend/index.html 以 <script type="module" src="/src/main.js"> 載入 main.js，main.js 呼叫 `boot`（src/app/boot/boot.js）；backend/public/router.php 以 require 進入 public/api.php，api.php 以 require 進入 src/bootstrap.php
出現位置：platform/frontend/index.html；platform/frontend/src/main.js；platform/frontend/src/app/boot/boot.js；platform/backend/public/router.php；platform/backend/public/api.php；platform/backend/src/bootstrap.php
重複次數：2
目前未觀察到的情況：platform 內未觀察到其他 boot 或 bootstrap 引用關係
