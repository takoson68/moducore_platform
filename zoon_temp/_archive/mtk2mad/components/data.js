// data.js
export const newData = {
  s: '',
  e: '',
  s2: '',
  e2: '',
  n: '',
  r: '',
  i: null,
  ip: '',
  level: '',
  folder_img: "pc",
  folder_type: [],
  children: [],
  open: false,
  offset: { x: 0, y: 0, e_x: 0, e_y: 0, s_x: 0, s_y: 0, lineBox: 0, color: '#bbbbbb' },
  textset: { x: 0, y: 0, icon: '' },
  nb: '',
  one: false
};

export const typeStatus = [
  ['person', '沒有安裝Agent'], ['password', '偷密碼'], ['file_copy', '偷敏感資料'], ['language', '植入網站後門'], 
  ['wysiwyg', '植入系統後門'], ['subway', '植入Tunnel後門'], ['apps', '植入惡意程式'], ['sensor_door', '常駐後門'], 
  ['do_not_step', '清理足跡'], ['wifi_find', '系統探測'], ['swap_horiz', '橫向攻擊'], ['private_connectivity', '被加密']
];

export const typeIcon = [
  ['search', '回報中繼站'], ['home', '使用者下載惡意程式'], ['menu', '使用者插入USB'], ['close', 'RCE攻擊'], 
  ['settings', '橫向登入入侵'], ['swap_horiz', '橫向探測'], ['star', 'SQL Injection'], ['zoom_in', '上傳Webshell']
];

export const colorsArr = [
  "#bbbbbb", "#353531", "#ffd500", "#ffbe0b", "#ff9505",
  "#fc7232", "#f12939", "#8c1c13", "#ff006e", "#e20074",
  "#ffa6c1", "#8b12db", "#9381ff", "#1B96F1", "#3772ff",
  "#00509d", "#17f4c0", "#38a3a5", "#8ac926", "#007200",
  "#004b23", "#c9a690", "#7b7b7b", "#595950", "#ffc700",
  "#ff9e00", "#ff6d00", "#fa3f17", "#d90f27", "#630800",
  "#cc005b", "#ff93ac", "#9846ce", "#65129c", "#8c703a",
  "#0366d6", "#3385ff", "#004582", "#5fffe9", "#1d8e8a",
  "#6bab36", "#024c00", "#002d15", 
];
