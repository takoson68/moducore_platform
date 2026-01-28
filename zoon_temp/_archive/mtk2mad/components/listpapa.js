// listpapa.js
// 左邊攻擊線段列表~~~~~~~~~

import { listdata } from './listdata.js';
import { newData } from './data.js';

export const listpapa = {
  name: "listpapa",
  template: '#listpapa-component',
  components: {
    'listdata': listdata,
  },
  props: ['mdData', 'allPoint','treeBox'],
  data(){
    return {
      a2z: 'ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz1234567890',
      a2zList: [],
      myS: 'Unknown',
      myE: '',
      myE2: '',
      myEip: '',
      myEnd: false,
      mySBox: ["attacker","Unknown","某沒安裝的內網"],
    }
  },
  computed:{
    aaa(){
      return this.allPoint
    }
  },
  created(){

    this.a2zList = this.a2z.split('');
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
    addStart(){
      let s = JSON.parse(JSON.stringify({...newData}));
      s.s = this.myS
      s.e = this.myS
      s.ip = this.myEip
      s.one = true
      s.end = this.myEnd
      s.nb = 'nb_'+ this.generateRandomCode(4)

      let pt = 'pt_'+ this.generateRandomCode(2) // 開啟新起點
      s.s2 = pt
      s.e2 = pt
      
      this.treeBox.push(s)
      this.myS = 'attacker'
      this.myE = ''
      this.myEip = ''
      this.myEnd = false
      this.myE2 = ''

    },
    allPointList(d,i){
      if(!d){return false}
      return d.filter(e=>e[0]!==i)
    },
    changeIp(d,x){ //- 將ip自動輸入於新增資料
      if(!!this.myE){ // 當新增資料的e是有資料的時候執行
        let ip = d.find(e=>e[0]==x)
        this.myEip = ip[2]
        this.myEnd = true
        this.myE2 = ip[1]
      }
    },
    allowNumeric(event) {
      const key = event.key;
      const input = event.target;
      const value = input.value;

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
  mounted() {

    
  },

}