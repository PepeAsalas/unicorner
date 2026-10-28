// The Unicorner unicorn as the tycoon's tap target, in a cookie skin.
// FRAMES and PAL are copied from the main game (index.html): 36x30 pixel maps, frames 0 and 1 run, frame 2 is mid-gallop.
(() => {
const PAL={K:"#1a1030",W:"#ffffff",L:"#d2d6ec",G:"#ffd23f",g:"#e0a000",P:"#ff6fb5",V:"#7c4dff",v:"#5a34d2",B:"#4fc3ff",E:"#1a1030",w:"#ffffff",N:"#ff6fb5"};
const FRAMES=[["............................KGK.....", "...........................KGK......", ".......................K..KGgK......", ".....................KKWKKGgK.......", "....................KPPVWGgKKK......", "...................KPVVWWWWWWWK.....", "...................KVVBWWWWWWWK.....", "..................KVBBWWWWEwWWKK....", "..................KBBPWWWWEWWWWWK...", ".................KBPPWWWWWWWWWWWWK..", ".................KPPVWWWWWWWWWWNWK..", "................KPVVWWWWWWWWWWWWWK..", ".........KKKKKKKKVVBWWWWKKKWLLLLWK..", ".......KKWWWWWWWWWWWWWWK...KKKKKK...", "......KPWWWWWWWWWWWWWWWK............", ".....KPPWWWWWWWWWWWWWWWK............", "....KPPKWWWWWWWWWWWWWWWK............", "....KVVKWWWWWWWWWWWWWWWK............", "...KVVKKWWWWWWWWWWWWWWWK............", "...KVVKKWWWWWWWWWWWWWWWK............", "..KBBK..KLLLLLLLLLLLLLWK............", "..KBBK..KWWKWWKKKKWWKWWK............", "...KK...KWWKWWK..KWWKWWK......KK....", "........KWWKWWK..KWWKWWK.....KWWK...", "........KWWKWWK..KWWKWWK....KWKKWK..", "........KLLKLLK..KLLKLLK....KWKKWK..", "........KggKggK..KggKggK.....KWWK...", ".........KK.KK....KK.KK.......KK....", "....................................", "...................................."], ["............................KGK.....", "...........................KGK......", ".......................K..KGgK......", ".....................KKWKKGgK.......", "...................KKPPVWGgKKK......", "..................KPVVKWWWWWWWK.....", "..................KKVVBWWWWWWWK.....", ".................KVBBWWWWWEwWWKK....", ".................KKBBPWWWWEWWWWWK...", "................KBPPWWWWWWWWWWWWWK..", "................KKPPVWWWWWWWWWWNWK..", "...............KPVVWWWWWWWWWWWWWWK..", ".........KKKKKKKKVVBWWWWKKKWLLLLWK..", ".......KKWWWWWWWWWWWWWWK...KKKKKK...", "......KPWWWWWWWWWWWWWWWK............", ".....KPPWWWWWWWWWWWWWWWK............", "....KVVKWWWWWWWWWWWWWWWK............", "...KKVVKWWWWWWWWWWWWWWWK............", "..KVVKKKWWWWWWWWWWWWWWWK............", "..KBBK.KWWWWWWWWWWWWWWWK............", ".KBBK...KLLLLLLLLLLLLLWK............", ".KBBK..KWWKKKWWKKWWKKKWWK......KK...", "..KK...KWWK.KWWKKWWK.KWWK.....KWWK..", ".......KWWK.KWWKKWWK.KWWK....KWKKWK.", "......KWWK...KWWWWK...KWWK...KWKKWK.", "......KLLK...KLLLLK...KLLK....KWWK..", "......KggK...KggggK...KggK.....KK...", ".......KK.....KKKK.....KK...........", "....................................", "...................................."]];
// third frame: mid-gallop, legs tucked under (rows 0-20 are the body, shared with frame 0)
FRAMES.push(FRAMES[0].slice(0,21).concat(["..KBBK..KWWKWWKKKKWWKWWK............", "...KK..KWWKWWK....KWWKWWK.....KK....", "......KWWKWWK......KWWKWWK...KWWK...", "......KLLKLLK......KLLKLLK..KWKKWK..", "......KggKggK......KggKggK..KWKKWK..", ".......KK.KK........KK.KK....KWWK...", "..............................KK....", "....................................", "...................................."]));
// Cookie skin: dough body with chocolate chips, chocolate-swirl mane, golden biscuit horn. The football keeps its colours.
const CHIP = (x, y) => (x * 7 + y * 13) % 11 === 0 || (x * 5 + y * 3) % 17 === 0;
const COOKIE = {K: '#3b1f0c', P: '#5a3216', V: '#7a4a24', B: '#3b1f0c', G: '#f0c060', g: '#b8862e', N: '#5a3216'};
function colour(c, x, y) {
  if (x >= 27 && y >= 21) return PAL[c]; // the ball
  if (c === 'W' || c === 'L') {
    if (CHIP(x, y)) return c === 'L' ? '#2e1606' : '#4a2a12';
    if ((x * 3 + y * 7) % 19 === 0) return '#f2c98e'; // a crumb of highlight
    return c === 'L' ? '#b97a3f' : '#d9a066';
  }
  return COOKIE[c] || PAL[c];
}
// draw frame f into a canvas at scale s (whole pixels, crisp)
window.cookieUnicorn = (f, s, blink) => {
  const cv = document.createElement('canvas'); cv.width = 36 * s; cv.height = 30 * s;
  const g = cv.getContext('2d');
  FRAMES[f].forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    g.fillStyle = blink && (c === 'E' || c === 'w') ? '#d9a066' : colour(c, x, y); g.fillRect(x * s, y * s, s, s);
  }));
  if (blink) { g.fillStyle = '#3b1f0c'; g.fillRect(25 * s, 8 * s, 3 * s, s); }
  return cv;
};
})();
