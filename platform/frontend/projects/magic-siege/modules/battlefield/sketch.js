import { board, cellAt, fullscreen, nextWave, panel, pause, refresh, speed } from './layout.js';
import { createWaveSequence, routePosition, towerLevels } from './simulation.js';
import { getBattlefieldMap, mapPathCells } from './maps.js';

const releaseVersion = import.meta.env.VITE_RELEASE_VERSION || 'dev';

const key = (col, row) => `${col},${row}`;
const pathCells = mapPathCells(1);
const obstacles = new Set([[0,5],[2,0],[3,7],[7,0],[8,8]].map(([c,r]) => key(c,r)));
const pathCellsFor = (state) => state.level === 2 ? mapPathCells(2) : pathCells;
const obstaclesFor = (state) => new Set(getBattlefieldMap(state.level || 1).obstacles.map(([c,r]) => key(c,r)));
const buildButton = { x: panel.x + 72, y: panel.y + 382, width: panel.width - 144, height: 62 };
const upgradeButton = { x: panel.x + 24, y: panel.y + 382, width: 190, height: 62 };
const sellButton = { x: panel.x + 230, y: panel.y + 382, width: 154, height: 62 };
const resetButton = { x: panel.x + 110, y: panel.y + 466, width: panel.width - 220, height: 42 };
const endingRestart = { x: 570, y: 604, width: 300, height: 68 };
const contains = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

