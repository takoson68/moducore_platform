export function _linkMaker(dd, linkData) {
  // console.log(dd);
  // let linkData = this.listBoxData;
  let s = dd.s2; // 起點編號
  let e = dd.e2; // 終點編號
  let i = dd.i;
  let offset = dd.offset;
  //- (x,y,w,h)

  let x = linkData[e][0] - linkData[s][0]; // 線段水平距離
  let y = linkData[e][1] - linkData[s][1]; // 線段垂直距離

  var link = "";
  // offset: {x:0,y:0,e_x:0,e_y:0,s_x:0,s_y:0} offset起點終點的偏差值 (偏差值預計是由手動調整產生記錄在json)
  // e終點 s起點 x,y偏差值=紀錄線條中間段的偏移(h,v) H(水平),V(垂直)是畫布上絕對定位h,v是移動距離
  // 例如 let link = `M${ss[0]},${ss[1]} h${x} v${y} L${ee[0]},${ee[1]}`;
  let ww = 192; // 物件的寬
  let hh = 180; // 物件的高
  let s_x, s_y, e_x, e_y;
  // let s_x = linkData[s][0] // 起點x
  // let s_y = linkData[s][1] // 起點y
  // let e_x = linkData[e][0] // 終點x
  // let e_y = linkData[e][1] // 終點y

  //------  文字方塊
  var textPos = [0, 0];

  //-------------- 分析攻擊線位置--------------
  if (x > 0) {
    // 左向右攻擊(父輩向子輩) // 包含沒跳輩份的水平攻擊
    s_x = linkData[s][0] + ww;
    s_y = linkData[s][1] + hh / 2;
    e_x = linkData[e][0] - ww / 3;
    e_y = linkData[e][1] + hh / 2;
    let v_y;

    link = `M${s_x},${s_y} h${(x - ww) / 4} V${e_y} L${e_x},${e_y}`;
    textPos = [linkData[e][0] - 200, linkData[e][1] + hh / 1.5 - 30];

    if (Math.abs(x) > 500) {
      // 隔代攻擊 (目標在上面)
      v_y = -40;
      link = `M${s_x - ww / 1.5},${s_y - hh / 1.5} V${linkData[e][1] + v_y} H${
        e_x + ww / 1.5
      } L${e_x + ww / 1.5},${e_y - hh / 1.5}`;
      textPos = [linkData[e][0] - 220, linkData[e][1] - 40];
      if (y == 0) {
        // 水平 祖向孫
        v_y = 40;
        link = `M${s_x - ww / 1.5},${s_y + hh / 2} v${v_y} H${
          e_x + ww / 1.5
        } L${e_x + ww / 1.5},${e_y + hh / 2}`;
        textPos = [linkData[e][0] - 220, linkData[e][1] + hh + 40];
      }
      if (y > 0) {
        // 中間有跳輩份 祖向孫 (目標在下方)
        v_y = 30;
        link = `M${s_x - ww / 1.5},${s_y + hh / 2} V${e_y + hh / 2 + v_y} H${
          e_x + ww / 1.5
        } L${e_x + ww / 1.5},${e_y + hh / 2}`;
        textPos = [linkData[e][0] - 220, linkData[e][1] + hh + 20];
      }

      if (Math.abs(y) > 420) {
        v_y = 50;
        link = `M${s_x - ww / 1.5 + 60},${s_y - hh / 2 - 20} h${hh - 20} V${
          e_y + hh / 2 + v_y
        } H${e_x + ww / 1.5} L${e_x + ww / 1.5},${e_y + hh / 2}`;
        textPos = [linkData[e][0] - 220, linkData[e][1] + hh + 20];
      }
      // if(y>-300){
      //   v_y = 50
      //   link = `M${s_x-(ww/1.5)+60},${s_y-hh/2-20} v${-v_y} H${e_x+(ww/1.5)-50} V${e_y+(hh/2)} L${e_x+(ww/1.5)},${e_y+(hh/2)}`;
      //   textPos = [linkData[e][0]-220,linkData[e][1] + hh +20]
      //   console.log(dd);
      // }

      // if(y>410){
      //   link = `M${s_x-(ww/1.5)+60},${s_y-hh/2-20} h${hh-20} V${e_y+(hh/2)+v_y} H${e_x+(ww/1.5)} L${e_x+(ww/1.5)},${e_y+(hh/2)}`;
      // }
      // if(y<-420){
      //   v_y = 70
      //   link = `M${s_x-(ww/1.5)},${s_y-(hh/1.5)} V${linkData[e][1]+v_y} H${e_x+(ww/1.5)} L${e_x+(ww/1.5)},${e_y-(hh/1.5)}`;
      //   textPos = [linkData[e][0]-220,linkData[e][1] + hh +20]
      // }
    }
  }

  if (x == 0) {
    // 垂直攻擊
    s_x = y > 0 ? linkData[s][0] + ww / 4 : linkData[s][0] + ww / 2;
    s_y = y > 0 ? linkData[s][1] + hh + 10 : linkData[s][1] - 20;
    e_x = y > 0 ? linkData[e][0] + ww / 4 : linkData[e][0] + ww / 2;
    e_y = y < 0 ? linkData[e][1] + hh + 20 : linkData[e][1] - 30;

    link = `M${s_x},${s_y} L${e_x},${e_y}`;
    textPos = [linkData[e][0] - 80, e_y - 40];
    if (y < 0) {
      textPos = [linkData[e][0] + ww / 1.5 - 20, linkData[e][1] + hh + 50];
    }
    if (Math.abs(y) < 200) {
      link = `M${s_x},${s_y} L${e_x},${e_y - 50}`;
      textPos = [linkData[e][0] - 20, e_y - 40];
    }
    // Math.abs() 絕對值
    if (Math.abs(y) > 500) {
      // 中間有隔隔一個點
      s_x = y < 0 ? linkData[s][0] - 60 : linkData[s][0] + ww;
      s_y = y < 0 ? linkData[s][1] + hh / 2 - 30 : linkData[s][1] + hh / 2 + 30;
      e_x = y < 0 ? linkData[e][0] - 60 : linkData[s][0] + ww;
      e_y = y < 0 ? linkData[e][1] + hh / 2 + 30 : linkData[e][1] + hh / 2 - 30;
      let h_x = y < 0 ? -40 : 40;

      link = `M${s_x},${s_y} h${h_x} V${e_y} L${e_x},${e_y}`;
      textPos = [e_x, e_y - 40];
      if (y < 0) {
        textPos = [linkData[e][0] - 160, linkData[e][1] + hh];
      }
    }
  }

  if (x < 0) {
    // 右向左攻擊(攻擊祖,父,伯,叔層)
    // console.log(x);
    s_x = linkData[s][0];
    s_y = linkData[s][1];
    e_x = linkData[e][0];
    e_y = linkData[e][1];

    link = `M${s_x - 60},${s_y + hh / 3} h${(x - ww) / 4} V${e_y + hh / 3} L${
      e_x + ww
    },${e_y + hh / 3}`;
    textPos = [e_x + ww + 20, e_y + hh / 2];

    if (Math.abs(x) > 500) {
      // 中間有跳輩份 孫向祖
      link = `M${s_x},${s_y} v${-40} H${e_x + ww / 2} L${e_x + ww / 2},${
        e_y + hh + 10
      }`;
      textPos = [e_x + ww / 2.5, e_y - 80];
      if (y > 0) {
        link = `M${s_x},${s_y + hh} v${40} H${e_x + ww / 2} L${e_x + ww / 2},${
          e_y - 40
        }`;
        textPos = [e_x + ww / 2.5 + 20, e_y - 80];
      }
      if (Math.abs(y) < hh && Math.abs(y) > 1) {
        link = `M${s_x + ww / 3},${s_y + hh} V${e_y + hh / 2} H${
          e_x + ww / 2 + 100
        } L${e_x + ww / 2 + 80},${e_y + hh / 2}`;
        textPos = [e_x + ww + 120, e_y + hh / 2];
      }
      if (y > 450) {
        let h2e = 120;
        link = `M${s_x + 30},${s_y + hh} v${55} H${e_x + ww / 2 + h2e} V${
          e_y - 10
        } L${e_x + ww / 2 + 60},${e_y - 10}`;
        textPos = [e_x + ww / 2 + 60, e_y - 120];
      }
      if (y < -350) {
        textPos = [e_x + ww / 2, e_y + hh + 60];
      }
      if (y == 0) {
        link = `M${s_x},${s_y} v${-60} H${e_x + ww / 2} L${e_x + ww / 2},${
          e_y - 20
        }`;
        textPos = [e_x + ww / 2, e_y - 60];
      }
    } else {
      if (y == 0) {
        // link = `M${s_x},${s_y} v${-40} H${e_x+ww/2} L${e_x+ww/2},${e_y-20}`;
        textPos = [e_x + ww + 30, e_y + 50];
      }
    }
    if (Math.abs(y) < 300 && Math.abs(y) > 50) {
      link = `M${s_x + 30},${s_y} v${-30} H${e_x + ww / 2} L${e_x + ww / 2},${
        e_y - 30
      }`;
      textPos = [e_x + ww / 2 + 60, e_y - 120];
    }
  }

  // 重複對象攻擊 ( 重複的攻擊路徑但是不同通道及行為模式 )
  // e終點 s起點 x,y偏差值=紀錄線條中間段的偏移(h,v) H(水平),V(垂直)是畫布上絕對定位h,v是移動距離
  // 例如 let link = `M${ss[0]},${ss[1]} h${x} v${y} L${ee[0]},${ee[1]}`;
  // let s_x = linkData[s][0] // 起點x
  // let s_y = linkData[s][1] // 起點y
  // let e_x = linkData[e][0] // 終點x
  // let e_y = linkData[e][1] // 終點y

  //----------------另外設定線段種類--------------
  if (dd.offset.lineBox == 1) {
    let v_x = 50;
    let v_y = 50;
    link = `M${s_x},${s_y - v_y} h${v_x} V${e_y + hh / 1.2} H${e_x - v_x} V${
      e_y + hh / 2 - v_y
    } L${e_x},${e_y + hh / 2 - v_y}`;
    textPos = [e_x - v_x * 2, e_y + v_y * 2];
  }
  if (dd.offset.lineBox == 2) {
    let v_x = 50;
    let v_y = 50;
    link = `M${s_x - v_x},${s_y + v_y / 2} h${-v_x * 2} V${e_y + hh / 2} L${
      e_x + ww
    },${e_y + hh / 2}`;
    textPos = [e_x + ww + v_x, e_y + hh / 2];
  }
  if (dd.offset.lineBox == 3) {
    let v_x = 50;
    let v_y = 50;
    link = `M${s_x},${s_y - v_y} h${v_x} V${e_y - hh / 1.2} H${e_x + ww/2 } L${e_x + ww/2},${e_y - hh/1.6 }`;
    textPos = [e_x - v_x * 2, e_y + v_y * 2];
  }
  return { link, textPos };
}
