<template>
  <div class="mdeditor" data-page="mdeditor">
    <section class="sys_title">
      <h1>
        md => png
        <b>備註：若產圖失敗，請 [ 分段 ] 確認輸入的格式是否正確。</b>
      </h1>
    </section>
    <section id="mdBox">
      <div class="mdTopng" ref="mdTopng">
        <textarea v-model="mdData" placeholder="+ YYYY-MM-DD HH:MM:SS 內容"></textarea>
      </div>
      <div id="printable" ref="printable">
        <canvas id="myChart" ref="myChart"></canvas>
        <div class="setComment">
          <h2>
            添加折線圖添加註解
            <b class="okBtn" @click="writeCom">確定繪出註解</b>
          </h2>
          <div class="conLeft">
            <ul>
              <li v-for="(item, ii) in setComment" v-if="item !== ''" :key="item + ii">
                <label class="center">
                  {{ item }}
                  <input v-model="commentBox[ii][0]" placeholder="添加註解" type="text" />
                  <input class="numberBox" v-model.number="commentBox[ii][1]" type="number" min="-9" max="11" />
                </label>
              </li>
            </ul>
          </div>
          <h2>添加事件處理敘述</h2>
          <div class="conLeft">
            <textarea v-model="eventSource"></textarea>
          </div>
        </div>
        <div id="attackHistory" ref="attackHistory">
          <div>
            <div class="timePeriod">
              <div class="list">
                區間：
                <div class="list_li center" v-for="(ss, l) in iArr" :key="l" :class="ss[0]">
                  <span class="material-icons">{{ ss[0] }}</span>
                  <b>{{ ss[1] }}</b>
                </div>
              </div>
            </div>
            <div class="timeBox" v-for="(item, i) in endData" :key="i">
              <h2 v-if="item[0] == '0000-00-00'">
                <p v-for="(h, k) in item[1][0].start" :key="k" v-html="pickMeWord(h)[0]"></p>
              </h2>
              <div v-else>
                <h1 class="date">
                  <b>{{ cutTime(item[0])[0] }}</b>
                  <em>{{ cutTime(item[0])[1] }}</em>
                </h1>
                <div class="detail" v-for="(el, j) in item[1]" :key="j">
                  <b class="title center" :class="SelectPic(el.time)">
                    <span class="material-icons">{{ SelectPic(el.time) }}</span>
                    <em>{{ parseInt(el.time.split(":")[0]) == 25 ? el.con : el.time }}</em>
                  </b>
                  <div class="content">
                    <p v-show="parseInt(el.time.split(':')[0]) !== 25" v-html="pickMeWord(el.con)[0]"></p>
                    <ul class="ann" v-if="el.ann">
                      <li v-for="(e, u) in el.ann" :key="u"><b v-html="pickMeWord(e)[0]"></b></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="eventBox" v-if="eventList.length > 0">
            <h3>事件處理</h3>
            <h2>
              <p
                v-for="(h, k) in eventList"
                :key="k"
                :style="'padding-left: ' + pickMeWord(h)[1] * 2 + 'em'"
                v-html="pickMeWord(h)[0]"
              ></p>
            </h2>
          </div>
        </div>
        <div class="dragBox" ref="dragBox"></div>
      </div>
    </section>
    <button class="top_right btn_dlo center" type="button" @click="screenshot">
      <span class="material-icons">cloud_download</span>
      <b>下載圖片</b>
    </button>
  </div>
</template>

<script>

