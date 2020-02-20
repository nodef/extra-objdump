const readline = require('readline');
// https://stackoverflow.com/questions/60326190/which-processor-instructions-are-used-most-commonly
// https://unix.stackexchange.com/questions/343013/how-objdump-disassemble-elf-binary
// https://stackoverflow.com/questions/17208960/what-are-the-functions-of-the-assembly-x86-edi-sil-and-dl-registers
// https://stackoverflow.com/questions/20086849/how-to-read-from-stdin-line-by-line-in-node
// https://stackoverflow.com/questions/11054534/how-to-use-install-gnu-binutils-objdump

const RLABEL = /^\d+\s+<(\w+)@.*?>:$/;
const RCODE = /^\s+\d+:[\d\s]+([^#]+)(#.*)?$/;
const RINSTR = /(\w+(\s+scas\w*)?)\s*([^,]+)?,?(.*)?/;
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
// https://www.tutorialspoint.com/assembly_programming/assembly_scas_instruction.htm

// https://stackoverflow.com/questions/31158902/is-it-possible-to-sort-a-es6-map-object
function mapSortFn([k1, v1], [k2, v2]) {
  return v2-v1;
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
  var [, opcode,, op1, op2] = instr.match(RINSTR);
  if(RREF.test(op1)) mapInc(refs, op1.match(RREF)[1]);
  if(RREF.test(op2)) mapInc(refs, op2.match(RREF)[1]);
  mapInc(opcodes, opcode);
  if(op2) mapInc(types, 'op2');
  else if(op1) mapInc(types, 'op1');
  else mapInc(types, 'op0');
  onOp(op1); onOp(op2);
});
rl.on('close', () => {
  refs = new Map([...refs.entries()].sort(mapSortFn));
  opcodes = new Map([...opcodes.entries()].sort(mapSortFn));
  types = new Map([...types.entries()].sort(mapSortFn));
  registers = new Map([...registers.entries()].sort(mapSortFn));
  console.log({labels, refs, opcodes, types, registers});
});
