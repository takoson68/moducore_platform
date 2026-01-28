//---------------------這邊加載的檔案都是全局共用，屬於核心程式------------------------
// 加載 Vue
import * as Vue from "vue";

import { mdBoxApp } from "@/components/mdBoxApp.js";

//  下載圖片
function screenshot() {
  let name = window.prompt("請輸入檔案名稱", "");
  mdBoxApp.scaleBox(1);
  if (!!name) {
    var yes = confirm("是否一併下載json？");

    if (yes) {
      TakePic("boxLi", name);
      mdBoxApp.downloadJSON(mdBoxApp.treeBox, name + ".json");
    } else {
      TakePic("boxLi", name);
    }
  }
}

function TakePic(who, name) {
  html2canvas(document.getElementById(who)).then(function (canvas) {
    document.body.appendChild(canvas);
    let a = document.createElement("a");
    a.href = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    a.download = name + ".png";
    a.click();
  });
}

//- 因為我將呼叫函式寫在html所以這邊必須將screenshot掛載到全域
window.screenshot = screenshot;

 