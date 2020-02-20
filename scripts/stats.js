const readline = require('readline');

const RLABEL = /^\d+\s+<(\w+)@.*?>:$/;
const RCODE = /^\s+\d+:[\d\s]+([^#]+)(#.*)?$/;
const RINSTR = /(\w+(\s+scas\w*)?)\s*([^,]+)?,?(.*)?/;
const RREF = /<([^@]*)@?.*?>/;
const STATS = {
  labels: 
};


function mapInc(map, k) {
  map.set(k, (map.get(k)||0)+1);
}

function mapSortDescFn([k1, v1], [k2, v2]) {
  return v2-v1;
}

function mapSortDesc(map) {
  return new Map([...map.entries()].sort(mapSortDescFn));
}

function onOpcode(map, opcs, op) {
  mapInc(opcs, op);
  
}

function onOperand(map, regs, op, i=1) {
  if(!op) return;
  if(RREF.test(op)) mapInc(map, 'label_ref');
  else if(/\[.*?\]/.test(op)) {
    mapInc(map, 'mem');
    mapInc(map, n===1? 'mem_dest':'mem_src');
    if(/BYTE PTR/.test(op)) mapInc(map, 'mem_byte_ptr');
    else if(/WORD PTR/.test(op)) mapInc(map, 'mem_word_ptr');
    else if(/DWORD PTR/.test(op)) mapInc(map, 'mem_dword_ptr');
    else if(/QWORD PTR/.test(op)) mapInc(map, 'mem_qword_ptr');
    if(/\*/.test(op)) mapInc(map, 'mem_base_indexed');
    else if(/\+/.test(op)) mapInc(map, 'mem_base');
    else if(/\[\s*0x\w+\s*\]/.test(op)) mapInc(map, 'mem_direct');
    else mapInc(map, 'mem_indirect');
  }
  else if(/0x\w+|\d+/.test(op)) mapInc(map, 'immediate');
  else {
    mapInc(map, 'reg');
    mapInc(regs, op.trim());
  }
}

function statsStream(input, opt, fn) {
  var labels = new Set();
  var references = new Map();
  var opcodes = new Map();
  var registers = new Map();
  var details = new Map();
  var rl = readline.createInterface({
    input, output: null, terminal: false
  });
  rl.on('line', () => {

  });
  rl.on('close', () => {

  });
}

function stats() {
  
}
