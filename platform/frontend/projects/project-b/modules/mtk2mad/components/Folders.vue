<template>
  <ul>
    <Folder :folder="folder" :nbm="0" :imgList="imgList" :typeStatus="typeStatus" />
  </ul>
</template>

<script>
import { typeStatus, typeIcon } from "../utils/data.js";
import Folder from "./Folder.vue";

export default {
  name: "Folders",
  components: {
    Folder,
  },
  props: {
    folder: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      imgList: [
        "hacker",
        "pc",
        "nb",
        "Server",
        "vpn",
        "Web_Server",
        "SQL_Server",
        "File_Server",
        "Load_Balance",
      ],
      typeStatus,
      typeIcon,
    };
  },
};
</script>
