<template>
  <div class="mtk2png mtk2mad" data-page="mtk2mad">
    <!-- <section class="sys_title">
      <h1>攻擊進程圖!!!!!!</h1>
      <button class="top_right btn_dlo center btn" type="button" @click="screenshot">
        <span class="material-icons">cloud_download</span>
        <b>下載圖片</b>
      </button>
    </section> -->
    <section id="mtkBox">
      <div class="mdTopng">
        <h1 class="actTitle">
          新增攻擊路線
          <small>
            ( 攻擊起點必須按照出現順序填寫 )
            <i>＊ 右邊圖片中箭頭線段及灰底方框皆可雙擊拖曳，且左方輸入資訊欄標註目標紅框</i>
          </small>
        </h1>
        <small>( 沒有出現 + 就代表此攻擊對象主機重複，此路線不再延展，請由重複之主機路線發展 )</small>
        <div class="dataListMad">
          <ListPapa :md-data="mdData" :tree-box="treeBox" :all-point="allPointBox" />
        </div>
        <div class="setInText" v-show="showText">
          <select v-model="setTextIndex" :class="setTextIndex == null && 'onNo'">
            <option :value="null" disabled="disabled" selected="selected">選取節點</option>
            <option v-for="(item, j) in allPointBox" :key="j" :value="item[0]">{{ item[0] }}</option>
          </select>
          <textarea v-model="setText" placeholder="+ 主機名稱 // 主機ＩＰ // 攻擊單位行為 // 攻擊行為內容"></textarea>
          <button class="btn" type="button" @click="openShowText(1)">送出</button>
          <em class="cloSetText" @click="openShowText(0)">X</em>
        </div>
        <div class="readerPic">
          <button class="btn flex_1" type="button" @click="downMan">下載json</button>
          <label class="btn" for="fileIpnut">
            <input type="file" id="fileIpnut" @change="handleFileInput" />
          </label>
          <button class="top_right btn_dlo center btn" type="button" @click="screenshot">
            <span class="material-icons">cloud_download</span>
          <b>下載圖片</b>
        </button>
        </div>
        <div class="dragWidth" title="拖曳調整輸入框寬度">
          <span class="material-icons rr90">import_export</span>
        </div>
      </div>
      <div id="printable">
        <div id="mtkInit">
          <ul class="box" id="boxLi">
            <li v-for="(aa, i) in treeBox" :key="i">
              <svg id="svgBox" ref="svg" v-if="i === 0">
                <g v-for="(dd, jj) in safeTreePointData" :key="dd.nb + '-marker'">
                  <marker
                    :id="'e_' + dd.nb"
                    markerUnits="strokeWidth"
                    markerWidth="5"
                    markerHeight="4"
                    refX="0"
                    refY="2"
                    orient="auto"
                  >
                    <path d="M 0 0 L 5 2 L 0 4 z" :fill="dd.offset.color"></path>
                  </marker>
                  <marker
                    :id="'b_' + dd.nb"
                    viewBox="-10 -10 70 70"
                    refX="10"
                    refY="10"
                    markerWidth="15"
                    markerHeight="15"
                    orient="auto"
                  >
                    <circle :fill="dd.offset.color" :stroke="dd.offset.color" stroke-width="4" cx="10" cy="10" r="10"></circle>
                  </marker>
                  <g v-if="dd.s !== dd.e" :transform="`translate(${dd.offset.x}, ${dd.offset.y})`">
                    <path
                      class="testPath"
                      v-show="!!!dd.useLine || dd.useLine == 'o_d'"
                      :id="'path_' + jj"
                      :d="renderArrow(dd, jj)"
                      @click="pathSet(dd, jj)"
                      @mousedown="dragSvgBox(dd, '#path_' + jj, 'offset')"
                      :stroke="dd.offset.color"
                      fill="none"
                      :marker-start="'url(#b_' + dd.nb + ')'"
                      :marker-end="'url(#e_' + dd.nb + ')'"
                      stroke-width="5"
                      :stroke-dasharray="strokeDasharray(dd.offset.strokeStyle)"
                    ></path>
                    <g v-show="dd.useLine == 'n_d'">
                      <path
                        class="testPath"
                        :id="'path_' + jj + '_n'"
                        :d="dMaker(dd, jj)"
                        @click="pathSet(dd, jj)"
                        @mousedown="dragSvgBox(dd, '#path_' + jj + '_n', 'offset')"
                        :stroke="dd.offset.color"
                        fill="none"
                        :marker-start="'url(#b_' + dd.nb + ')'"
                        :marker-end="'url(#e_' + dd.nb + ')'"
                        stroke-width="5"
                        :stroke-dasharray="strokeDasharray(dd.offset.strokeStyle)"
                      ></path>
                      <circle
                        v-show="showPathSet"
                        v-for="(pp, ii) in dd.lineTheme.p"
                        :key="ii"
                        fill="#e21e6c"
                        stroke="#000000"
                        stroke-width="4"
                        :cx="pp[0]"
                        :cy="pp[1]"
                        r="18"
                        @mousedown="dragLineBox(dd.lineTheme.p[ii], '.circle_' + dd.nb + ii, jj, ii)"
                        :class="'circle_' + dd.nb + ii"
                      ></circle>
                    </g>
                  </g>
                </g>
                <g
                  v-for="(dd, jj) in safeTreePointData"
                  v-show="dd.n !== '' || dd.r !== ''"
                  :key="dd.nb + '-text'"
                  :class="'g_' + dd.nb"
                  @mousedown="dragSvgBox(dd, '.g_' + dd.nb, 'textset')"
                  @click="pathSet(dd, jj)"
                >
                  <rect
                    :id="'rect_' + jj"
                    x="0"
                    y="0"
                    :stroke="dd.offset.color"
                    stroke-width="3"
                    width="100"
                    height="40"
                    :fill="lightenColor(dd.offset.color)"
                    rx="6"
                    ry="6"
                    :transform="`translate(${dd.textset.x},${dd.textset.y})`"
                  ></rect>
                  <text
                    class="dragText"
                    :transform="`translate(${dd.textset.x},${dd.textset.y})`"
                    x=" "
                    y=" "
                    text-anchor="middle"
                    fill="#ffffff"
                  >
                    <tspan :id="'text_' + jj" x=" " y=" " font-size="16">{{ dd.n }}</tspan>
                    <tspan :id="'text_' + jj + '_1'" x=" " y=" " font-size="13">{{ dd.r }}</tspan>
                  </text>
                </g>
              </svg>
              <Folders :folder="aa" :nbm="i" />
              <div
                class="textIcon"
                v-if="i === 0"
                v-show="dd && dd.textset && dd.textset.icon"
                :id="'text_' + jj + '_2'"
                v-for="(dd, jj) in safeTreePointData"
                :key="dd.nb + '-icon'"
                :style="`border-color: ${dd.offset.color}; background-color: ${dd.offset.color};`"
              >
                <span class="material-icons">{{ dd.textset.icon }}</span>
              </div>
            </li>
            <div class="typeList">
              <b v-for="(sd, jj) in useTypeState" :key="jj">
                <span class="material-icons">{{ sd[0] }}</span>
                <i>{{ sd[1] }}</i>
              </b>
            </div>
          </ul>
        </div>
        <div class="scale">
          <ul>
            <li
              v-for="(t, j) in scalMen"
              :key="j"
              :class="t === scalPick ? 'pickMen' : ''"
              @click="scaleBox(t)"
            >
              {{ t == 1 ? '原尺寸' : t + ' 倍' }}
            </li>
          </ul>
        </div>
      </div>
      <div class="pathStyleSet lsitCon" v-show="showPathSet">
        <div class="cloShowPathSet" title="關閉折線樣式" @click="cloShowPathSet()"><b>X</b></div>
        <div class="setInfo">
          <input
            class="flex_3 inp_1"
            v-model="pathStyleSet.offset.color"
            :style="`background-color: ${pathStyleSet.offset.color}55; border: 3px solid ${pathStyleSet.offset.color};`"
          />
          <input class="flex_1" v-model="pathStyleSet.offset.strokeStyle" type="number" max="3" min="0" placeholder="線段種類" />
          <button class="btn" type="button">樣式</button>
          <input class="flex_1" v-model="pathStyleSet.offset.lineBox" type="number" max="3" min="0" placeholder="線段種類" />
          <button class="btn" type="button">線段</button>
        </div>
        <ul class="colorSetBox">
          <li
            v-for="(color, i) in colorLinkBox"
            @click="setColor(color)"
            :key="i"
            :style="`background-color: ${color}; border-color: ${color == pathStyleSet.offset.color ? color : '#ffffff'};`"
          ></li>
        </ul>
        <hr />
        <div class="lineSetBox">
          <p>
            手動設計線段折線 :
            <label class="useSetLine">
              <input type="radio" name="line" value="o_d" v-model="pathStyleSet.useLine" />原始線段
            </label>
            <label class="useSetLine">
              <input type="radio" name="line" value="n_d" v-model="pathStyleSet.useLine" />製作線段
            </label>
          </p>
          <hr />
          <div class="setBox_line" v-if="pathStyleSet.useLine === 'n_d'">
            <div class="setBox">
              <b>
                選取起始點位置
                <div class="line-theme-square">
                  <label class="lineTheme" v-for="ind in 4" :key="ind" :class="`theme-${ind}`">
                    <input type="radio" :value="ind" v-model="pathStyleSet.lineTheme.st" name="lineTheme" />
                  </label>
                </div>
              </b>
              ||
              <b>
                選取結尾點位置
                <div class="line-theme-square">
                  <label class="lineTheme" v-for="ind in 4" :key="ind" :class="`theme-${ind}`">
                    <input type="radio" :value="ind" v-model="pathStyleSet.lineTheme.ed" name="lineTheme2" />
                  </label>
                </div>
              </b>
            </div>
            <hr class="hrLine" />
            <p class="center">
              <button class="btn addLinePoint" type="button" @click="addLinePoint">添加折點</button>
              <button class="btn addLinePoint" type="button" @click="removeLinePoint">刪除折點</button>
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import ListPapa from "../components/ListPapa.vue";
import Folders from "../components/Folders.vue";
import { colorsArr, typeStatus } from "../utils/data.js";
import { linkMaker } from "../utils/linkMaker.js";
import seedData from "../assets/mrk2mad.json";

