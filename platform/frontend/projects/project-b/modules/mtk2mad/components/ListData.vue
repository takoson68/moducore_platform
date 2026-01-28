<template>
  <ul class="listTop">
    <li v-for="(item, index) in safeMdData" :key="index">
      <div class="lsitCon" :class="item.nb">
        <p class="conValue">
          <b class="opencreat" @click="opencreat(item, index, mdData)" title="新增" v-if="!item.end">✛</b>
          <input disabled="disabled" v-model="item.e" />
          <input
            class="inp15"
            v-model="item.ip"
            @keydown="allowNumeric($event)"
            placeholder="攻擊單位 IP"
            :disabled="!!item.end"
          />
          <input v-if="!item.one" v-model="item.n" placeholder="攻擊單位間行為" />
          <input v-if="!item.one" v-model="item.r" placeholder="攻擊 行為內容" />
          <span class="setFlexIcon onlySelect" v-if="!item.one">
            <select v-model="item.textset.icon" :class="item.textset.icon == '' && 'onNo'">
              <option value="" selected="selected">== 無圖片 ==</option>
              <option v-for="icon in typeIcon" :key="icon[0]" :value="icon[0]">{{ icon[1] }}</option>
            </select>
          </span>
          <b class="removeMe" @click="removeMe(mdData, index)" title="刪除(＊子項目將一並刪除)">-</b>
          <span
            class="openUl"
            v-if="item.children && item.children.length > 0"
            :class="showChildren[index] ? 'showClo' : ''"
            @click="openData(index)"
            title="開關"
          >{{ !showChildren[index] ? '▼' : '▲' }}</span>
        </p>
        <p class="addActLine" v-show="item.open">
          <input v-model="newDD.s" disabled="disabled" />
          <span>
            <input v-model="newDD.e" placeholder="目標(書寫或選取)" :ref="'input_' + item.s2 + '-' + index" />
            <select v-model="newDD.e" @change="changeIp(allPoint, newDD.e)">
              <option :value="null" disabled="disabled" selected="selected">選取</option>
              <option v-for="item in allPointList(allPoint, newDD.s)" :key="item[0]" :value="item[0]">
                {{ item[0] }}
              </option>
            </select>
          </span>
          <input v-model="newDD.ip" placeholder="攻擊單位 IP" @keydown="allowNumeric($event)" />
          <input v-model="newDD.n" placeholder="攻擊 單位間行為" />
          <input v-model="newDD.r" placeholder="攻擊 行為內容" />
          <button class="btn" @click="addNewLine(item, index)">新增路線</button>
        </p>
      </div>
      
      <ListData
        v-show="showChildrenBox(index)"
        :md-data="item.children"
        :tree-box="treeBox"
        :all-point="allPoint"
        :a2z-list="a2zList"
      />
      
    </li>
  </ul>
</template>

<script>
import { newData, typeIcon } from "../utils/data.js";

export default {
  name: "ListData",
  props: {
    mdData: {
      type: Array,
      default: () => [],
    },
    allPoint: {
      type: Array,
      default: () => [],
    },
    a2zList: {
      type: Array,
      default: () => [],
    },
    treeBox: {
      type: Array,
      default: () => [],
    },
    pointCut: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      newDD: {
        ...newData,
      },
      typeIcon,
      textIndex: "",
      showChildren: [],
    };
  },
  computed: {
    safeMdData() {
      const source = Array.isArray(this.mdData) ? this.mdData : [];
      return source.length > 0 ? source.filter(Boolean) : source;
    },
  },
  created() {
    this.syncFlags(this.mdData);
  },
  watch: {
    mdData: {
      handler(next) {
        this.syncFlags(next);
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    syncFlags(list) {
      const source = Array.isArray(list) ? list : [];
      source.forEach((item) => {
        if (item && typeof item === "object") {
          if (typeof item.open !== "boolean") {
            item.open = false;
          }
        }
      });
      if (this.showChildren.length !== source.length) {
        this.showChildren = source.map(() => true);
      }
    },
    generateRandomCode(c) {
      let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < c; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    },
    addNewLine(dd, ii) {
      this.mdData.map((e) => (e.open = false));
      let ddNew = this.newDD;
      let len = !!dd.children ? dd.children.length : 0;
      ddNew.level = dd.level + "-" + len;
      ddNew.s2 = dd.e2;

      ddNew.nb = "nb_" + this.generateRandomCode(4);

      let rePta2z = this.allPoint.filter((e) => e[0] == ddNew.e);
      if (!!rePta2z.length) {
        ddNew.e2 = rePta2z[0][1];
        ddNew.end = true;
      } else {
        ddNew.e2 = "pt_" + this.generateRandomCode(2);
        ddNew.end = false;
      }

      let uu = JSON.parse(JSON.stringify(ddNew));
      dd.children = [...dd.children, uu];
      this.newDD = JSON.parse(JSON.stringify({ ...newData }));
    },
    changeIp(d, x) {
      if (!!this.newDD.e) {
        let ip = d.find((e) => e[0] == x);
        this.newDD.ip = ip[2];
      }
    },
    opencreat(dd, ii, qq) {
      qq.map((e, j) => {
        e.open = j == ii ? !e.open : false;
      });
      this.newDD.ip = "";
      if (dd.open) {
        this.newDD.s = dd.e;
        this.newDD.e = "";
        this.$nextTick(() => {
          const ref = this.$refs["input_" + dd.s2 + "-" + ii];
          const el = Array.isArray(ref) ? ref[0] : ref;
          if (el) {
            el.focus();
          }
        });
      } else {
        this.newDD = JSON.parse(JSON.stringify({ ...newData }));
      }
    },
    removeMe(dd, ii) {
      let ask = window.confirm("請注意，子項目將一並刪除\n若重複攻擊的主機被刪除，將會導致線路錯誤\n刪除重複路線即可");
      if (ask == true) {
        dd.splice(ii, 1);
      }
    },
    allPointList(d, i) {
      return d.filter((e) => e[0] !== i);
    },
    openData(ii) {
      this.showChildren[ii] = !this.showChildren[ii];
      this.$forceUpdate();
    },
    showChildrenBox(index) {
      if (this.showChildren[index] == undefined) {
        this.showChildren.push(true);
      }
      return this.showChildren == undefined ? true : this.showChildren[index];
    },
    allowNumeric(event) {
      const key = event.key;
      const input = event.target;
      const value = input.value;

      if (!/^[0-9.]$/.test(key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) {
        event.preventDefault();
        return;
      }

      if (key === ".") {
        const dotCount = (value.match(/\./g) || []).length;
        if (dotCount >= 3 || value.endsWith(".")) {
          event.preventDefault();
          return;
        }
      }

      if (/^[0-9]$/.test(key)) {
        const segments = value.split(".");
        const currentSegment = segments[segments.length - 1];

        if (currentSegment.length >= 3) {
          event.preventDefault();
        }
      }

      const pool = Array.isArray(this.allPoint) ? this.allPoint : [];
      let hasIp = pool.some((e) => e[2] === value + key);
      if (hasIp) {
        alert("重複IP: " + value + key + "\n" + "請確認是否輸入重複IP");
      }
    },
  },
};
</script>
