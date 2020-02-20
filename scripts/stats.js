const stats_x86 = require('./stats_x86');
const cp = require('child_process');

function objdumpStream(file, opt) {
  return cp.spawn('objdump', ['--no-show-raw-insn', '-M', 'intel', '-d', file], opt);
}

function stats(input, opt, fn) {
  if(typeof input==='string') input = objdumpStream(input).stdout;
  return new Promise((fres, frej) => {
    stats_x86(input, opt, (err, ans) => {
      if(fn) fn(err, ans);
      if(err) frej(err);
      else fres(ans);
    });
  });
}
module.exports = stats;
