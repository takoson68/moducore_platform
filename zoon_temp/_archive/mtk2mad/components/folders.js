// folders.js
// 右邊圖示選擇

import { typeStatus, typeIcon } from './data.js';
import { folder } from './folder.js';

export const folders = {
  name: 'root',
  template: '#folders-component',
  props: {
    folder: []
  },
  data() { // 子元件的 data 必須是以 function 的形式回傳物件
    return {
      imgList: ['hacker','pc','nb','Server','vpn','Web_Server','SQL_Server','File_Server','Load_Balance'],
      typeStatus: typeStatus,
      typeIcon: typeIcon,
    }
  },
  components: {
    'folder': folder 
  }
}