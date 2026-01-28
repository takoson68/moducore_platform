<template>
  <li :class="'flo_' + nbm" v-if="!folder.end">
    <div class="boxName" :class="folder.one && 'art'">
      <div
        class="imgBox"
        @click="pickFocus(folder.nb)"
        :id="'point_' + folder.e2"
        :style="`background-image: url(/mtk2mad/images/${folder.folder_img}.jpeg)`"
      >
        <div class="typeStatusBox">
          <div
            class="typeStatus"
            v-if="folder.folder_type.length > 0"
            v-for="(dd, ii) in folder.folder_type"
            :key="ii"
          >
            <span class="material-icons material-icons-outlined">{{ dd }}</span>
          </div>
        </div>
        <div class="imgListBox">
          <ul>
            <b>主機種類</b>
            <li v-for="(dd, ii) in imgList" :key="ii">
              <input :value="dd" :id="'img_' + folder.e2 + '_' + dd" v-model="folder.folder_img" type="radio" />
              <label :for="'img_' + folder.e2 + '_' + dd">{{ dd }}</label>
            </li>
          </ul>
          <hr />
          <ul>
            <b>狀態標示 (多選)</b>
            <li v-for="(ss, ii) in typeStatus" :key="ii">
              <input :value="ss[0]" :id="'type_' + folder.e2 + '_' + ss[0]" v-model="folder.folder_type" type="checkbox" />
              <label :for="'type_' + folder.e2 + '_' + ss[0]">{{ ss[1] }}</label>
            </li>
          </ul>
        </div>
      </div>
      <b>
        <em :class="!folder.ip && 'noBrb'">{{ folder.e }}</em>
        <small v-if="!!folder.ip">{{ folder.ip }}</small>
      </b>
    </div>
    <ul v-if="folder.children && folder.children.length > 0">
      <Folder
        v-for="(child, ii) in folder.children"
        :key="ii"
        :folder="child"
        :nbm="ii"
        :imgList="imgList"
        :typeStatus="typeStatus"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: "Folder",
  props: {
    imgList: {
      type: Array,
      default: () => [],
    },
    typeStatus: {
      type: Array,
      default: () => [],
    },
    typeName: {
      type: Array,
      default: () => [],
    },
    folder: {
      type: Object,
      required: true,
    },
    nbm: {
      type: Number,
      default: 0,
    },
  },
  methods: {
    pickFocus(nb) {
      const nbEle = document.querySelector("." + nb);
      if (nbEle) {
        nbEle.focus();
      }
    },
  },
};
</script>
