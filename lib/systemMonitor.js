/**
 * Module dependencies
 */

const os = require('os');
const util = require('../utils/util');
const exec = require('child_process').exec;

let info = {};

let defOutHash = {
  date: util.formatTime(new Date()),
  disk: {
    kb_read: 0,
    kb_wrtn: 0,
    kb_read_per: 0,
    kb_wrtn_per: 0,
    tps: 0
  },
  cpu: {
    cpu_user: -1,
    cpu_nice: -1,
    cpu_system: -1,
    cpu_iowait: 0,
    cpu_steal: 0,
    cpu_idle: -1
  }
};

/*
 * Expose 'getSysInfo' constructor
 */

module.exports.getSysInfo = getSysInfo;

function calcCpus( retData ){
  const newCPUs = os.cpus();
  let ret = {
    user:0,nice:0,sys:0,idle:0,irq:0
  };
  let retT = 0;
  for (let i = 0; i < newCPUs.length; ++i) {
    let {user,nice,sys,idle,irq} = newCPUs[i].times;

    let total = user+nice+sys+idle+irq; 
    ret.user += user;
    ret.nice += nice;
    ret.sys += sys;
    ret.idle += idle;
    ret.irq += irq;
    retT += total;	
  }

  for( let it in ret ){
    ret[it] = ret[it]/retT * 100;
  }

  let cpuI = retData.iostat.cpu;
  cpuI.cpu_user = ret.user;
  cpuI.cpu_nice = ret.nice;
  cpuI.cpu_system = ret.sys;
  cpuI.cpu_idle = ret.idle;
}


/**
 * get information of operating-system
 *
 * @param {Function} callback
 * @api public
 */

function getSysInfo(callback) {
  let reData = getBasicInfo();
	if (process.platform === 'windows') {
    defOutHash.date = util.formatTime(new Date());
    reData.iostat = defOutHash;
    calcCpus(reData);
    callback(null, reData);
    return;
  } else {
    exec('iostat ', function(err, output) {
      if (!!err) {
        defOutHash.date = util.formatTime(new Date());
        reData.iostat = defOutHash;
        calcCpus(reData);
      } else {
        reData.iostat = format(output);
      }
      callback(null,reData);
    });
  }
};

/**
 * analysis the disk i/o data,return a map contains kb_read,kb_wrtn ect.
 *
 * @param {String} data, the output of the command 'iostat'
 * @api private
 */

function format(data) {
	var time = util.formatTime(new Date());
  var output_array = data.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
  var output_values = [];
  for (var i = 0, counter = 0; i < output_array.length; i++) {
    if(!isNaN(output_array[i])) {
      output_values[counter] = parseFloat(output_array[i]);
      counter++;
    }
  }
  if (output_values.length > 0) {
    let output_hash = {
      date: time,
      disk: {
        kb_read: output_values[9],
        kb_wrtn: output_values[10],
        kb_read_per: output_values[7],
        kb_wrtn_per: output_values[8],
        tps: output_values[6]
      },
      cpu: {
        cpu_user: output_values[0],
        cpu_nice: output_values[1],
        cpu_system: output_values[2],
        cpu_iowait: output_values[3],
        cpu_steal: output_values[4],
        cpu_idle: output_values[5]
      }
    }
    return output_hash;
  }
};

/**
 * get basic information of operating-system
 * 
 * @return {Object} result
 * @api private
 */

function getBasicInfo() {
	var result = {};
  for (var key in info) {
    result[key] = info[key]();
  }  
	return result;
};

info.hostname = os.hostname;

info.type = os.type;

info.platform = os.platform;

info.arch = os.arch;

info.release = os.release;

info.uptime = os.uptime;

info.loadavg = os.loadavg;

info.totalmem = os.totalmem;

info.freemem = os.freemem;

info.cpus = os.cpus;

info.networkInterfaces = os.networkInterfaces;

info.versions = function(){return process.versions};

info.arch = function(){return process.arch};

info.platform = function(){return process.platform};

info.memoryUsage = process.memoryUsage;

info.uptime = process.uptime;


