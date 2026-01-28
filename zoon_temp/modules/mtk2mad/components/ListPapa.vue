<template>
  <div class="lsitCon">
    <p class="acct addActLine">
      <span>
        <input v-model="myS" placeholder="新增攻擊來源" />
        <select v-model="myS">
          <option :value="null" disabled="disabled" selected="selected">選取</option>
          <option v-for="(item, j) in mySBox" :key="j" :value="item">{{ item }}</option>
        </select>
      </span>
      <input v-model="myEip" @keydown="allowNumeric($event)" placeholder="攻擊來源 IP" />
      <button class="btn acctS" @click="addStart">新增來源</button>
    </p>
    <ListData
      :md-data="safeMdData"
      :tree-box="treeBox"
      :all-point="allPoint"
      :a2z-list="a2zList"
      :point-cut="aaa"
    />
  </div>
</template>

<script>
import { newData } from "../utils/data.js";
import ListData from "./ListData.vue";

export default {
  name: "ListPapa",
  components: {
    ListData,
  },
  props: {
    mdData: {
      type: Array,
      default: () => [],
    },
    allPoint: {
      type: Array,
      default: () => [],
    },
    treeBox: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      a2z: "ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz1234567890",
      a2zList: [],
      myS: "Unknown",
      myE: "",
      myE2: "",
      myEip: "",
      myEnd: false,
      mySBox: ["attacker", "Unknown", "某沒安裝的內網"],
    };
  },
  computed: {
    aaa() {
      return this.allPoint;
    },
    safeMdData() {
      return Array.isArray(this.mdData) ? this.mdData.filter(Boolean) : [];
    },
  },
  created() {
    this.a2zList = this.a2z.split("");
  },
  methods: {
    generateRandomCode(c) {
      let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < c; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    },
    addStart() {
      let s = JSON.parse(JSON.stringify({ ...newData }));
      s.s = this.myS;
      s.e = this.myS;
      s.ip = this.myEip;
      s.one = true;
      s.end = this.myEnd;
      s.nb = "nb_" + this.generateRandomCode(4);

      let pt = "pt_" + this.generateRandomCode(2);
      s.s2 = pt;
      s.e2 = pt;

      this.treeBox.push(s);
      this.myS = "attacker";
      this.myE = "";
      this.myEip = "";
      this.myEnd = false;
      this.myE2 = "";
    },
    allPointList(d, i) {
      if (!d) {
        return false;
      }
      return d.filter((e) => e[0] !== i);
    },
    changeIp(d, x) {
      if (!!this.myE) {
        let ip = d.find((e) => e[0] == x);
        this.myEip = ip[2];
        this.myEnd = true;
        this.myE2 = ip[1];
      }
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
