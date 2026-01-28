// folder.js
import { typeStatus, typeIcon } from './data.js';
// 遞迴組件
export const folder = {
  name: "folder",
  template: '#folder-component',
  props: {
    imgList: [],
    typeStatus: [],
    typeName: [],
    folder: [],
    nbm: Number
  },
  methods: {
    pickFocus(nb){
      // console.log(nb);
      let nbEle = document.querySelector('.'+nb)
      nbEle.focus()
    },
  }

}
