// modules/mtk2mad/utils/linkMaker.js
export function linkMaker(dd, linkData) {
  if (!dd || !linkData) {
    return { link: "", textPos: [0, 0] };
  }
  let s = dd.s2;
  let e = dd.e2;
  let offset = dd.offset;

  if (!linkData[s] || !linkData[e]) {
    return { link: "", textPos: [0, 0] };
  }

  let x = linkData[e][0] - linkData[s][0];
  let y = linkData[e][1] - linkData[s][1];

  let link = "";
  let ww = 192;
  let hh = 180;
  let s_x, s_y, e_x, e_y;

  let textPos = [0, 0];

  if (x > 0) {
    s_x = linkData[s][0] + ww;
    s_y = linkData[s][1] + hh / 2;
    e_x = linkData[e][0] - ww / 3;
    e_y = linkData[e][1] + hh / 2;
    let v_y;

    link = `M${s_x},${s_y} h${(x - ww) / 4} V${e_y} L${e_x},${e_y}`;
    textPos = [linkData[e][0] - 200, linkData[e][1] + hh / 1.5 - 30];

    if (Math.abs(x) > 500) {
      v_y = -40;
      link = `M${s_x - ww / 1.5},${s_y - hh / 1.5} V${linkData[e][1] + v_y} H${
        e_x + ww / 1.5
      } L${e_x + ww / 1.5},${e_y - hh / 1.5}`;
      textPos = [linkData[e][0] - 220, linkData[e][1] - 40];
      if (y == 0) {
        v_y = 40;
        link = `M${s_x - ww / 1.5},${s_y + hh / 2} v${v_y} H${
          e_x + ww / 1.5
        } L${e_x + ww / 1.5},${e_y + hh / 2}`;
        textPos = [linkData[e][0] - 220, linkData[e][1] + hh + 40];
      }
      if (y > 0) {
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
    }
  }

  if (x == 0) {
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
    if (Math.abs(y) > 500) {
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
    s_x = linkData[s][0];
    s_y = linkData[s][1];
    e_x = linkData[e][0];
    e_y = linkData[e][1];

    link = `M${s_x - 60},${s_y + hh / 3} h${(x - ww) / 4} V${e_y + hh / 3} L${
      e_x + ww
    },${e_y + hh / 3}`;
    textPos = [e_x + ww + 20, e_y + hh / 2];

    if (Math.abs(x) > 500) {
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

  if (offset.lineBox == 1) {
    let v_x = 50;
    let v_y = 50;
    link = `M${s_x},${s_y - v_y} h${v_x} V${e_y + hh / 1.2} H${e_x - v_x} V${
      e_y + hh / 2 - v_y
    } L${e_x},${e_y + hh / 2 - v_y}`;
    textPos = [e_x - v_x * 2, e_y + v_y * 2];
  }
  if (offset.lineBox == 2) {
    let v_x = 50;
    let v_y = 50;
    link = `M${s_x - v_x},${s_y + v_y / 2} h${-v_x * 2} V${e_y + hh / 2} L${
      e_x + ww
    },${e_y + hh / 2}`;
    textPos = [e_x + ww + v_x, e_y + hh / 2];
  }
  if (offset.lineBox == 3) {
    let v_x = 50;
    let v_y = 50;
    link = `M${s_x},${s_y - v_y} h${v_x} V${e_y - hh / 1.2} H${e_x + ww / 2} L${
      e_x + ww / 2
    },${e_y - hh / 1.6}`;
    textPos = [e_x - v_x * 2, e_y + v_y * 2];
  }
  return { link, textPos };
}