// import "../css/main.css";
// import "../css/components.css";
// import "../css/vueComponents.css";
import "../css/mtk2png.css";

export default {
  name: "Mtk2MadPage",
  components: {
    ListPapa,
    Folders,
  },
  data() {
    return {
      urlBox: "URL_head",
      mdData: [],
      mrkData: [],
      pointBox: [],
      pointList: [],
      point2az: {},
      treeBox: [],
      nbm: 0,
      a2z: "ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz",
      listBoxData: [],
      typeStatus,
      colorLinkBox: colorsArr,
      colorLink: "#353531",
      scalMen: [1, 0.8, 0.7, 0.55, 0.35, 0.25],
      scalPick: 1,
      cPint: [],
      requestLastTime: null,
      dragStop: false,
      pathStyleSet: {
        offset: {},
        nb: "",
        d: "",
        s2: "",
        ss2: [],
        e2: "",
        ee2: [],
        wh: "",
        lineTheme: {
          st: 1,
          ed: 1,
          p: [],
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
      allPointList: [],
      allPoint: [],
      WnH: null,
      html2canvasRef: null,
    };
  },
  created() {
    this.getMd();
  },
  mounted() {
    this.dragWidth();
    this.dragBox();
    this.scaleBox(0.55);
    this.loadHtml2Canvas();
  },
  watch: {
    showPathSet(newV) {
      let svgEle = document.getElementById("svgBox");
      let nbEle = document.querySelector("." + this.pathStyleSet.nb);
      let g_nbEle = document.querySelector(".g_" + this.pathStyleSet.nb);
      const child = document.getElementById("e_" + this.pathStyleSet.nb);
      const parent = child?.parentElement;
      if (newV) {
        if (nbEle) {
          nbEle.style.border = "1px solid red";
          nbEle.style.marginLeft = "-1px";
        }
        if (svgEle) {
          svgEle.classList.add("focusMe");
        }
        if (g_nbEle) {
          g_nbEle.classList.add("focusEle");
        }
        if (parent) {
          parent.classList.add("focusEle");
        }
      } else {
        if (nbEle) {
          nbEle.style.border = "none";
          nbEle.style.marginLeft = "0";
        }
        if (svgEle) {
          svgEle.classList.remove("focusMe");
        }
        if (g_nbEle) {
          g_nbEle.classList.remove("focusEle");
        }
        if (parent) {
          parent.classList.remove("focusEle");
        }

        this.pathStyleSet = {
          offset: {},
          nb: "",
          d: "",
          s2: "",
          ss2: [],
          e2: "",
          ee2: [],
          wh: "",
          lineTheme: {
            st: 1,
            ed: 1,
            p: [],
          },
          useLine: "",
        };
      }
    },
    "pathStyleSet.useLine": function (newVal) {
      let nb = this.pathStyleSet.nb;
      let uu = this.findIdValue(this.treeBox, "nb", nb);
      if (uu) {
        uu.useLine = newVal;
      }
    },
    "pathStyleSet.lineTheme.st": function (newVal) {
      let nb = this.pathStyleSet.nb;
      let uu = this.findIdValue(this.treeBox, "nb", nb);
      if (!uu) return;
      uu.lineTheme ??= {};
      uu.lineTheme.st = newVal;
    },
    "pathStyleSet.lineTheme.ed": function (newVal) {
      let nb = this.pathStyleSet.nb;
      let uu = this.findIdValue(this.treeBox, "nb", nb);
      if (!uu) return;
      uu.lineTheme ??= {};
      uu.lineTheme.ed = newVal;
    },
  },
  computed: {
    allPointBox() {
      if (!this.treeBox) {
        return [];
      }
      let point = this.traverseData(this.treeBox);
      this.cPint = [];
      let point2 = point.map((e) => e.join());
      point = [...new Set(point2)];
      let ps = point.map((e) => e.split(","));
      this.allPointList = ps;
      return ps;
    },
    treePointData() {
      const list = this.flattenData(this.treeBox);
      this.ipPointList(list);
      return list;
    },
    safeTreePointData() {
      const list = Array.isArray(this.treePointData) ? this.treePointData : [];
      return list
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          ...item,
          n: item.n ?? "",
          r: item.r ?? "",
          textset: item.textset ?? { x: 0, y: 0, icon: "" },
          offset:
            item.offset ??
            { x: 0, y: 0, e_x: 0, e_y: 0, s_x: 0, s_y: 0, lineBox: 0, color: "#bbbbbb" },
          lineTheme: item.lineTheme ?? { st: 1, ed: 1, p: [] },
        }));
    },
    useTypeState() {
      if (!this.treeBox) {
        return [];
      }
      let data = this.treeBox;
      let folderTypes = new Set();
      function collectFolderTypes(data) {
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (!item) {
              return;
            }
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
        (this.typeStatus || []).forEach((f) => {
          if (f[0] === e) {
            typeDD = [...typeDD, f];
          }
        });
      });
      return typeDD;
    },
  },
  methods: {
    loadExternalScript(src, globalKey) {
      return new Promise((resolve, reject) => {
        if (globalKey && window[globalKey]) {
          resolve(window[globalKey]);
          return;
        }
        const existing = document.querySelector(`script[data-vendor-src="${src}"]`);
        if (existing) {
          existing.addEventListener(
            "load",
            () => resolve(globalKey ? window[globalKey] : true),
            { once: true }
          );
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.vendorSrc = src;
        script.onload = () => resolve(globalKey ? window[globalKey] : true);
        script.onerror = () => reject(new Error(`載入失敗：${src}`));
        document.head.appendChild(script);
      });
    },
    async loadHtml2Canvas() {
      if (this.html2canvasRef) return;
      await this.loadExternalScript("/mtk2mad/vendors/html2canvas.min.js", "html2canvas");
      this.html2canvasRef = window.html2canvas;
    },
    async screenshot() {
      let name = window.prompt("請輸入檔案名稱", "");
      this.scaleBox(1);
      if (!!name) {
        var yes = confirm("是否一併下載json？");
        if (yes) {
          await this.takePic("boxLi", name);
          this.downloadJSON(this.treeBox, name + ".json");
        } else {
          await this.takePic("boxLi", name);
        }
      }
    },
    async takePic(who, name) {
      await this.loadHtml2Canvas();
      const html2canvas = this.html2canvasRef || window.html2canvas;
      if (!html2canvas) {
        alert("html2canvas 尚未載入");
        return;
      }
      html2canvas(document.getElementById(who)).then(function (canvas) {
        document.body.appendChild(canvas);
        let a = document.createElement("a");
        a.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        a.download = name + ".png";
        a.click();
      });
    },
    traverseData(data) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.e) {
          this.cPint.push([item.e, item.e2, item.ip]);
        }
        if (item.children && item.children.length > 0) {
          this.traverseData(item.children);
        }
      }
      return this.cPint;
    },
    async getMd() {
      try {
        const data = JSON.parse(JSON.stringify(seedData));
        this.resetTextOffsets(data);
        this.mdData = data;
        this.treeBox = data;
      } catch (error) {
        console.error("Error loading JSON:", error);
      }
    },
    resetTextOffsets(data) {
      if (!Array.isArray(data)) return;
      data.forEach((item) => {
        if (!item || typeof item !== "object") return;
        if (item.textset && typeof item.textset === "object") {
          item.textset.x = 0;
          item.textset.y = 0;
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          this.resetTextOffsets(item.children);
        }
      });
    },
    ipPointList(list = []) {
      this.$nextTick(() => {
        const svgBox = document.getElementById("svgBox");
        const boxLi = document.getElementById("boxLi");
        if (!svgBox || !boxLi) return;
        svgBox.style.width = boxLi.offsetWidth;
        svgBox.style.height = boxLi.offsetHeight + "px";

        let listBox = {};
        let treePointList = [];

        list.forEach((dd) => {
          if (!dd) {
            return false;
          }
          if (dd.one && dd.end) {
            return false;
          } else {
            treePointList = [...treePointList, dd];
          }
        });

        treePointList.forEach((e) => {
          listBox[e.e2] = this.toPoint(e.e2);
        });

        this.listBoxData = listBox;
      });
    },
    toPoint(e) {
      let xyz = document.getElementById("point_" + e);
      if (!xyz) {
        return [0, 0, 0, 0];
      }
      let width = Number(xyz.offsetWidth);
      let height = Number(xyz.offsetHeight);
      let x = Number(xyz.offsetLeft);
      let y = Number(xyz.offsetTop);

      this.WnH ??= width;
      return [x, y, width, height];
    },
    linkMaker(dd) {
      return linkMaker(dd, this.listBoxData);
    },
    renderArrow(dd, jj) {
      this.$nextTick(() => {
        if (!dd) return;
        const linkData = this.linkMaker(dd);
        const link = linkData.link;
        let this_link = document.querySelector("#path_" + jj);
        if (!this_link || !link) return;
        this_link.setAttribute("d", link);

        const textPos = linkData.textPos;
        let t_x = textPos[0];
        let t_y = textPos[1];

        t_x = t_x + 60;
        let ts_y = t_y + 20;

        let this_text = document.querySelector("#text_" + jj);
        let this_rect = document.querySelector("#rect_" + jj);
        let this_text_tspan = document.querySelector("#text_" + jj + "_1");
        let this_text_icon = document.querySelector("#text_" + jj + "_2");

        if (!this_text || !this_rect || !this_text_tspan) {
          return false;
        }
        let rr = this_text.getBBox().width;
        let nn = this_text_tspan.getBBox().width;

        let setW = rr > nn ? rr : nn;
        let rcX = t_x - setW / 2 - 15;
        let rcY = dd.n == "" ? t_y - 5 : t_y - 25;
        if (!!this_text) {
          this_text.setAttribute("x", t_x);
          this_text.setAttribute("y", t_y);
          this_text_tspan.setAttribute("x", t_x);
          this_text_tspan.setAttribute("y", ts_y);
          this_rect.setAttribute("x", rcX);
          this_rect.setAttribute("y", rcY);
          this_rect.setAttribute("width", setW + 30 + "px");
          this_rect.setAttribute("height", dd.r == "" || dd.n == "" ? "40px" : "60px");
          if (this_text_icon) {
            const offsetX = dd.textset?.x ?? 0;
            const offsetY = dd.textset?.y ?? 0;
            this_text_icon.style.left = t_x + setW / 2 + 5 + offsetX + "px";
            this_text_icon.style.top = t_y - 40 + offsetY + "px";
          }
        }
      });
    },
    dragBox() {
      const self = this;
      const stop = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      };
      let startX, startY;
      let dragDiv = document.querySelector("#printable");
      if (!dragDiv) return;
      dragDiv.addEventListener("mousedown", dragStart);
      function dragStart(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        startX = e.clientX + dragDiv.scrollLeft;
        startY = e.clientY + dragDiv.scrollTop;
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
        if (self.dragStop) {
          stop();
        }
        dragDiv.scrollLeft = startX - e.clientX;
        dragDiv.scrollTop = startY - e.clientY;
      }
    },
    dragWidth() {
      const mdTopng = document.querySelector(".mdTopng");
      const dragWidth = document.querySelector(".dragWidth");
      if (!dragWidth || !mdTopng) return;
      let x_pos, startX;
      dragWidth.addEventListener("mousedown", dragStart);

      function dragStart(e) {
        x_pos = mdTopng.offsetWidth;
        e.preventDefault();
        startX = e.clientX - dragWidth.offsetLeft;
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
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
      if (!scaleBox) return;
      scaleBox.style.transform = `scale(${t})`;
      this.scalPick = t;
    },
    flattenData(data, result = []) {
      if (!Array.isArray(data)) {
        return result;
      }
      for (const item of data) {
        if (!item || typeof item !== "object") {
          continue;
        }
        result.push({
          s: item.s ?? "",
          e: item.e ?? "",
          s2: item.s2 ?? "",
          e2: item.e2 ?? "",
          r: item.r ?? "",
          n: item.n ?? "",
          level: item.level ?? "",
          textset: item.textset ?? { x: 0, y: 0, icon: "" },
          offset: item.offset ?? { x: 0, y: 0, e_x: 0, e_y: 0, s_x: 0, s_y: 0, lineBox: 0, color: "#bbbbbb" },
          nb: item.nb ?? "",
          one: item.one || false,
          useLine: item.useLine || "o_d",
          lineTheme: item.lineTheme || {
            st: 1,
            ed: 1,
            p: [],
          },
        });

        if (Array.isArray(item.children) && item.children.length > 0) {
          this.flattenData(item.children, result);
        }
      }
      return result;
    },
    dragSvgBox(dd, el, useKey) {
      const self = this;
      let x_pos, y_pos, old_x, old_y, x, y;
      let dragPath = document.querySelector(el);
      if (!dragPath) return;
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
        self.dragStop = true;
        x = e.clientX - x_pos + old_x;
        y = e.clientY - y_pos + old_y;

        dd[useKey].x = x;
        dd[useKey].y = y;
      }
      function stop() {
        self.dragStop = false;
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }
    },
    pathSet(dd, jj) {
      let scrollBar = document.querySelector(".dataListMad");
      let nbEle = document.querySelector("." + dd.nb);
      if (!scrollBar || !nbEle) return;
      scrollBar.scrollTop = 0;
      scrollBar.scrollTop = nbEle.getBoundingClientRect().top - (scrollBar.offsetTop + 200);

      this.pathStyleSet = dd;
      this.pathStyleSet.jj ??= jj;

      let vv = this.toPoint(this.pathStyleSet.s2);
      this.pathStyleSet.ss2 = [vv[0], vv[1]];
      let ww = this.toPoint(this.pathStyleSet.e2);
      this.pathStyleSet.ee2 = [ww[0], ww[1]];

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
      this.pathStyleSet.offset.color = color;
    },
    downMan() {
      let name = window.prompt("請輸入檔案名稱", "");
      if (!!name) {
        this.downloadJSON(this.treeBox, name + ".json");
      }
    },
    downloadJSON(jsonData, filename) {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);

      a.click();
      URL.revokeObjectURL(url);
    },
    handleFileInput(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      this.treeBox = [];
      this.mdData = [];
      this.allPoint = [];
      reader.onload = () => {
        const content = reader.result;
        try {
          const jsonData = JSON.parse(content);
          this.treeBox = jsonData;
          this.mdData = jsonData;
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };
      reader.readAsText(file);
    },
    lightenColor(color) {
      const [r, g, b] = color.match(/\w\w/g).map((hex) => parseInt(hex, 16));
      let pasu = 0.85;
      const newR = Math.min(255, Math.round(r * pasu));
      const newG = Math.min(255, Math.round(g * pasu));
      const newB = Math.min(255, Math.round(b * pasu));

      return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB
        .toString(16)
        .padStart(2, "0")}`;
    },
    openShowText(ii) {
      if (ii == 1) {
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
    addLinePoint() {
      let nb = this.pathStyleSet.nb;
      let uu = this.findIdValue(this.treeBox, "nb", nb);

      uu.lineTheme ??= {
        st: 1,
        ed: 1,
        p: [],
      };
      let qq = this.toPoint(this.pathStyleSet.s2);

      let p = uu.lineTheme.p.length == 0 ? [[qq[0], qq[1]]] : uu.lineTheme.p;
      const lastData = p[p.length - 1];
      const newData = [[lastData[0] * 1 + 20, lastData[1] * 1 + 20]];
      let fal = [...uu.lineTheme.p, ...newData];
      uu.lineTheme.p = fal;
      this.pathStyleSet.lineTheme.p = fal;
    },
    removeLinePoint() {
      this.pathStyleSet.lineTheme.p.pop();
    },
    makeNewPoint(s, e, lineTheme) {
      let d = ``;
      let p = ``;
      lineTheme.p.forEach((ee) => {
        p = p + ` L${ee.join(",")}`;
      });
      d = `M${s.join(",")} ${p} L${e.join(",")}`;

      return d;
    },
    dMaker(dd, jj) {
      this.$nextTick(() => {
        let ss = this.toPoint(dd.s2);
        let ee = this.toPoint(dd.e2);
        let s2 = [ss[0], ss[1]];
        let e2 = [ee[0], ee[1]];
        let width = this.WnH * 1;

        let ss2 = this.setS2E(s2, dd.lineTheme.st, width);
        let ee2 = this.setS2E(e2, dd.lineTheme.ed, width);

        let n_d = this.makeNewPoint(ss2, ee2, dd.lineTheme);
        let ele = document.getElementById("path_" + jj + "_n");

        if (!ele || !n_d) return;
        ele.setAttribute("d", n_d);
      });
    },
    setS2E(pp, style, ww) {
      let vv = [];
      switch (style) {
        case 1:
          vv = [pp[0] + ww / 2, pp[1] - 20];
          break;
        case 2:
          vv = [pp[0] + ww + 50, pp[1] + ww / 2 + 20];
          break;
        case 3:
          vv = [pp[0] + ww / 2, pp[1] + ww + 70];
          break;
        case 4:
          vv = [pp[0] - 50, pp[1] + ww / 2 + 20];
          break;
      }
      return vv;
    },
    dragLineBox(dd, el, jj, ii) {
      let self = this;
      let x_pos, y_pos, old_x, old_y, x, y;
      const scale = this.scalPick || 1;
      const SNAP_DISTANCE = 15;
      const width = this.WnH;

      const startP = (self.pathStyleSet.ss2 || []).map(Number);
      const endP = (self.pathStyleSet.ee2 || []).map(Number);
      const ss2 = this.setS2E(startP, self.pathStyleSet.lineTheme.st, width);
      const ee2 = this.setS2E(endP, self.pathStyleSet.lineTheme.ed, width);

      const source = Array.isArray(this.treePointData) ? this.treePointData : [];
      const points = source[jj]?.lineTheme?.p || [];

      let dragPath = document.querySelector(el);
      if (!dragPath) return;
      dragPath.addEventListener("mousedown", dragStart);

      const checkSnap = (x, y) => {
        let snapX = x,
          snapY = y;
        let minDistX = SNAP_DISTANCE + 1;
        let minDistY = SNAP_DISTANCE + 1;

        const dynamicSnapCandidates = [
          points[ii - 1],
          points[ii + 1],
          ...(ii === 0 ? [ss2] : []),
          ...(ii === points.length - 1 ? [ee2] : []),
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
        x = (e.clientX - x_pos) / scale + old_x;
        y = (e.clientY - y_pos) / scale + old_y;
        [x, y] = checkSnap(x, y);
        dd[0] = x;
        dd[1] = y;
      }
      function stop() {
        self.dragStop = false;
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      }
    },
    findIdValue(obj, keyName, targetId) {
      if (Array.isArray(obj)) {
        for (let item of obj) {
          const result = this.findIdValue(item, keyName, targetId);
          if (result) return result;
        }
      } else if (typeof obj === "object" && obj !== null) {
        if (obj[keyName] === targetId) {
          return obj;
        }

        for (let key in obj) {
          const result = this.findIdValue(obj[key], keyName, targetId);
          if (result) return result;
        }
      }

      return undefined;
    },
    cloShowPathSet() {
      this.showPathSet = false;
      this.$forceUpdate();
    },
  },
};
</script>

<style>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons");
</style>