export default {
  name: "Mtk2MadMdEditorPage",
  data() {
    return {
      mdData: "",
      renderData: [],
      endData: [],
      iArr: [
        ["star", "00 ~ 08"],
        ["wb_sunny", "08 ~ 12"],
        ["brightness_high", "12 ~ 18"],
        ["brightness_2", "18 ~ 24"],
      ],
      cName: [],
      cData: [],
      setComment: [""],
      commentBox: [["", -3]],
      mtChart: null,
      eventSource: "",
      resizeTimer: null,
      downloadName: "",
      html2canvasRef: null,
      chartRef: null,
      swalRef: null,
    };
  },
  computed: {
    eventList() {
      let qq = this.eventSource.replaceAll("\\\\n", "\n").replace('\n`', "").replace(/^\s*|\s*$/g, "");
      qq = qq.replaceAll("\t\t\t\t+ ", "+ \t\t\t\t");
      qq = qq.replaceAll("\t\t\t+ ", "+ \t\t\t");
      qq = qq.replaceAll("\t\t+ ", "+ \t\t");
      qq = qq.replaceAll("\t+ ", "+ \t");
      qq.replace("+ `", "+ `\n");
      qq = qq.split("\n");
      let ww = [];
      qq.forEach((e) => {
        ww = [...ww, e.split("+ ")[1]];
      });
      ww = ww.filter((el) => el);
      return ww;
    },
  },
  watch: {
    mdData: {
      handler(newValue, oldValue) {
        if (oldValue !== []) {
          this.mdToJson(newValue);
        }
      },
      immediate: false,
      deep: false,
    },
  },
  mounted() {
    this.loadVendors().then(() => {
      this.renderChart();
    });
    this.loadDefaultMdText();
    this.dragBox();
    window.onresize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.renderChart();
      }, 250);
    };
  },
  methods: {
    async loadDefaultMdText() {
      try {
        const url = new URL("../assets/md.text", import.meta.url).href;
        const res = await fetch(url);
        if (!res.ok) return;
        this.mdData = await res.text();
      } catch (err) {
        console.warn("md.text 讀取失敗", err);
      }
    },
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
    async loadVendors() {
      if (!this.chartRef) {
        await this.loadExternalScript("/mtk2mad/vendors/Chart.min.js", "Chart");
        this.chartRef = window.Chart || null;
      }
      if (!this.html2canvasRef) {
        await this.loadExternalScript("/mtk2mad/vendors/html2canvas.min.js", "html2canvas");
        this.html2canvasRef = window.html2canvas || null;
      }
      if (!this.swalRef) {
        await this.loadExternalScript("/mtk2mad/vendors/sweetalert.min.js", "swal");
        this.swalRef = window.swal || null;
      }
    },
    showAlert(title, message) {
      if (this.swalRef) {
        this.swalRef(title, message, "error");
        return;
      }
      alert(message);
    },
    mdToJson(data) {
      if (!data) {
        this.renderData = [];
        this.endData = [];
        this.cName = [];
        this.cData = [];
        this.setComment = [""];
        this.commentBox = [["", -3]];
        this.renderChart();
        return;
      }
      let qq = data.replaceAll("\\\\n", "\n").replace("\n`", "").replace(/^\s*|\s*$/g, "");
      qq.replace("+ `", "+ `\n");
      qq = data.split("\n");

      let ww = [];
      qq.forEach((e) => {
        ww = [...ww, e.split("+ ")[1]];
      });
      ww = ww.filter((el) => el);

      const regex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      let finData = [];
      let ff = [];

      ww.forEach((s, i) => {
        s = s.replaceAll("/", "-");
        if (regex.test(s.substring(1, 11))) {
          if (isNaN(s.substring(12, 14) * 1)) {
            s = s.slice(0, 11) + " 25:00:00" + s.slice(11);
          }

          const qp = s.split("` ")[0].replace("`", "");
          const qt = qp.substring(10, 11);

          if (qt !== " " ?? qt !== "\n") {
            this.showAlert("格式錯誤", `錯誤的格式：${qp}`);
          }

          if (ff.length > 0) {
            if (finData.length === 0) {
              finData = [{}];
              finData[0].start = ff;
            } else {
              finData[finData.length - 1].ann = [...ff];
            }
            finData = [
              ...finData,
              {
                time: s.substring(1, 20).replace(/^\s*|\s*$/g, "").split(" "),
                con: s.substring(21).replace(/^\s*|\s*$/g, ""),
              },
            ];
            ff = [];
          } else {
            finData = [
              ...finData,
              {
                time: s.substring(1, 20).replace(/^\s*|\s*$/g, "").split(" "),
                con: s.substring(21).replace(/^\s*|\s*$/g, ""),
              },
            ];
          }
        } else {
          if (i === ww.length - 1) {
            finData[finData.length - 1].ann = [...ff, s];
            ff = [];
          } else {
            ff = [...ff, s];
          }
        }
      });
      this.renderData = finData;
      this.filterTime(finData);
    },
    filterTime(finData) {
      let zData = {};
      finData.forEach((el) => {
        if (!el.time) {
          zData["0000-00-00"] = [
            {
              start: el.start,
              time: "00:00:01",
            },
          ];
        } else {
          if (zData[el.time[0]] === undefined) {
            zData[el.time[0]] = [];
          }
          zData[el.time[0]].push({
            time: el.time[1],
            con: el.con,
            ann: el.ann,
          });
        }
      });

      let sortDay = Object.keys(zData).sort(function (a, b) {
        return a.replaceAll("-", "") - b.replaceAll("-", "");
      });

      let okData = [];
      sortDay.forEach((el) => {
        let sortArr = [];
        sortArr = zData[el].sort(function (a, b) {
          return a.time.replaceAll(":", "") - b.time.replaceAll(":", "");
        });
        okData = [...okData, [el, sortArr]];
      });

      okData.forEach((e) => {
        e[1].forEach((s) => {
          if (s.time.split(":")[0] * 1 == 25) {
            e[1] = [e[1].pop(), ...e[1]];
          }
        });
      });
      this.endData = okData;
      this.makeChart(okData);
    },
    makeChart(okData) {
      let cat = {};
      let d = "";
      let cutHour = 0;
      let n = "";
      let v = "";
      let t = 0;
      let save_25_Time = [];
      okData.forEach((el) => {
        if (el[0] !== "0000-00-00") {
          el[1].forEach((e) => {
            let st = e.time.split(":")[0];
            let st_25 = false;
            if (st == "25") {
              st = "12";
              st_25 = true;
              save_25_Time.push([el[0], e.con]);
            }
            n = el[0] + " " + st;
            if (d !== "" && n !== "") {
              cutHour = this.calculatingTime(d + " " + v, n);
              if (cutHour > 1 && cutHour <= 6) {
                let m = Math.ceil(cutHour);
                for (let ij = 1; ij < m; ij++) {
                  let g = parseInt(v) + ij;
                  cat[el[0] + " " + g] = 0;
                }
              }
              if (cutHour > 6 && cutHour <= 12) {
                let f = Math.ceil(cutHour / 2);
                for (let ij = 1; ij < f; ij++) {
                  let g = parseInt(v) + ij * 2;
                  cat[el[0] + " " + g] = 0;
                }
              }
              if (cutHour > 12 && cutHour <= 48) {
                let m = Math.ceil(cutHour / 6);
                for (let iu = 1; iu < m; iu++) {
                  cat[d + " ( + " + iu * 6 + "hr)"] = 0;
                }
              }
              let im = 24 * 30;
              if (cutHour > 48 && cutHour <= im) {
                let m = Math.ceil(cutHour / 48);
                for (let iu = 1; iu < m; iu++) {
                  cat[d + " ( + " + iu * 2 + "day)"] = 0;
                }
              }
              if (cutHour > im) {
                let m = Math.ceil(cutHour / im);
                for (let iu = 1; iu < m; iu++) {
                  cat[d + " ( + " + iu + "mo.)"] = 0;
                }
              }
            }
            if (st !== v) {
              t = 0;
              v = st;
            }
            t++;
            if (st_25) {
              t = 0;
              cat[el[0] + " "] = 1;
              v = "12";
            } else {
              cat[n] = t;
            }
            d = el[0];
          });
        }
        t = 0;
      });

      this.cName = Object.keys(cat);
      let pp = [];
      this.cName.forEach((e) => {
        pp = [...pp, cat[e]];
      });

      this.cData = pp;
      this.setComment = this.cName.map((e) => (e[0] !== "+" ? e : ""));
      this.commentBox = this.setComment.map(() => ["", -3]);

      if (pp.length < 4 && this.setComment.length > 0) {
        let t_c = this.setComment[0] + ":00:00";
        t_c = t_c.replaceAll("-", "/");
        let t_c_1 = new Date(t_c);
        t_c_1.setHours(t_c_1.getHours() - 1);
        let t_c_1_0 = `${t_c_1.getFullYear()}-${(t_c_1.getMonth() * 1 < 10 ? "0" : "") + (t_c_1.getMonth() + 1)}-${
          (t_c_1.getDate() * 1 < 10 ? "0" : "") + t_c_1.getDate()
        } ${(t_c_1.getHours() * 1 < 10 ? "0" : "") + t_c_1.getHours()}`;

        let t_d = this.setComment[this.setComment.length - 1] + ":00:00";
        t_d = t_d.replaceAll("-", "/");
        let t_d_1 = new Date(t_d);
        t_d_1.setHours(t_d_1.getHours() + 1);
        let t_d_1_0 = `${t_d_1.getFullYear()}-${(t_d_1.getMonth() * 1 < 10 ? "0" : "") + (t_d_1.getMonth() + 1)}-${
          (t_d_1.getDate() * 1 < 10 ? "0" : "") + t_d_1.getDate()
        } ${(t_d_1.getHours() * 1 < 10 ? "0" : "") + t_d_1.getHours()}`;

        this.setComment = [t_c_1_0, ...this.setComment, t_d_1_0];
        this.commentBox = [["", -3], ...this.commentBox, ["", -3]];

        this.cName = this.setComment;
        this.cData = [0, ...pp, 0];
      }
      save_25_Time.forEach((e) => {
        let su = this.setComment.indexOf(e[0] + " ");
        if (su >= 0) {
          this.commentBox[su][0] = e[1];
        }
      });
      if (this.mtChart) {
        this.mtChart.destroy();
      }
      this.renderChart();
    },
    calculatingTime(p, l) {
      const ONE_HOUR = 1000 * 60 * 60;
      let d = p + ":00:00";
      let n = l + ":00:00";
      let a = d.replaceAll("-", "/");
      let b = n.replaceAll("-", "/");

      let Date_A = new Date(a);
      let Date_B = new Date(b);
      let diff = Date_B - Date_A;

      let leftHours = Math.floor(diff / ONE_HOUR);
      if (leftHours > 0) diff = diff - leftHours * ONE_HOUR;

      return leftHours;
    },
    cutTime(dd) {
      let time = dd.replace("-", " ").replace("-", "/").split(" ");
      return time;
    },
    SelectPic(ss) {
      let oo = parseInt(ss.split(":")[0]);
      return oo < 8 ? "star" : oo < 12 ? "wb_sunny" : oo < 18 ? "brightness_high" : oo < 24 ? "brightness_2" : "settings_suggest";
    },
    renderChart(){
      //- 監控主機數量統計
      var ctx = document.getElementById('myChart');
      var textIndex = this.commentBox; //因為有閉包問題拉到這裡
      // 這裡是要讓外面重繪的時候叫得到
      // console.log(ctx);
      this.mtChart = new Chart(ctx, {
        responsive: true,
        type: 'line',
        fillColor: "rgba(14,72,100,1)",
        data: {
          labels: [...this.cName],
          datasets: [{
            label: '事件次數統計',
            data: [...this.cData],
            backgroundColor: 'rgba(139, 18, 219, 0.3)',
            borderColor: 'rgba(139, 18, 219, 0.8)',
            borderWidth: 1,
          }],
        },
        options: {
          scales: {
            yAxes: [{
              stacked: true,
              id: 'y-axis-1',
              ticks: {
                min: 0,
                beginAtZero: true,
                userCallback: function (label, index, labels) {
                  if (Math.floor(label) === label) {
                    return label;
                  }
                },
              }
          }], 
            xAxes: [{
              ticks: {
                minRotation: 65,
                autoskip: false,
                display: true,
                autoSkipPadding: 10
              }
            }],
          },
          elements: {
            line: {
              tension: 0.000001
            }
          },
          hover: {
            animationDuration: 0  // 防止鼠标移上去，数字闪烁
          },
          animation: {           // 这部分是数值显示的功能实现
            onComplete: function () {
              var chartInstance = this.chart
              ctx = chartInstance.ctx;
              
              // 以下属于canvas的属性（font、fillStyle、textAlign...）
              ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
              ctx.fillStyle = "black";
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              var hasOne = false; // 有第一筆資料
              this.data.datasets.forEach(function (dataset, i) {
                var meta = chartInstance.controller.getDatasetMeta(i);
                let last = meta.data.length;
                // let Previous = 0;
                let $colorZ0 = '#fc7232'
                let $colorZ1 = '#f12939'
                let $colorZ2 = '107, 7, 16'
                // let $colorZ3 = '#ffe600'
                let $colorZ3 = '#ffffff'
                meta.data.forEach(function (bar, index) {
                  var data = dataset.data[index];
                  data = data==0?'':data // 資料是0的話就不顯示
                  ctx.fillText(data, bar._model.x, bar._model.y-5);
                  let comm = textIndex[index][0]; //因為有閉包問題所以textIndex拉到外層
                  if(comm){
                    let textWidth = ctx.measureText(comm).width // 計算文字內容寬度
                    let xPos = 0;
                    if(!hasOne){ // chaer.js第一筆資料寬度會比較小 bug
                      textWidth = textWidth * 1.11
                      hasOne = true
                    }
                    if(index==0){
                      ctx.textAlign = 'start';
                      xPos = bar._model.x - 5
                      
                    }else if(index==last-1){
                      ctx.textAlign = 'end';
                      xPos = bar._model.x - textWidth - 5
                    }else{
                      ctx.textAlign = 'center';
                      xPos = bar._model.x - textWidth/2 -5
                    }

                    let padding = textIndex[index][1]
                    ctx.fillStyle = "#000000";
                    
                    ctx.beginPath();
                    ctx.strokeStyle = $colorZ0; //園角矩形線匡顏色
                    ctx.lineJoin = "round"
                    ctx.lineWidth = "8";
                    
                    ctx.fillStyle = $colorZ0;
                    let myLineH = padding>0?10*padding+14:10*padding-12
                    ctx.fillRect( bar._model.x-1, bar._model.y-(myLineH),2,10*padding-6)//引導線 用小矩形做的 
                    ctx.strokeRect( xPos, bar._model.y-(10*padding)-10,textWidth+10,18)
                    ctx.fillRect( xPos, bar._model.y-(10*padding)-10,textWidth+10,18)
                    var grd=ctx.createLinearGradient( xPos, bar._model.y-(10*padding)-10,xPos, bar._model.y-(10*padding)+9);
                    grd.addColorStop(0,$colorZ0);
                    grd.addColorStop(0.5,$colorZ1);
                    grd.addColorStop(1,$colorZ0);

                    ctx.fillStyle = grd;  //填滿顏色

                    ctx.fillRect( xPos, bar._model.y-(10*padding)-10,textWidth+10, 18);
                    // ctx.fillStyle = $colorZ0;
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = `rgba(${$colorZ2},.75)`;
                    ctx.fillStyle = $colorZ3;
                    ctx.font = "10pt Arial";
                    ctx.fillText(comm, bar._model.x, bar._model.y-(4+(padding-1)*10));
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "#000000";
                    // Previous = index

                  }

                });
              });
            },
          },
        },
        plugins: [{
          beforeDraw: function(c, options) {
            let canvas = document.getElementById('myChart');
            let context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height)
          }
        }]
      });

    },
    dragBox() {
      let printable = this.$refs.printable;
      let dragDiv = this.$refs.dragBox;
      if (!printable || !dragDiv) return;
      let x_pos, startX;
      dragDiv.addEventListener("mousedown", dragStart);

      function dragStart(e) {
        x_pos = printable.offsetWidth;
        e.preventDefault();
        startX = e.clientX - dragDiv.offsetLeft;
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
      }
      function move(e) {
        let x = e.clientX - startX;
        printable.style.width = x_pos - x + "px";
      }
      const self = this;
      function stop() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
        self.writeCom();
      }
    },
    writeCom() {
      if (this.mtChart) {
        this.mtChart.destroy();
      }
      this.renderChart();
    },
    pickMeWord(d) {
      let srt = d;
      let pickW = false;
      function wwBox() {
        pickW = !pickW;
        return pickW ? "<em>" : "</em>";
      }
      srt = srt.replace(/`/g, wwBox);
      let y = srt.split("\t").length - 1;
      return [srt, y];
    },
    screenshot() {
      let name = window.prompt("請輸入檔案名稱", "");
      if (!!name) {
        this.downloadName = name;
        this.takePic("attackHistory", "_history", name).then(() => {
          setTimeout(() => {
            let Big = window.confirm("放大攻擊次數統計圖？");
            if (Big) {
              this.bigPic(name);
            } else {
              this.takePicLine("myChart", "_line", name);
            }
          }, 1500);
        });
      }
    },
    bigPic(name) {
      const mdTopng = this.$refs.mdTopng;
      const printable = this.$refs.printable;
      if (mdTopng && printable) {
        mdTopng.setAttribute("style", "flex: 0 0 0px !important; min-width: 0px !important;");
        printable.setAttribute("style", "width: 100% !important;");
      }
      this.writeCom();
      setTimeout(() => {
        this.attackHistory(name);
      }, 2000);
    },
    attackHistory(name) {
      this.takePicLine("myChart", "_line", name);

      setTimeout(() => {
        const mdTopng = this.$refs.mdTopng;
        const printable = this.$refs.printable;
        if (mdTopng && printable) {
          mdTopng.setAttribute("style", "display:block;min-width: 200px !important;");
          printable.setAttribute("style", "width: 900px !important;");
        }
        this.writeCom();
      }, 500);
    },
    async takePic(who, type, name) {
      const html2canvas = this.html2canvasRef || window.html2canvas;
      if (!html2canvas) {
        this.showAlert("缺少套件", "html2canvas 尚未載入");
        return;
      }
      const target = document.getElementById(who);
      if (!target) return;
      const canvas = await html2canvas(target);
      document.body.appendChild(canvas);
      let a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg", 1.0).replace("image/jpeg", "image/octet-stream");
      a.download = name + type + ".jpg";
      a.click();
    },
    takePicLine(who, type, name) {
      let myChart = document.getElementById(who);
      if (!myChart) return;
      let a = document.createElement("a");
      a.href = myChart.toDataURL("image/jpeg", 1.0).replace("image/jpeg", "image/octet-stream");
      a.download = name + type + ".jpg";
      a.click();
    },
  },
};
</script>

<style src="../css/mdeditor.css"></style>
