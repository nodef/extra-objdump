const readline = require('readline');

const RLABEL = /^\d+\s+<(\w+)@.*?>:$/;
const RCODE = /^\s+\d+:[\d\s]+([^#]+)(#.*)?$/;
const RINSTR = /(\w+(\s+scas\w*)?)\s*([^,]+)?,?(.*)?/;
const RREF = /<([^@]*)@?.*?>/;



function mapInc(map, k) {
  map.set(k, (map.get(k)||0)+1);
}

function mapSortDescFn([k1, v1], [k2, v2]) {
  return v2-v1;
}

function mapSortDesc(map) {
  return new Map([...map.entries()].sort(mapSortDescFn));
}

function onOpcode(d, opcs, op) {
  mapInc(opcs, op);
}

function onOperand(d, refs, regs, op, i=1) {
  if(!op) return;
  if(RREF.test(op)) {
    mapInc(d, 'ref');
    mapInc(refs, op.match(RREF)[1]);
  }
  else if(/\[.*?\]/.test(op)) {
    mapInc(d, 'mem');
    mapInc(d, i===1? 'mem_dest':'mem_src');
    if(/BYTE PTR/.test(op)) mapInc(d, 'mem_byte_ptr');
    else if(/WORD PTR/.test(op)) mapInc(d, 'mem_word_ptr');
    else if(/DWORD PTR/.test(op)) mapInc(d, 'mem_dword_ptr');
    else if(/QWORD PTR/.test(op)) mapInc(d, 'mem_qword_ptr');
    if(/\*/.test(op)) mapInc(d, 'mem_base_indexed');
    else if(/\+/.test(op)) mapInc(d, 'mem_base');
    else if(/\[\s*0x\w+\s*\]/.test(op)) mapInc(d, 'mem_direct');
    else mapInc(d, 'mem_indirect');
  }
  else if(/0x\w+|\d+/.test(op)) mapInc(d, 'immediate');
  else {
    mapInc(d, 'reg');
    mapInc(regs, op.trim());
  }
}

function onComment(d, refs, com) {
  if(RREF.test(com)) mapInc(refs, com.match(RREF)[1]);
}

function stats_x86(input, opt, fn) {
  var labels = new Set();
  var references = new Map();
  var opcodes = new Map();
  var registers = new Map();
  var details = new Map();
  var rl = readline.createInterface({
    input, output: null, terminal: false
  });
  rl.on('line', line => {
    if(RLABEL.test(line)) return labels.add(line.match(RLABEL)[1]);
    if(!RCODE.test(line)) return;
    var [, instr, comment] = line.match(RCODE);
    onComment(details, references, comment);
    var [, opcode,, op1, op2] = instr.match(RINSTR);
    onOpcode(details, opcodes, opcode);
    mapInc(details, 'operand_'+(op2? '2':(op1? '1':'0')));
    onOperand(details, references, registers, op1);
    onOperand(details, references, registers, op2);
  });
  rl.on('close', () => {
    details = mapSortDesc(details);
    references = mapSortDesc(references);
    opcodes = mapSortDesc(opcodes);
    registers = mapSortDesc(registers);
    fn(null, {details, opcodes, registers, references, labels});
  });
}
module.exports = stats_x86;