function cellKind(state, col, row) {
  if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || row < 0 || col >= board.cols || row >= board.rows) return '未選取';
  if (pathCellsFor(state).has(key(col, row))) return '道路';
  if (obstaclesFor(state).has(key(col, row))) return '障礙物';
  if (state.towers.some((tower) => tower.col === col && tower.row === row)) return '魔法塔';
  return '可建造';
}
function button(p, rect, label, primary = false, disabled = false) {
  p.stroke(disabled ? '#33404d' : primary ? '#63dbff' : '#3d5872'); p.strokeWeight(primary ? 2 : 1);
  p.fill(disabled ? '#1b2633' : primary ? '#086a9e' : '#162337'); p.rect(rect.x, rect.y, rect.width, rect.height, 10);
  p.noStroke(); p.fill(disabled ? '#657383' : '#e4f4ff'); p.textAlign(p.CENTER, p.CENTER); p.textSize(primary ? 22 : 16); p.text(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
}
function drawHeader(p, state) {
  p.noStroke(); p.fill('#0b1525'); p.rect(0,0,1440,82); p.fill('#63d9ff'); p.rect(32,23,34,33,4); p.rect(38,15,7,12); p.rect(53,15,7,12);
  p.fill('#d9edff'); p.textAlign(p.LEFT,p.CENTER); p.textStyle(p.BOLD); p.textSize(32); p.text('攻破魔法城',82,40); p.textStyle(p.NORMAL); p.fill('#7e9ab5'); p.textSize(12); p.text(`v${releaseVersion}`,250,52);
  p.textAlign(p.CENTER,p.CENTER); p.textSize(22); p.text(`第 ${state.wave} / 10 波`,740,29); p.stroke('#294258'); p.strokeWeight(4); p.line(630,61,850,61);
  for(let i=0;i<10;i+=1){p.noStroke();p.fill(i<state.wave?'#23d9ef':'#334b63');p.circle(630+i*24.4,61,i===state.wave-1?14:10);}
  p.fill('#ff7094');p.textSize(25);p.text('♥',1018,39);p.fill('#d9edff');p.textSize(18);p.text('生命',1066,39);p.textSize(25);p.text(String(state.lives),1124,39);
  p.fill('#ffc94f');p.text('⬡',1148,39);p.fill('#d9edff');p.textSize(18);p.text('金幣',1195,39);p.fill('#ffe584');p.textSize(25);p.text(String(state.gold),1255,39);
  button(p,speed,`${state.speed || 1}×`,false,!['battle','paused'].includes(state.mode));
  button(p,pause,state.mode==='paused'?'▶':'Ⅱ',false,!['battle','paused'].includes(state.mode));
}
function drawTower(p,tower,selected){const x=board.x+tower.col*board.cell+34,y=board.y+tower.row*board.cell+32,stats=towerLevels[tower.level];if(selected && selected.col===tower.col&&selected.row===tower.row){p.noFill();p.stroke('#28dfff');p.strokeWeight(2);p.circle(x,y+2,stats.range*2);}p.stroke('#8ce9ff');p.strokeWeight(2);p.fill(tower.level===3?'#8d4bc4':tower.level===2?'#326bd0':'#277ab5');p.triangle(x,y-22,x-19-tower.level*2,y+20,x+19+tower.level*2,y+20);p.fill('#bff4ff');p.circle(x,y-24,7+tower.level*2);}
function drawEnemy(p,enemy,level=1){const point=routePosition(enemy.distance,level),large=enemy.type==='large',size=large?34:24,bar=large?42:32;p.noStroke();p.fill('#35182e');p.rect(point.x-bar/2,point.y-size/2-11,bar,4,2);p.fill(large?'#ffbd5c':'#ff557f');p.rect(point.x-bar/2,point.y-size/2-11,bar*enemy.hp/enemy.maxHp,4,2);p.stroke(large?'#ffb24d':'#ff6d9e');p.strokeWeight(3);p.fill(large?'#4a2a31':'#281a39');p.circle(point.x,point.y,size);p.noStroke();p.fill(large?'#ffe19a':'#ff8ab0');p.circle(point.x-5,point.y-2,4);p.circle(point.x+5,point.y-2,4);}
function drawBoard(p,state){
  for(let row=0;row<board.rows;row+=1)for(let col=0;col<board.cols;col+=1){const x=board.x+col*board.cell,y=board.y+row*board.cell,kind=cellKind(state,col,row);p.stroke('#263d57');p.strokeWeight(1);p.fill(kind==='道路'?'#424163':kind==='障礙物'?'#172237':'#0d4746');p.rect(x+2,y+2,board.cell-4,board.cell-4,4);if(kind==='可建造'){p.noStroke();p.fill('#289684');p.triangle(x+29,y+46,x+34,y+31,x+39,y+46);}if(kind==='障礙物'){p.fill('#48506c');p.stroke('#606b8f');p.triangle(x+16,y+49,x+32,y+15,x+55,y+50);p.triangle(x+28,y+52,x+47,y+27,x+60,y+53);}}
  const map = getBattlefieldMap(state.level || 1);
  p.noFill();p.stroke('#8b8ae1');p.strokeWeight(3);p.beginShape();for(const[c,r]of map.route)p.vertex(board.x+c*board.cell+34,board.y+r*board.cell+34);p.endShape();
  const start=map.route[0],portal={x:board.x+start[0]*board.cell+34,y:board.y+start[1]*board.cell+34};p.noFill();p.stroke('#42eaff');p.strokeWeight(6);p.circle(portal.x,portal.y,48);p.stroke('#80aaff');p.strokeWeight(3);p.circle(portal.x,portal.y,30);
  const end=map.route.at(-1),castle={x:board.x+end[0]*board.cell+7,y:board.y+end[1]*board.cell-24};p.stroke('#b047b2');p.strokeWeight(2);p.fill('#373650');p.rect(castle.x,castle.y,54,116,4);p.rect(castle.x-13,castle.y+30,19,86,3);p.fill('#ec59d1');p.triangle(castle.x+27,castle.y+42,castle.x+14,castle.y+96,castle.x+40,castle.y+96);
  for(const tower of state.towers)drawTower(p,tower,state.selected);for(const enemy of state.enemies)drawEnemy(p,enemy,state.level||1);for(const bullet of state.bullets){p.noStroke();p.fill('#ffd66b');p.circle(bullet.x,bullet.y,9);}
  if(state.selected){const sx=board.x+state.selected.col*board.cell,sy=board.y+state.selected.row*board.cell;p.noFill();p.stroke('#4cecff');p.strokeWeight(4);p.rect(sx+4,sy+4,board.cell-8,board.cell-8,3);}
}
function drawPanel(p,state){
  const selected=state.selected || { col: -1, row: -1 },kind=cellKind(state,selected.col,selected.row),tower=state.towers.find((item)=>item.col===selected.col&&item.row===selected.row),stats=tower?towerLevels[tower.level]:towerLevels[1];p.stroke('#365777');p.strokeWeight(2);p.fill('#101c2e');p.rect(panel.x,panel.y,panel.width,panel.height,10);
  p.fill(kind==='可建造'?'#49d7ba':kind==='魔法塔'?'#6ccfff':'#8da0b7');p.noStroke();p.circle(panel.x+62,panel.y+61,24);p.fill('#dcedff');p.textAlign(p.LEFT,p.CENTER);p.textStyle(p.BOLD);p.textSize(27);p.text(kind,panel.x+102,panel.y+61);p.textStyle(p.NORMAL);
  p.fill('#87a0b9');p.textSize(14);p.text(kind==='未選取'?'已取消格子選取':`格子 ${selected.col+1} × ${selected.row+1}`,panel.x+30,panel.y+112);p.stroke('#29445f');p.line(panel.x+30,panel.y+140,panel.x+panel.width-30,panel.y+140);
  const previewWave = state.mode === 'ready' ? state.wave : Math.min(10, state.wave + 1);
  const preview = createWaveSequence(previewWave);
  const previewSmall = preview.filter((type) => type === 'small').length;
  const previewLarge = preview.filter((type) => type === 'large').length;
  p.noStroke();p.fill('#b9cde0');p.textAlign(p.CENTER,p.CENTER);p.textSize(14);
  p.text(state.mode === 'ready' ? `第 ${previewWave} 波預覽：小怪 ${previewSmall}・大怪 ${previewLarge}・共 ${preview.length}` : `下一波：小怪 ${previewSmall}・大怪 ${previewLarge}・共 ${preview.length}`,panel.x+panel.width/2,panel.y+166);
  if(previewLarge>0){p.fill('#ffbd5c');p.textSize(13);p.text('含高生命／高突破傷害的大怪',panel.x+panel.width/2,panel.y+188);}
  p.noStroke();p.fill('#dceeff');p.textAlign(p.CENTER,p.CENTER);p.textSize(22);p.text(kind==='魔法塔'?`Lv.${tower.level} 魔法塔`:kind==='可建造'?'Lv.1 魔法塔':'此格不可建造',panel.x+panel.width/2,panel.y+226);
  p.fill('#91a8bd');p.textSize(15);p.text(kind==='可建造'?'射程 140　傷害 10　冷卻 1.0 秒':kind==='魔法塔'?`射程 ${stats.range}　傷害 ${stats.damage}　冷卻 ${stats.cooldown} 秒`:'道路與障礙物必須保持暢通',panel.x+panel.width/2,panel.y+268);
  p.fill('#dbeaff');p.textSize(18);p.text(kind==='可建造'?'花費　10 金幣':kind==='魔法塔'?`累計投資　${tower.spent} 金幣`:'無可用操作',panel.x+panel.width/2,panel.y+334);
  if(kind==='魔法塔'){p.fill('#8fa9c1');p.textSize(13);p.text(`本局傷害 ${Math.round(tower.damage||0)}　擊殺 ${tower.kills||0}`,panel.x+panel.width/2,panel.y+358);}
  if(kind==='可建造')button(p,buildButton,state.gold>=10?'建造魔法塔':'金幣不足',true,state.gold<10);
  if(kind==='魔法塔'){const max=tower.level>=3,next=max?null:towerLevels[tower.level+1];button(p,upgradeButton,max?'已達最高等級':`升級 ${next.cost}`,true,max||state.gold<next.cost);button(p,sellButton,`拆除 +${Math.floor(tower.spent*.5)}`);}
  button(p,resetButton,'重新開始');p.fill('#7990a8');p.textSize(14);p.text(state.notice,panel.x+panel.width/2,panel.y+538);
  if(state.waveSummary){const summary=state.waveSummary;p.fill('#9bb2c8');p.textSize(12);p.text(`上波結算：擊殺 ${summary.kills}・突破 ${summary.breaches}・金幣 +${summary.goldEarned}・生命 -${summary.livesLost}`,panel.x+panel.width/2,panel.y+560);}
  const waveSize=createWaveSequence(state.wave).length,label=state.mode==='ready'?`開始第 ${state.wave} 波  »`:state.mode==='battle'?`戰鬥中・剩餘 ${state.enemies.length+waveSize-state.spawnIndex}`:state.mode==='paused'?'遊戲已暫停':state.mode==='victory'?'十波防守成功 ✓':'魔法城失守';button(p,nextWave,label,true,state.mode!=='ready');button(p,fullscreen,'⛶ 全螢幕',false,false);button(p,refresh,'↻ 重新整理',false,false);
}
function drawEnding(p,state){
  const victory=state.mode==='victory';
  p.noStroke();p.fill('#020713df');p.rect(0,0,1440,810);
  if(victory){
    const colors=['#55e8ff','#ffe477','#ff71c8','#8fffba'];
    for(let i=0;i<64;i+=1){const phase=(p.millis()*.055+i*73)%920,x=(i*197)%1440,y=phase-70,size=5+(i%4)*2;p.fill(colors[i%colors.length]);p.push();p.translate(x,y);p.rotate((phase+i)*.018);p.rect(-size/2,-size/2,size,size*1.7,2);p.pop();}
    for(let ring=0;ring<4;ring+=1){p.noFill();p.stroke(74,221,255,110-ring*20);p.strokeWeight(3);p.circle(720,272,150+ring*35+(p.millis()*.025)%35);}
  }
  p.stroke(victory?'#56ddff':'#c44c72');p.strokeWeight(3);p.fill(victory?'#0e2541ed':'#291523ed');p.rect(390,130,660,590,18);
  p.noStroke();p.fill(victory?'#ffe77e':'#ff789c');p.textAlign(p.CENTER,p.CENTER);p.textStyle(p.BOLD);p.textSize(28);p.text(victory?'✦  魔法城守住了  ✦':'魔法城失守',720,188);
  p.fill('#eaf7ff');p.textSize(54);p.text(victory?'十波通關！':'防線被突破',720,268);p.textStyle(p.NORMAL);
  p.fill(victory?'#74e6ff':'#ff9bb5');p.textSize(20);p.text(victory?'你的魔法塔照亮了整座城。':'重新整備，再守護一次魔法城。',720,326);
  p.stroke('#34516d');p.strokeWeight(1);p.line(490,370,950,370);p.noStroke();
  p.fill('#9ab1c8');p.textSize(16);p.text('完成波次',540,418);p.text('擊殺敵人',720,418);p.text('剩餘生命',900,418);
  p.fill('#f0f8ff');p.textStyle(p.BOLD);p.textSize(34);p.text(victory?'10 / 10':`${state.wave-1} / 10`,540,466);p.text(String(state.kills),720,466);p.text(String(state.lives),900,466);p.textStyle(p.NORMAL);
  p.fill('#839ab1');p.textSize(15);p.text(victory?'第一座魔法城，防守成功。這只是冒險的開始。':'調整塔的位置與升級時機，再次挑戰。',720,538);
  button(p,endingRestart,state.level===1&&victory?'進入第二關':'重新開始',true);
}
export function createBattlefieldSketch(session,simulation,action){return{
  draw(p,elapsed){simulation.tick(elapsed);p.background('#07101e');p.textFont('PingFang TC, Noto Sans TC, sans-serif');drawHeader(p,session.state);drawBoard(p,session.state);drawPanel(p,session.state);p.noStroke();p.fill('#60778e');p.textAlign(p.LEFT,p.CENTER);p.textSize(12);p.text('MVP 幾何原型・擊殺 '+session.state.kills,32,790);if(['victory','defeat'].includes(session.state.mode))drawEnding(p,session.state);},
  pointer(point){if(contains(fullscreen,point)){action('fullscreen');return;}if(contains(refresh,point)){action('reload');return;}if(contains(speed,point)&&['battle','paused'].includes(session.state.mode)){simulation.setSpeed((session.state.speed||1)===1?2:(session.state.speed===2?4:1));return;}if(['victory','defeat'].includes(session.state.mode)){if(contains(endingRestart,point)){if(session.state.mode==='victory'&&session.state.level===1)simulation.startLevel(2);else action('reset');}return;}if(contains(pause,point)&&['battle','paused'].includes(session.state.mode)){action(session.state.mode==='paused'?'resume':'pause');return;}if(contains(resetButton,point)){action('reset');return;}if(contains(nextWave,point)){simulation.startWave();return;}const selectedTower=session.state.selected || { col: -1, row: -1 },kind=cellKind(session.state,selectedTower.col,selectedTower.row);if(contains(buildButton,point)&&kind==='可建造'){simulation.build();return;}if(contains(upgradeButton,point)&&kind==='魔法塔'){simulation.upgrade();return;}if(contains(sellButton,point)&&kind==='魔法塔'){simulation.sell();return;}const selected=cellAt(point);if(!selected){session.set({selected:null,notice:'已取消格子選取。'});return;}const selectedKind=cellKind(session.state,selected.col,selected.row);session.set({selected,notice:selectedKind==='可建造'?'這裡可以建造魔法塔。':selectedKind==='魔法塔'?'可升級或拆除這座魔法塔。':`${selectedKind}不可建造。`});},
  key(value){if(value.toLowerCase()==='r')action('reset');else if(value==='Enter'&&session.state.mode==='ready')simulation.startWave();else if(value===' '&&['battle','paused'].includes(session.state.mode))action(session.state.mode==='paused'?'resume':'pause');}
};}
