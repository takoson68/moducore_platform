
import { typeStatus,colorsArr } from './data.js';
import { folders } from './folders.js';
import { listpapa } from './listpapa.js';
import { _linkMaker } from './_linkMaker.js';

var mdBoxApp = new Vue({
  el: "#mtkBox",
  components: {
    folders, listpapa 
  },
  data: {
    urlBox: "URL_head",
    mdData: "",
    mrkData: [],
    pointBox: [],
    pointList: [],
    point2az: {}, // 把點轉換為A-Z的編碼
    treeBox: {}, // 樹狀結構
    nbm: 0,
    a2z: "ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz",
    listBoxData: [], // 紀錄每個物件的dom位置
    typeStatus: typeStatus,
    // colorLinkBox: ['#bbbbbb','#353531','#ffd500','#ffbe0b','#ff9505','#fc7232','#f12939','#8c1c13','#ff006e','#e20074','#ffa6c1','#8338ec','#9381ff','#1B96F1','#3772ff','#00509d','#6fffe9','#38a3a5','#8ac926','#007200','#004b23','#c9a690'],
    colorLinkBox: colorsArr,
    colorLink: "#353531",
    scalMen: [1, 0.8, 0.7, 0.55, 0.35, 0.25],
    scalPick: 1,
    // allPointBox: [],
    cPint: [],
    requestLastTime: null, //- 延遲監聽
    dragStop: false,
    pathStyleSet: {
      // lineBox: 0,
      // color: "",
      offset: {},
      nb: "",
      d: "",
      s2: "", //起點
      ss2: [],//起點絕對位置
      e2: "", //終點
      ee2: [],//終點絕對位置
      wh: "", //對象寬高（正方形）
      lineTheme: {
        st: 1, //上1 右2 下3 左4
        ed: 1,
        // o_d: '', //自動產生的線段
        // n_d: '', //製作的線段
        p: [], //折點
      },
      useLine: "",
    },
    useSetLine: "",
    showPathSet: false,
    setText: `+ 主機名稱1 // 主機ＩＰ // 攻擊單位行為 // 攻擊行為內容
+ 主機名稱2 // 主機ＩＰ // 攻擊單位行為 // 攻擊行為內容
+ 主機名稱3 // 主機ＩＰ // 攻擊單位行為 // 攻擊行為內容
+ 主機名稱4 // 主機ＩＰ // 攻擊單位行為 // 攻擊行為內容`,
    setTextIndex: null,
    showText: false,
    // isShowText: false
    allPointList: [], //- 所有節點（對比用）
    WnH: null,
  },
  created: function () {

    this.getMd();
  },
  watch: {
    showPathSet(newV) {
      //-------顯示右下角線段選項時，左邊攻擊路線編輯處新增焦點外框----將其他的g變成半透明----
      let svgEle = document.getElementById("svgBox");
      let nbEle = document.querySelector("." + this.pathStyleSet.nb);
      let g_nbEle = document.querySelector(".g_" + this.pathStyleSet.nb);

      const child = document.getElementById("e_" + this.pathStyleSet.nb); // 取得 div.test
      const parent = child.parentElement; // 取得上一層父元素
      if (newV) {
        nbEle.style.border = "1px solid red";
        nbEle.style.marginLeft = "-1px";
        //- 右邊集中焦點將其他線段跟文字框半透明顯示
        svgEle.classList.add("focusMe");
        g_nbEle.classList.add("focusEle");
        parent.classList.add("focusEle");
      } else {
        nbEle.style.border = "none";
        nbEle.style.marginLeft = "0";
        //- 右邊恢復正常
        svgEle.classList.remove("focusMe");
        g_nbEle.classList.remove("focusEle");
        parent.classList.remove("focusEle");

        this.pathStyleSet = {
          offset: {},
          nb: "",
          d: "",
          s2: "", //起點絕對位置
          ss2: [],
          e2: "", //終點絕對位置
          ee2: [],
          wh: "", //對象寬高（正方形）
          lineTheme: {
            st: 1, //上1 右2 下3 左4
            ed: 1,
            // o_d: '', //自動產生的線段
            // n_d: '', //製作的線段
            p: [], //折點
          },
          useLine: "",
        }
      }
      // nbEle.focus()
    },
    "pathStyleSet.useLine": function(newVal){
      // console.log(newVal);
      let nb = this.pathStyleSet.nb
      let uu = this.findIdValue(this.treeBox,'nb', nb)
      uu.useLine = newVal
    },
    "pathStyleSet.lineTheme.st": function(newVal){
      let nb = this.pathStyleSet.nb
      let uu = this.findIdValue(this.treeBox,'nb', nb)
      // console.log(uu.lineTheme);
      //??= 是「Nullish 賦值運算子」（ES2021），只有在 null 或 undefined 時才會執行賦值。
      uu.lineTheme ??= {}; //- 等同  uu.lineTheme = uu.lineTheme || {};
      uu.lineTheme.st = newVal
    },
    "pathStyleSet.lineTheme.ed": function(newVal){
      let nb = this.pathStyleSet.nb
      let uu = this.findIdValue(this.treeBox,'nb', nb)
      uu.lineTheme ??= {}; //- 等同  uu.lineTheme = uu.lineTheme || {};
      uu.lineTheme.ed = newVal
    },

  },
  computed: {
    allPointBox() {
      if (!this.treeBox) {
        return false;
      }
      let point = this.traverseData(this.treeBox);
      this.cPint = []; //- 要清暫存的點，不然會一直累積
      let point2 = point.map((e) => e.join());
      point = [...new Set(point2)]; //- 移除重複的點
      let ps = point.map((e) => e.split(","));
      this.allPointList = ps;
      return ps;
    },
    treePointData() {
      //- 重組treeBox 移除重複的點
      // console.log(this.treeBox);
      this.ipPointList();
      return this.flattenData(this.treeBox); //- 扁平化處理
    },
    useTypeState() {
      //- 取得正在使用的 typeStatus
      if (!this.treeBox) {
        return false;
      }
      let data = this.treeBox;
      // 收集所有的folder_type
      let folderTypes = new Set();
      function collectFolderTypes(data) {
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.folder_type && item.folder_type.length > 0) {
              item.folder_type.forEach((type) => {
                folderTypes.add(type);
              });
            }
            if (item.children && item.children.length > 0) {
              collectFolderTypes(item.children);
            }
          });
        }
      }
      collectFolderTypes(data);
      let uniqueFolderTypes = [...folderTypes];
      let typeDD = [];
      uniqueFolderTypes.map((e) => {
        this.typeStatus.forEach((f) => {
          if (f[0] === e) {
            typeDD = [...typeDD, f];
          }
        });
      });
      return typeDD;
    },
  },
  mounted() {
    this.dragWidth();
    this.dragBox();
    this.scaleBox(0.55);
  },
  methods: {
    traverseData(data) {
      // 遞迴歷遍資料並收集 "e" 屬性的值
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.e) {
          this.cPint.push([item.e, item.e2, item.ip]);
        }
        if (item.children && item.children.length > 0) {
          this.traverseData(item.children);
        }
      }
      let pp = [...this.cPint];
      return pp;
    },
    findHostLocation(data, hostname) {
      // 遞迴搜索函式
      function search(data, hostname) {
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          if (item.e === hostname) {
            return item; // 找到了目標項目，返回其起始點和終點
          }
          if (item.children) {
            const result = search(item.children, hostname); // 遞迴搜索子項目
            if (result) {
              return result; // 如果在子項目中找到了目標，直接返回結果
            }
          }
        }
        return null; // 如果未找到目標，返回 null
      }
      // 開始搜索
      const result = search(data, hostname);
      if (result) {
        return result; // 返回找到的位置，以箭頭分隔
      } else {
        return "未找到該主機的位置";
      }
    },
    async getMd() {
      //測試用資料
      // 取得 md.text
      try {
        const response = await fetch("./src/components/mtk2mad/mrk2mad.json");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // 假設這是在 Vue 的 setup 或 composition API 裡
        this.mdData = data;
        this.treeBox = data;
      } catch (error) {
        console.error("Error fetching JSON:", error);
      }
    },
    ipPointList() {
      // 每個物件dom座標
      // 要等dom畫完，執行才抓得到
      this.$nextTick(() => {
        // 先把svg的寬度動態調整為上一層的寬度
        document.getElementById("svgBox").style.width =
          document.getElementById("boxLi").offsetWidth;

        let listBox = {};
        let treePointList = [];

        this.treePointData.forEach((dd) => {
          // console.log(dd);
          if (dd.one && dd.end) {
            return false;
          } else {
            treePointList = [...treePointList, dd];
          }
        });

        // console.log(treePointList);
        treePointList.forEach((e, i) => {
          listBox[e.e2] = this.toPoint(e.e2);
        });

        // 紀錄每個物件的dom位置
        this.listBoxData = listBox;
      });
    },
    toPoint(e) {
      let xyz = document.getElementById("point_" + e);
      let width = Number(xyz.offsetWidth);
      let height = Number(xyz.offsetHeight);
      let x = Number(xyz.offsetLeft);
      let y = Number(xyz.offsetTop);

      this.WnH ??= width;
      // 左上的座標，寬、高
      return [x, y, width, height];
    },
    linkMaker(dd) {
      //- 畫出svg箭頭線段樣式----------使用導入import函式----
      return _linkMaker(dd, this.listBoxData);
    },
    renderArrow(dd, jj) {
      this.$nextTick(() => {
        const linkMaker = this.linkMaker(dd);
        const link = linkMaker.link;

        let this_link = document.querySelector("#path_" + jj);
        // 將路線塞進path
        this_link.setAttribute("d", link);

        //----------下面是灰底文字外框--------------
        const textPos = linkMaker.textPos;
        let t_x = textPos[0];
        let t_y = textPos[1];

        t_x = t_x + 60;
        let ts_y = t_y + 20;

        let this_text = document.querySelector("#text_" + jj);
        let this_rect = document.querySelector("#rect_" + jj);
        let this_text_tspan = document.querySelector("#text_" + jj + "_1");
        let this_text_icon = document.querySelector("#text_" + jj + "_2");
        // let this_text_circle = document.querySelector('#text_'+jj+'_2 circle');

        // let u = this_text.getBoundingClientRect().width
        // let w = this_text_tspan.getBoundingClientRect().width
        //getBoundingClientRect 方法取得的寬度，照畫面顯示的大小改變，這裡要用絕對位置所以不用這個

        if (!this_text) {
          //防呆--如果沒有顯示文字就結束
          return false;
        }
        //getBBox 方法返回一个包含svg元素的最小矩形的坐标对象 上面是相對座標
        let rr = this_text.getBBox().width;
        let nn = this_text_tspan.getBBox().width;

        let setW = rr > nn ? rr : nn;
        let rcX = t_x - setW / 2 - 15;
        let rcY = dd.n == "" ? t_y - 5 : t_y - 25;
        // console.log(setW);
        // let rcD = `M${rcX},${rcY} L180,20 L180,180 L20,180 L20,20`
        // let rcD = `M${rcX},${rcY} h${setW+30} v${60} h${-setW-30} L${rcX},${rcY}`
        if (!!this_text) {
          this_text.setAttribute("x", t_x);
          this_text.setAttribute("y", t_y);
          // this_text_tspan.setAttribute('x', t_x + setuw);
          this_text_tspan.setAttribute("x", t_x);
          this_text_tspan.setAttribute("y", ts_y);
          this_rect.setAttribute("x", rcX);
          this_rect.setAttribute("y", rcY);
          this_rect.setAttribute("width", setW + 30 + "px");
          this_rect.setAttribute(
            "height",
            dd.r == "" || dd.n == "" ? "40px" : "60px"
          );
          // this_rect.setAttribute('d', rcD);
          this_text_icon.style.left = t_x + setW / 2 + 5 + "px";
          this_text_icon.style.top = t_y - 40 + "px";
          // this_text_circle.setAttribute('cx', t_x+setW/2+15);
          // this_text_circle.setAttribute('cy', t_y-30);
        }
      });
    },
    dragBox() {
      const stop = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
        
        // this.showPathSet = false; //原本想要用focus的概念，但是太容易被切換了，所以改成關閉按鈕
      };
      // 拖曳畫布功能
      let x_pos, y_pos, startX, startY, x, y;
      let mdTopng = document.querySelector(".mdTopng");
      let dragDiv = document.querySelector("#printable");
      dragDiv.addEventListener("mousedown", dragStart);
      function dragStart(e) {
        let W_left = mdTopng.offsetWidth + 32; // 計算左邊文字輸入寬度
        // 這邊家16應該是外面有1em padding
        x_pos = dragDiv.scrollLeft;
        y_pos = dragDiv.scrollTop;
        e.preventDefault();
        //記錄點擊相對被點擊物件的座標 // 因為上層有padding所以這邊要加回來
        startX = e.clientX - dragDiv.offsetLeft + W_left;
        startY = e.clientY - dragDiv.offsetTop + 110;
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
        if (this.dragStop) {
          stop();
        }
        //計算出拖曳物件最左上角座標
        x = e.clientX - startX;
        y = e.clientY - startY;
        dragDiv.scrollLeft = x_pos - x;
        dragDiv.scrollTop = y_pos - y;
      }
    },
    dragWidth() {
      // 拖曳調整輸入框大小
      var x_pos, startX;
      let mdTopng = document.querySelector(".mdTopng");
      let dragWidth = document.querySelector(".dragWidth");
      dragWidth.addEventListener("mousedown", dragStart);

      function dragStart(e) {
        x_pos = mdTopng.offsetWidth;
        e.preventDefault();
        //記錄點擊相對被點擊物件的座標
        startX = e.clientX - dragWidth.offsetLeft;
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
        //計算出拖曳物件的距離計算寬度
        let x = e.clientX - startX;
        mdTopng.style.width = x + "px";
      }
      function stop() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }
    },
    scaleBox(t) {
      let scaleBox = document.querySelector("#mtkInit");
      scaleBox.style.transform = `scale(${t})`;
      this.scalPick = t;
    },
    changColorLink(d) {
      this.colorLink = d;
    },
    flattenData(data, result = []) {
      //- 扁平化處理
      for (const item of data) {
        result.push({
          s: item.s,
          e: item.e,
          s2: item.s2,
          e2: item.e2,
          r: item.r,
          n: item.n,
          level: item.level,
          textset: item.textset,
          offset: item.offset,
          nb: item.nb,
          one: item.one || false,
          useLine: item.useLine || 'o_d',
          lineTheme: item.lineTheme || {
            "st": 1,
            "ed": 1,
            "p": []

          },
        });

        if (item.children && item.children.length > 0) {
          this.flattenData(item.children, result);
        }
      }
      return result;
    },
    dragSvgBox(dd, el, useKey) {
      //- 拖曳svg線段跟文字框共用
      let x_pos, y_pos, old_x, old_y, x, y;
      let sc = this.scalPick; //- svg畫面比例
      let dragPath = document.querySelector(el);
      dragPath.addEventListener("mousedown", dragStart);

      function dragStart(e) {
        x_pos = e.clientX;
        y_pos = e.clientY;
        old_x = dd[useKey].x;
        old_y = dd[useKey].y;

        e.preventDefault();
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
        this.dragStop = true;
        //計算出拖曳物件的距離計算寬度
        x = e.clientX - x_pos + old_x;
        y = e.clientY - y_pos + old_y;

        dd[useKey].x = x;
        dd[useKey].y = y;
      }
      function stop() {
        this.dragStop = false;
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }
    },
    pathSet(dd, jj) {
      //---這段是點擊後將左邊輸入框的拉霸調整到紅框顯示位置
      let scrollBar = document.querySelector(".dataListMad");
      let nbEle = document.querySelector("." + dd.nb);
      scrollBar.scrollTop = 0; //- 必須歸零，才部會下次計算時影響元素顯示位置
      scrollBar.scrollTop =
      nbEle.getBoundingClientRect().top - (scrollBar.offsetTop + 200);
      
      this.pathStyleSet = dd
      this.pathStyleSet.jj ??= jj;
      
      // ??= 是「Nullish 合併賦值運算子」，只有在 this.pathStyleSet.lineTheme === null || undefined 時才會賦值。
      let vv = this.toPoint(this.pathStyleSet.s2)
      this.pathStyleSet.ss2 = [vv[0],vv[1]]
      let ww = this.toPoint(this.pathStyleSet.e2)
      this.pathStyleSet.ee2 = [ww[0],ww[1]]

      this.showPathSet = true;
    },
    strokeDasharray(st) {
      let dasharray = "";
      if (st == 1) {
        dasharray = "10,10";
      } else if (st == 2) {
        dasharray = "5,10,5,10";
      } else if (st == 3) {
        dasharray = "5,10,20,10";
      }
      return dasharray;
    },
    setColor(color) {
      console.log(this.pathStyleSet.offset.color);
      this.pathStyleSet.offset.color = color;
    },
    downMan() {
      let name = window.prompt("請輸入檔案名稱", "");
      if (!!name) {
        this.downloadJSON(this.treeBox, name + ".json");
      }
    },
    downloadJSON(jsonData, filename) {
      // 將 JSON 資料轉換為字串
      const jsonString = JSON.stringify(jsonData, null, 2);
      // 建立一個包含 JSON 資料的 Blob
      const blob = new Blob([jsonString], { type: "application/json" });
      // 建立一個 URL 物件，並將 Blob 轉換為 URL
      const url = URL.createObjectURL(blob);

      // 創建一個 <a> 元素
      const a = document.createElement("a");
      // 設置 <a> 元素的 href 屬性為 Blob URL
      a.href = url;
      // 設置 <a> 元素的 download 屬性為指定的檔案名稱
      a.download = filename;
      // 將 <a> 元素插入到 DOM 中
      document.body.appendChild(a);

      // 觸發 <a> 元素的點擊事件，從而觸發下載
      a.click();
      // 後續操作，如清除 Blob URL
      URL.revokeObjectURL(url);
    },
    handleFileInput(event) {
      const file = event.target.files[0]; // 獲取選擇的文件
      const reader = new FileReader(); // 建立 FileReader 物件
      this.treeBox = [];
      this.mdData = [];
      this.treePointData = [];
      this.allPoint = [];
      reader.onload = () => {
        const content = reader.result; // 獲取讀取的內容
        try {
          const jsonData = JSON.parse(content); // 解析 JSON 內容
          this.treeBox = jsonData;
          this.mdData = jsonData;

          // console.log(this.treeBox);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };
      reader.readAsText(file); // 開始讀取文件
    },
    lightenColor(color) {
      //- 增減顏色明度值 -------
      // 解析顏色字串，並轉換為RGB值
      const [r, g, b] = color.match(/\w\w/g).map((hex) => parseInt(hex, 16));
      let pasu = 0.85;
      // 增加RGB值的10%
      const newR = Math.min(255, Math.round(r * pasu));
      const newG = Math.min(255, Math.round(g * pasu));
      const newB = Math.min(255, Math.round(b * pasu));

      // 將新的RGB值轉換為16進位字串，並返回
      return `#${newR.toString(16).padStart(2, "0")}${newG
        .toString(16)
        .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
    },
    openShowText(ii) {
      if (ii == 0) {
        //關閉
      } else if (ii == 1) {
        //送出文字
        this.textToJson();
      }
      this.setTextIndex = null;
      this.showText = !this.showText;
    },
    textToJson() {
      let dataText = this.setText;
      let textArr = dataText.split("+");
      let dataArr = textArr.filter((e) => e !== "");

      console.log(dataArr);
    },
    handleO_d() {
      console.log("O_d");
    },
    handleN_d() {
      console.log("N_d");
    },
    addLinePoint() {
      console.log("addLinePoint");

      let nb = this.pathStyleSet.nb
      let uu = this.findIdValue(this.treeBox,'nb', nb)

      uu.lineTheme ??= {        
        st: 1, //上1 右2 下3 左4
        ed: 1,
        p: [], //折點
      }
      let qq = this.toPoint(this.pathStyleSet.s2)

      let p = uu.lineTheme.p.length==0 ? [[qq[0],qq[1]]] : uu.lineTheme.p
      // console.log(p);
      const lastData = p[p.length - 1];
      const newData = [
        [lastData[0]*1 + 20, lastData[1]*1 + 20]
      ];
      let fal = [...uu.lineTheme.p,...newData]
      uu.lineTheme.p = fal
      this.pathStyleSet.lineTheme.p = fal
      
    },
    removeLinePoint(){
      console.log("removeLinePoint");
      this.pathStyleSet.lineTheme.p.pop();
    },
    useLinePoint() {
      console.log("useLinePoint");
      console.log(this.pathStyleSet);
      this.$forceUpdate();
    },
    makeNewPoint(s, e, lineTheme) {
      let d = ``;
      let p = ``;
      lineTheme.p.forEach((ee) => {
        p = p + ` L${ee.join(",")}`;
      });
      // console.log(p);
      d = `M${s.join(",")} ${p} L${e.join(",")}`;

      return d;
    },
    getLineP(p,dd){
      let ss = this.toPoint(dd.s2);
      let ee = this.toPoint(dd.e2);
      let s2 = [ss[0], ss[1]];
      let e2 = [ee[0], ee[1]];
      return [s2,...p,e2]
    },
    dMaker(dd, jj) {
      // console.log(dd);
      this.$nextTick(() => {
        let ss = this.toPoint(dd.s2);
        let ee = this.toPoint(dd.e2);
        let s2 = [ss[0], ss[1]];
        let e2 = [ee[0], ee[1]];
        // let sc = this.scalPick; //- svg畫面比例
        let width = this.WnH*1

        let ss2 = this.setS2E(s2, dd.lineTheme.st,width);
        let ee2 = this.setS2E(e2, dd.lineTheme.ed,width);


        let n_d = this.makeNewPoint(ss2, ee2, dd.lineTheme);
        let ele = document.getElementById("path_" + jj + "_n");

        ele.setAttribute("d", n_d);
      });
    },
    setS2E(pp,style,ww){
      let vv = []
      switch (style) {
        case 1:
          vv = [pp[0]+ww/2,pp[1]-20] 
          break;
        case 2:
          vv = [pp[0]+ww+50,(pp[1]+ww/2)+20]
          break;
        case 3:
          vv = [pp[0]+ww/2,pp[1]+ww+70]
          break;
        case 4:
          vv = [pp[0]-50,(pp[1]+ww/2)+20]
          break;
      }
      // console.log(vv);
      return vv
    },
    dragLineBox(dd, el, jj, ii){
      //- 拖曳svg線段跟文字框共用
      let self = this;
      let x_pos, y_pos, old_x, old_y, x, y;
      const scale = this.scalPick || 1; //- svg畫面比例
      const SNAP_DISTANCE = 15;
      const width = this.WnH;
      
      const startP = (self.pathStyleSet.ss2 || []).map(Number);
      const endP = (self.pathStyleSet.ee2 || []).map(Number);
      const ss2 = this.setS2E(startP, self.pathStyleSet.lineTheme.st, width);
      const ee2 = this.setS2E(endP, self.pathStyleSet.lineTheme.ed, width);
    
      const points = this.treePointData[jj]?.lineTheme?.p || [];

      let dragPath = document.querySelector(el);
      dragPath.addEventListener("mousedown", dragStart);

      const checkSnap = (x, y) => {
        let snapX = x, snapY = y;
        let minDistX = SNAP_DISTANCE + 1;
        let minDistY = SNAP_DISTANCE + 1;
    
        const dynamicSnapCandidates = [
          points[ii - 1],
          points[ii + 1],
          ...(ii === 0 ? [ss2] : []),
          ...(ii === points.length - 1 ? [ee2] : [])
        ].filter(Boolean);
        
    
        for (const point of dynamicSnapCandidates) {
          const distX = Math.abs(x - point[0]);
          const distY = Math.abs(y - point[1]);
          if (distX < minDistX) {
            minDistX = distX;
            snapX = point[0];
          }
          if (distY < minDistY) {
            minDistY = distY;
            snapY = point[1];
          }
        }
    
        if (minDistX <= SNAP_DISTANCE) x = snapX;
        if (minDistY <= SNAP_DISTANCE) y = snapY;
        return [x, y];
      };

      function dragStart(e) {
        x_pos = e.clientX;
        y_pos = e.clientY;
        old_x = dd[0];
        old_y = dd[1];

        e.preventDefault();
        e.stopPropagation();
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
        e.preventDefault();
        e.stopPropagation();
        self.dragStop = true;
        //計算出拖曳物件的距離計算寬度
        x = (e.clientX - x_pos ) / scale + old_x;
        y = (e.clientY - y_pos ) / scale + old_y;
        [x, y] = checkSnap(x, y);
        dd[0] = x;
        dd[1] = y;
        self.$set(dd, 0, x);
        self.$set(dd, 1, y);

      }
      function stop() {
        self.dragStop = false;
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }

    },
    
    findIdValue(obj, keyName, targetId) {
      // 如果當前物件是陣列，遍歷每個元素
      if (Array.isArray(obj)) {
        for (let item of obj) {
          const result = this.findIdValue(item, keyName, targetId);  // 確保傳遞 keyName 和 targetId
          if (result) return result;
        }
      }
    
      // 如果當前物件是物件，遍歷它的每個屬性
      else if (typeof obj === 'object' && obj !== null) {
        // 如果當前物件的 keyName 屬性等於 targetId，則返回該物件層級
        if (obj[keyName] === targetId) {
          return obj;
        }
    
        // 否則，遞迴搜尋物件的每一層
        for (let key in obj) {
          const result = this.findIdValue(obj[key], keyName, targetId);  // 繼續傳遞 keyName 和 targetId
          if (result) return result;
        }
      }
    
      // 如果沒找到，返回 undefined
      return undefined;
    },
    cloShowPathSet(){
      this.showPathSet = false;
      // 重設數據
      this.$data.someData = null; // 或者重設為初始值

      this.$forceUpdate();
    },
    
  },
});


export { mdBoxApp };