
var mdBoxApp = new Vue({
  el: "#mdBox",
  data: {
    urlBox: 'URL_head',
    isDefault: 'MyData.isDefault',
    mdData: '',
    renderData: [],
    endData: [],
    iArr: [['star','00 ~ 08'],['wb_sunny','08 ~ 12'],['brightness_high','12 ~ 18'],['brightness_2','18 ~ 24']],
    cName: [], // 時間 chart
    cData: [], // 次數 chart
    setComment:[''],
    commentBox: [''],
    mtChart: null,// 這裡是要讓外面重繪的時候叫得到
    eventSource: '',
    // eventList: [],
    resizeTimer: null,
    downloadName: '',
  },
  created: function () {
    this.getMd();
  },
  watch: {
    mdData: {
      handler: function(newValue,oldValue) {
        if(oldValue!=[]){
          this.mdToJson(newValue)
          // this.writeCom()
        }
      },
      immediate: false,
      deep: false
    },
  },
  computed: {
    eventList(){
      // 清理文字資料
      let qq = this.eventSource.replaceAll("\\\\n", "\n").replace('\n`','').replace(/^\s*|\s*$/g,"")
      // tab鍵縮排處理
      qq = qq.replaceAll("\t\t\t\t+ ", "+ \t\t\t\t")
      qq = qq.replaceAll("\t\t\t+ ", "+ \t\t\t")
      qq = qq.replaceAll("\t\t+ ", "+ \t\t")
      qq = qq.replaceAll("\t+ ", "+ \t")
      qq.replace('+ `','+ `\n')
      qq = qq.split('\n')
      let ww = []
      // 以加號為準分條擷取成陣列
      qq.forEach(e => {
        ww = [...ww, e.split('+ ')[1]  ]
      });
      // 刪除空陣列(修正多打了換行而無法正確顯示的問題)
      ww = ww.filter(el => el)
      return ww
    },
  },
  mounted() {
    this.dragBox()
    if(!this.mtChart){
      this.renderChart()
    }else{
      this.mtChart.update();
    }
    window.onresize = ()=>{
      clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(()=> {
          //- 此函数会在resize停止的0.5秒时候执行
          this.renderChart();
        }, 250);
    }
  },
  methods: {
    async getMd(){ //測試用資料
      // 取得 md.text 
      axios
        .get('../json/md.text')
        .then(response => {
          this.mdData = response.data
          this.mdToJson(response.data)
        })
        .catch(function (error) { // 请求失败处理
          console.log(error);
        });
    },
    mdToJson(data){
      // JSON.stringify(data)
      // 清理文字資料
      let qq = data.replaceAll("\\\\n", "\n").replace('\n`','').replace(/^\s*|\s*$/g,"")
      qq.replace('+ `','+ `\n')
      qq = data.split('\n')

      let ww = []
      // 以加號為準分條擷取成陣列
      qq.forEach(e => {
        ww = [...ww, e.split('+ ')[1]  ]
      });

      // 刪除空陣列(修正多打了換行而無法正確顯示的問題)
      ww = ww.filter(el => el)

      // 判斷時間格式
      var regex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      // 判斷中文字
      var re = /^[0-9] .?[0-9]*/;//判斷字串是否為數字//判斷正整數/[1−9] [0−9]∗]∗/ 
      var finData = [] // 最終產物
      let ff = [] //不是時間格式的暫存區 

      ww.forEach((s,i) => {
        s = s.replaceAll('/',"-") // 日期格式為 / 的時候替換成 - 
        if(regex.test(s.substring(1, 11))){ //判斷確定是時間格式
          // 時間日期格式不完整的  會塞' 25:00:00'進去  這裡把他當成特別標示處理
          if(isNaN(s.substring(12, 14)*1)){
            s = s.slice(0,11)+' 25:00:00'+s.slice(11)
          }

          // 判斷是否時間格式錯誤 
          let qp = s.split("` ")[0].replace("`","")
          let qt = qp.substring(10, 11)
 
          if(qt!==" "??qt!=="\n"){
            swal('格式錯誤',`錯誤的格式：${qp}`, "error")
          }

          if(ff.length>0){ 
            if(finData.length==0){
              // 又如果第一筆資料是沒有時間的
              // finData第一筆就不會產生陣列，所以這裡要加上第一個
              // 然後將資料命名為start  // start只會出現在第一筆
              finData = [{}]
              finData[0].start = ff
            }else{ // 將ff的資料塞到上一筆命名為ann
              finData[finData.length-1].ann = [...ff]
            }
            finData = [...finData, {
              time: s.substring(1, 20).replace(/^\s*|\s*$/g,"").split(' '),
              con: s.substring(21).replace(/^\s*|\s*$/g,""),
            }]
            ff = []
          }else{ // ff是空陣列的時候正常塞資料
            finData = [...finData, {
              time: s.substring(1, 20).replace(/^\s*|\s*$/g,"").split(' '),
              con: s.substring(21).replace(/^\s*|\s*$/g,""),
            }]
          }
        }else{ // 不是時間格式的
          if(i==ww.length-1){
            // 此時的最後一筆塞進資料
            finData[finData.length-1].ann = [...ff, s]
            ff = []
          }else{
            ff = [...ff, s]
          }
        }
      })
      // console.log(finData);   
      this.renderData = finData
      // 排序時間跟日期
      this.filterTime(finData)
      
    },
    filterTime(finData){  
      let zData = {}
      finData.forEach((el,i)=>{
        if(!el.time){
          zData['0000-00-00'] = [{
            start: el.start,
            time: '00:00:01'
          }]
        }else{
          if(zData[el.time[0]]==undefined){
            zData[el.time[0]] = []
          }
          zData[el.time[0]].push({
            time: el.time[1],
            con: el.con,
            ann: el.ann
          })
        }
      })

      // 把日期排序出來
      let sortDay = Object.keys(zData).sort(function(a, b) {
        return a.replaceAll('-','') - b.replaceAll('-','');
      });

      var okData = []
      sortDay.forEach(el=>{
        let sortArr = []
        // 把時間排序出來
        sortArr = zData[el].sort(function(a, b) {
          return a.time.replaceAll(':','') - b.time.replaceAll(':','');
        });
        okData = [...okData,[el,sortArr]]
      })

      // 把時間 25:00:00 設為當天第一筆資料
      okData.forEach(e=>{
        e[1].forEach(s=>{
          if(s.time.split(':')[0]*1==25){
            e[1] = [e[1].pop(),...e[1]]
          }
        })
      })
      this.endData = okData
      this.makeChart(okData)
      
    },
    makeChart(okData){ 
      let cat = {} // 整理暫存
      let d = "" // 日期
      var cutHour = 0 // 跟上一筆差多少時間
      let n = "" // 日期加上幾點 :: 2021-08-30 10 “上一個日期”
      let v = "" // 記住這個是幾點（比對用）
      let t = 0; // 記錄同一天裡面次數
      var save_25_Time = [] // 紀錄時間是25的日期
      okData.forEach((el,jj)=>{
        if(el[0]!=='0000-00-00'){
          el[1].forEach((e,i)=>{
            let st = e.time.split(':')[0]
            // 發現時間為25的時候，讓最下面使用，這邊拆開最主要原因是不讓命名變成12
            let st_25 = false; 
            if(st=='25'){
              st='12'
              st_25 = true
              save_25_Time.push([el[0],e.con])
            }
            n = el[0]+' '+st
            if(d!==''&&n!==''){ // 兩筆都有時間才能比較
              cutHour = this.calculatingTime(d+' '+v,n)
              if(cutHour>1&&cutHour<=6){ //間隔一到六小時
                let m = Math.ceil(cutHour)
                for (let ij = 1; ij < m; ij++) {
                  let g = parseInt(v) + ij
                  cat[el[0]+' '+g] = 0
                }
              }
              if(cutHour>6&&cutHour<=12){ //間隔六到十二小時
                let f = Math.ceil(cutHour/2)
                for (let ij = 1; ij < f; ij++) {
                  let g = parseInt(v) + ij*2
                  cat[el[0]+' '+g] = 0
                }
              }
              if(cutHour>12&&cutHour<=48){ //間隔十二小時到兩天
                let m = Math.ceil(cutHour/6)
                for (let iu = 1; iu < m; iu++) {
                  cat[d+' ( + '+iu*6+'hr)'] = 0
                }
              }
              let im = 24*30
              if(cutHour>48&&cutHour<=im){ //間隔兩天到一格月
                let m = Math.ceil(cutHour/48)
                for (let iu = 1; iu < m; iu++) {
                  cat[d+' ( + '+iu*2+'day)'] = 0
                }
              }
              if(cutHour>im){ //間隔一個月以上
                let m = Math.ceil(cutHour/im)
                for (let iu = 1; iu < m; iu++) {
                  cat[d+' ( + '+iu+'mo.)'] = 0
                }
              }
            }
            if(st!==v){
              t = 0
              v = st
            }
            t++
            if(st_25){ // 特別標示25的時間會用12點去標示時間當此次時間
              t = 0 
              cat[el[0]+' '] = 1
              v = '12'
            }else {
              cat[n] = t
            }
            d = el[0]
          })

        }
        t = 0
      })

      this.cName = Object.keys(cat)
      let pp = []
      this.cName.forEach(e=>{
        pp = [...pp,cat[e]];
      })

      this.cData = pp
      this.setComment = this.cName.map(e=>e[0]!=='+'?e:'')
      this.commentBox = this.setComment.map(()=>['',-3])
      // console.log(this.setComment);

      if(pp.length<4){
        // 如果只有一筆或兩筆資料，前後各添一筆
        let t_c = this.setComment[0]+":00:00"
        t_c = t_c.replaceAll('-','/')
        let t_c_1 = new Date(t_c)
        t_c_1.setHours(t_c_1.getHours() - 1);  
        let t_c_1_0 = `${t_c_1.getFullYear()}-${(t_c_1.getMonth()*1<10?'0':'')+(t_c_1.getMonth()+1)}-${(t_c_1.getDate()*1<10?'0':'')+t_c_1.getDate()} ${(t_c_1.getHours()*1<10?'0':'')+t_c_1.getHours()}`

        let t_d = this.setComment[this.setComment.length-1]+":00:00"
        t_d = t_d.replaceAll('-','/')
        let t_d_1 = new Date(t_d)
        t_d_1.setHours(t_d_1.getHours() + 1);  
        let t_d_1_0 = `${t_d_1.getFullYear()}-${(t_d_1.getMonth()*1<10?'0':'')+(t_d_1.getMonth()+1)}-${(t_d_1.getDate()*1<10?'0':'')+t_d_1.getDate()} ${(t_d_1.getHours()*1<10?'0':'')+t_d_1.getHours()}`

        this.setComment = [t_c_1_0,...this.setComment,t_d_1_0]
        this.commentBox = [['',-3],...this.commentBox,['',-3]]
        
        this.cName = this.setComment
        this.cData = [0,...pp,0]
      }
      save_25_Time.forEach(e=>{ // 折線圖註解標示
        let su = this.setComment.indexOf(e[0]+' ')
        if(su>=0){
          this.commentBox[su][0]=e[1]
        }
      })
      if(!this.mtChart){
        this.mtChart.update();
      }else{
        this.renderChart()
      }
    },
    calculatingTime(p,l){
      // 計算兩個時間差幾小時
      var ONE_HOUR = 1000 * 60 * 60;  // 1小時的毫秒數
      let d = p+":00:00"
      let n = l+":00:00"
      let a = d.replaceAll('-','/')
      let b = n.replaceAll('-','/')

      var Date_A = new Date(a);  
      var Date_B = new Date(b);  
      var diff = Date_B - Date_A
      
      var leftHours = Math.floor(diff/ONE_HOUR);
      if(leftHours > 0) diff = diff - (leftHours * ONE_HOUR);
      
      return leftHours
    },
    cutTime(dd){
      let time = dd.replace('-',' ').replace('-','/').split(' ')
      return time
    },
    SelectPic(ss){
      let oo = parseInt(ss.split(':')[0])
      let icon = oo<8?'star':oo<12?'wb_sunny':oo<18?'brightness_high':oo<24?'brightness_2':'settings_suggest'
      return icon
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
    dragBox(){
      var x_pos,startX;
      let printable = document.querySelector('#printable');
      let dragDiv = document.querySelector('.dragBox');
      dragDiv.addEventListener('mousedown',dragStart);
      
      function dragStart(e) {
        x_pos = printable.offsetWidth
        e.preventDefault();
        //記錄點擊相對被點擊物件的座標
        startX = e.clientX - dragDiv.offsetLeft;
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stop);
      }
      function move(e) {
        //計算出拖曳物件的距離計算寬度
        let x = e.clientX - startX;
        printable.style.width = x_pos - x +'px';
      }
      function stop() {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', stop);
          mdBoxApp.writeCom()
      }
    },
    writeCom(){
      this.mtChart.destroy();
      this.renderChart()
      // this.mtChart.resize();
      // this.mtChart.clear()
      // this.mtChart.update();
    },
    pickMeWord(d){
      //這個用字串方式
      let srt = d
      let pickW = false
      function wwBox(){
        pickW = !pickW
        return pickW?'<em>':'</em>'
      }
      // IE11 沒有replaceAll方法  改用 正則 g 表示全域
      srt = srt.replace(/`/g, wwBox)
      let y = srt.split('\t').length-1
      // console.log(y);
      return [srt,y] 
    },

  },
});


var fn1 = (e) => Promise.resolve(e);
//  下載圖片
var MdText = document.querySelector('.mdTopng')
var Printable = document.querySelector('#printable');

function screenshot(){
  let name = window.prompt('請輸入檔案名稱', '');
  if(!!name){
    this.downloadName = name
    fn1(
      TakePic('attackHistory','_history',name)
    ).then(
      setTimeout(function() {
        let Big = window.confirm('放大攻擊次數統計圖？');
        if(Big){ //選大圖
          bigPic(name)
        }else{ //直接畫
          TakePic_line('myChart','_line',name)
        }

      }, 1500)
    );
  }
}
function bigPic(name) {
  MdText.setAttribute('style','flex: 0 0 0px !important; min-width: 0px !important;');
  Printable.setAttribute('style','width: 100% !important;')
  mdBoxApp.writeCom()
  setTimeout(function() {
    attackHistory(name)
  }, 2000)
}

function attackHistory(name) {
  TakePic_line('myChart','_line',name)
  
  setTimeout(function() {
    MdText.setAttribute('style','display:block;min-width: 200px !important;');
    Printable.setAttribute('style','width: 900px !important;')
    mdBoxApp.writeCom()
  }, 500);

}

function TakePic(who,type,name){
  html2canvas(document.getElementById(who)).then(function (canvas) {
    document.body.appendChild(canvas);
    let a = document.createElement('a');
    a.href = canvas.toDataURL("image/jpeg", 1.0).replace("image/jpeg", "image/octet-stream");
    a.download = name+type+'.jpg';
    a.click();
  });
}


function TakePic_line(who,type,name){
  let myChart = document.getElementById(who)
  let a = document.createElement('a');
  a.href = myChart.toDataURL("image/jpeg", 1.0).replace("image/jpeg", "image/octet-stream");
  a.download = name+type+'.jpg'
  a.click();

}

