/**
 *Module dependencies
 */

const exec = require('child_process').exec;
const util = require('../utils/util');

let defPsInfo = {
	time: util.formatTime(new Date()),
	usr: -1,
	sys: -1,
	gue: -1,
	serverId: '',
	serverType: '',
	cpuAvg: -1,
	memAvg: -1,
	vsz: -1,
	rss: -1
};


/**
 * Expose 'getPsInfo' constructor
 */

module.exports.getPsInfo = getPsInfo;

/**
 * get the process information by command 'ps auxw | grep serverId | grep pid'
 *
 * @param {Object} param
 * @param {Function} callback
 * @api public
 */

function getPsInfo(param, callback) {
	defPsInfo.time = util.formatTime(new Date());
	defPsInfo.serverId = param.serverId;
	defPsInfo.serverType = defPsInfo.serverId.split('-')[0];
	if( defPsInfo.serverType === defPsInfo.serverId ){
		defPsInfo.serverType = defPsInfo.serverId.split('_')[0];
	}

	if (process.platform === 'windows') { 
		callback( null, defPsInfo);
		return;
	}
	
	if( typeof(param.pid) !== 'number' )
	{
		//callback( new Error('invalid pid!'), null);
		callback( null, defPsInfo);
		return;
	}
	
	let pid = param.pid;
	let cmd = "ps auxw | grep " + pid + " | grep -v 'grep'";
	//var cmd = "ps auxw | grep -E '.+?\\s+" + pid + "\\s+'"  ;
	exec(cmd, function(err, output) {
		if (!!err) {
			// if (err.code === 1) {
			// 	console.log('the content is null!');
			// } else {
			// 	console.error('getPsInfo failed! ' + err.stack);
			// }
			// callback(err, null);
			callback( null, defPsInfo);
			return;
		} 
    format(param, output, callback);
	});
};

/**
 * convert serverInfo to required format, and the callback will handle the serverInfo 
 *
 * @param {Object} param, contains serverId etc
 * @param {String} data, the output if the command 'ps'
 * @param {Function} cb
 * @api private
 */

function format(param, data, cb) {
	let time = util.formatTime(new Date());
	let outArray = data.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
	let outValueArray = [];
	for (let i = 0; i < outArray.length; i++) {
		if ((!isNaN(outArray[i]))) {
			outValueArray.push(outArray[i]);
		}
	}
	let ps = {};
	ps.time = time;
	ps.serverId = param.serverId;
	ps.serverType = ps.serverId.split('-')[0];
	let pid = ps.pid = param.pid;
	ps.cpuAvg = outValueArray[1];
	ps.memAvg = outValueArray[2];
	ps.vsz = outValueArray[3];
	ps.rss = outValueArray[4];
	outValueArray = [];
	if (process.platform === 'darwin') {
		ps.usr = 0;
		ps.sys = 0;
		ps.gue = 0;
		cb(null, ps);
		return;
	}
	exec('pidstat -p ' + pid, function(err, output) {
		if (!!err) {
			console.error('the command pidstat failed! ', err.stack);
			return;
		}
		let outArray = output.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
		for (let i = 0; i < outArray.length; i++) {
		  if ((!isNaN(outArray[i]))) {
				outValueArray.push(outArray[i]);
			}
		}
		ps.usr = outValueArray[1];
		ps.sys = outValueArray[2];
		ps.gue = outValueArray[3];

		cb(null, ps);
	});
};

