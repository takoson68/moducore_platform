// listdata.js
import { newData, typeIcon } from './data.js';
 // 遞迴組件 //---子組件命名只能使用全小寫不然會錯誤---

export const listdata = {
  name: "listdata",
  template: '#listdata-component',
  props: ['mdData', 'allPoint','a2zList','treeBox','pointCut'],
  data(){
    //- 子組建要執行本身開關的時候，最好寫在子組建自己身上，
    //- 才不會造成資料無法連動
    return {
      newDD: {
        ...newData
      },
      typeIcon: typeIcon,
      // openF: [],
      textIndex: '',
      showChildren: []
    }
  },
  computed: {
    
  },
  created() {
    try {
      this.mdData.map(e=>{
        e.open=false
        // this.openF.push(true)
        this.showChildren.push(true)
      })
    } catch (error) {
      // console.log('沒下層資料了');
    }
  },
  methods: {
    generateRandomCode(c) { // 產生亂數編碼4碼
      let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < c; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    },
    addNewLine(dd,ii) {
      this.mdData.map(e=>e.open=false)
      let ddNew = this.newDD
      let len = !!dd.children?dd.children.length:0
      ddNew.level = dd.level +'-'+ len
      ddNew.s2 = dd.e2
      
      ddNew.nb = 'nb_'+ this.generateRandomCode(4)

      // let pointLen = this.allPoint.length + this.treeBox.length // 編號位置就是長度位置+1(因為ＡＢ以經被用掉了)
      let rePta2z = this.allPoint.filter(e=>e[0]==ddNew.e) // 判別是否重複主機
      if(!!rePta2z.length){ // 重複主機
        ddNew.e2 = rePta2z[0][1]
        ddNew.end = true
      }else{ // 沒有重複主機，賦予新的編號
        // ddNew.e2 = this.a2zList.splice(0,1)[0]  //就的寫法是把使用過的切掉，但是如果不是一次做好，那要會錯亂
        ddNew.e2 = 'pt_'+ this.generateRandomCode(2)
        ddNew.end = false
      }

      
      let uu =JSON.parse(JSON.stringify(ddNew));
      dd.children = [...dd.children,uu]
      // this.openF.push(true)
      this.newDD = JSON.parse(JSON.stringify({...newData}));
      // this.$forceUpdate();
    },
    changeIp(d,x){ //- 將ip自動輸入於新增資料
      if(!!this.newDD.e){ // 當新增資料的e是有資料的時候執行
        let ip = d.find(e=>e[0]==x)
        this.newDD.ip = ip[2]
      }
    },
    opencreat(dd,ii,qq){// 開啟新增資料
      qq.map((e,j)=>{
        e.open = j==ii ? !e.open : false
      })
      this.newDD.ip = ''
      if(dd.open) {
        this.newDD.s = dd.e
        this.newDD.e = ''
        this.$nextTick(() => {
          this.$refs["input_" + dd.s2+'-'+ii][0].focus()
        })
      }else{
        this.newDD = JSON.parse(JSON.stringify({...newData}));
      }
    },
    removeMe(dd,ii){ // 移除資料 先行詢問告知
      let ask = window.confirm('請注意，子項目將一並刪除\n若重複攻擊的主機被刪除，將會導致線路錯誤\n刪除重複路線即可')
      if ( ask == true) {
        // 將使用過的對象編碼返還
        // this.a2zList = [...this.a2zList,dd[ii].e2]
        // 刪除對象
        dd.splice(ii,1)
      }
    },
    allPointList(d,i){
      return d.filter(e=>e[0]!==i)
    },
    openData(ii) {
      // this.openF[ii] = !this.openF[ii]
      this.showChildren[ii] = !this.showChildren[ii]
      this.$forceUpdate(); //- 這裡需要重新繪出畫面才會更新
    },
    openShowText(item){
      console.log(item.e );
      let isIndex = this.textIndex == item.e 
      let openSet = document.querySelector('.setInText')
      mdBoxApp.setTextIndex = item.e
      // if(isIndex){
      //   openSet.hidden = true
      // }else{
      //   openSet.hidden = false
      // }
      openSet.hidden = !openSet.hidden
      this.textIndex = item.e 
    },
    showChildrenBox(index){
      //- 因為生命週期的關係，第一次運行的時候showChildren會是空陣列，無法辨識是否show所以塞true
      if(this.showChildren[index]==undefined){this.showChildren.push(true)}
      return this.showChildren==undefined?true:this.showChildren[index]
    },
    allowNumeric(event) {
      const key = event.key;
      const input = event.target;
      const value = input.value;
      console.log(this.myEip);
      //- 下面是只能輸入ip的判斷式
      // 允許的按鍵：數字、Backspace、Delete、Tab、方向鍵、小數點
      if (!/^[0-9.]$/.test(key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
        event.preventDefault();
        return;
      }
  
      // 限制小數點：最多 3 個，且不能連續出現
      if (key === '.') {
        const dotCount = (value.match(/\./g) || []).length;
        if (dotCount >= 3 || value.endsWith('.')) {
          event.preventDefault();
          return;
        }
      }
  
      // 限制每段最多 3 位數
      if (/^[0-9]$/.test(key)) {
        // 將 value 按小數點拆分
        const segments = value.split('.');
        const currentSegment = segments[segments.length - 1];
  
        // 如果當前區段已經有 3 位數，阻止輸入
        if (currentSegment.length >= 3) {
          event.preventDefault();
        }
      }
      
      //- 判斷是否有重複ip
      let hasIp = this.allPoint.some(e=> e[2]===value+key)
      if(hasIp){
        alert('重複IP: '+value+key+'\n'+'請確認是否輸入重複IP')
      }
    },
  },
  mounted(){
   
  },
}