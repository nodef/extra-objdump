const readline = require('readline');

const RLABEL = /^\d+\s+<(\w+)@.*?>:$/;
const RCODE = /^\s+\d+:[\d\s]+([^#]+)(#.*)?$/;
const RINSTR = /(\w+)\s*([^,]+)?,?(.*)?/;
const RREF = /<([^@]*)@?.*?>/;
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});
var labels = new Set();
var refs = new Map();
var opcodes = new Map();
var types = new Map();
var registers = new Map();

function mapInc(map, k) {
  if(!map.has(k)) map.set(k, 0);
  map.set(k, map.get(k)+1);
}

function onOp(op, n=1) {
  if(!op) return;
  if(RREF.test(op)) return mapInc(types, 'ref');
  if(/\[.*?\]/.test(op)) {
    mapInc(types, n===1? 'mem-dest':'mem-src');
    if(/BYTE PTR/.test(op)) mapInc(types, 'byte-ptr');
    if(/WORD PTR/.test(op)) mapInc(types, 'word-ptr');
    if(/DWORD PTR/.test(op)) mapInc(types, 'dword-ptr');
    if(/QWORD PTR/.test(op)) mapInc(types, 'qword-ptr');
    if(/\+/.test(op)) mapInc(types, 'mem-base');
    if(/\*/.test(op)) mapInc(types, 'mem-indexed');
    if(/\[\s*0x\w+\s*\]/.test(op)) mapInc(types, 'mem-direct');
    else mapInc(types, 'mem-indirect');
    return;
  }
  if(/0x\w+|\d+/.test(op)) return mapInc(types, 'immediate');
  mapInc(types, 'register');
  mapInc(registers, op.trim());
}

rl.on('line', line => {
  if(RLABEL.test(line)) return labels.add(line.match(RLABEL)[1]);
  if(!RCODE.test(line)) return;
  var [, instr, comment] = line.match(RCODE);
  if(RREF.test(comment)) mapInc(refs, comment.match(RREF)[1]);
  var [, opcode, op1, op2] = instr.match(RINSTR);
  if(RREF.test(op1)) mapInc(refs, op1.match(RREF)[1]);
  if(RREF.test(op2)) mapInc(refs, op2.match(RREF)[1]);
  mapInc(opcodes, opcode);
  if(op2) mapInc(types, 'op2');
  else if(op1) mapInc(types, 'op1');
  else mapInc(types, 'op0');
  onOp(op1); onOp(op2);
});
rl.on('close', () => {
  console.log({labels, refs, opcodes, types, registers});
});
