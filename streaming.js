'use strict'

var m3u8 = require('m3u8');
var fs   = require('fs');
const Ipfs = require('./src')
//const date = require('log-timestamp');
const HlsjsIpfsLoader = require('./ipfsloader')
const testhash = process.argv[2]
const repoPath = 'ipfsRepo'
var node;
if(process.argv.length>3)
	node = new Ipfs({ repo: repoPath,  config: { Bootstrap: [process.argv[3]] }})
else
	node = new Ipfs({ repo: repoPath})

const loader = new HlsjsIpfsLoader({ipfs: node, ipfsHash: testhash})
var performanceNow = require("performance-now")
var frags = [];
var durations = [];
var requested=0,received = 0;
var time = 0;
var startTime=0,loadedMaxTime=0,bufferSize=30000,bufferingTime=0,playTime=0;
var loaderContext, loaderConfig, loaderCallbacks;
var lastTime=0,tickTime=1000,maxOnFly=5;

var loadsuccess = function (response, stats, context, networkDetails) {
	//console.log("Load success "+playTime+" "+bufferingTime+" "+loadedMaxTime+" "+received);
	//console.log(stats.tfirst+" "+stats.tstart+" "+performanceNow())
	console.log(response.url+" chunks: "+stats.chunk+" bytes: "+response.data.byteLength+" hashTime: "+stats.hashtime+" resolTime: "+stats.resoltime+" dTime: "+stats.dtime+" Totaltime: "+stats.totaltime+" totaltput: "+parseFloat(response.data.byteLength*8/(stats.totaltime)).toFixed(2)+" Kbps dloadtput: "+parseFloat(response.data.byteLength*8/(stats.dtime)).toFixed(2)+" Kbps");
	//stream.write(response.data);

	loadedMaxTime+=durations[received]*1000;
	if(startTime==0&&loadedMaxTime>=bufferSize)startTime=performanceNow();


	received++;
	//doTick();
	/*if(received<frags.length) {
		//let playTime = performanceNow()-loadedTime;
		//console.log("Play time "+playTime + " " + loadedMaxTime)
		if(loadedMaxTime-startTime<bufferSize) {
			//console.log("Load "+frags[received])
			loaderContext = { url: frags[received], frag: null, responseType: 'arraybuffer', progressData: false };
	  		time = performanceNow();
			loader.load(loaderContext,loaderConfig,loaderCallbacks);
		} else {
			stopped = true;
		}
	} else {*/
	if(received>=frags.length){
		//stream.end();
		node.stop(error => {
		    if (error) {
		      return console.error('Node failed to stop cleanly!', error)
		    }
		    console.log('Node stopped!')
		    process.exit();
		})
	}
        /*console.log("Load success "+response.url+" "+stats+" "+context.responseType+" "+networkDetails);
	if (networkDetails === void 0) { networkDetails = null; }
	//var payload = response.data, frag = context.frag;
	// detach fragment loader on load success
	frag.loader = undefined;
	this.loaders[frag.type] = undefined;
	this.hls.trigger(events_1.default.FRAG_LOADED, { payload: payload, frag: frag, stats: stats, networkDetails: networkDetails });*/
};
var loaderror = function (response, context, networkDetails) {
        console.log("Load error "+response.url);
	/*if (networkDetails === void 0) { networkDetails = null; }
	var frag = context.frag;
	var loader = frag.loader;
	if (loader) {
	    loader.abort();
	}
	this.loaders[frag.type] = undefined;
	this.hls.trigger(events_1.default.ERROR, { type: errors_1.ErrorTypes.NETWORK_ERROR, details: errors_1.ErrorDetails.FRAG_LOAD_ERROR, fatal: false, frag: context.frag, response: response, networkDetails: networkDetails });*/
};
var loadtimeout = function (stats, context, networkDetails) {
        console.log("Load timeout "+response.url);
	/*if (networkDetails === void 0) { networkDetails = null; }
	var frag = context.frag;
	var loader = frag.loader;
	if (loader) {
	    loader.abort();
	}
	this.loaders[frag.type] = undefined;
	this.hls.trigger(events_1.default.ERROR, { type: errors_1.ErrorTypes.NETWORK_ERROR, details: errors_1.ErrorDetails.FRAG_LOAD_TIMEOUT, fatal: false, frag: context.frag, networkDetails: networkDetails });
	*/
};

var loadprogress = function (stats, context, data, networkDetails) {
        console.log("Load progress "+response.url);
	/*if (networkDetails === void 0) { networkDetails = null; }
	var frag = context.frag;
	frag.loaded = stats.loaded;
	this.hls.trigger(events_1.default.FRAG_LOAD_PROGRESS, { frag: frag, stats: stats, networkDetails: networkDetails });
	*/
};


  loaderConfig = {
	    timeout: 20000,
	    maxRetry: 0,
	    retryDelay: 0,
	    maxRetryDelay: 64000
  };
  loaderCallbacks = {
    	    onSuccess: loadsuccess,
	    onError: loaderror,
	    onTimeout: loadtimeout,
	    onProgress: loadprogress
  };

function getPlaylist(playlist, callback) {
node.on('ready', () => {
  console.log("Node ready")

  node.get(testhash+"/"+playlist).then((files) => {
      files.forEach((file) => {
        if (file.content) {
	  console.log(`${file.path} received.`)
	  fs.writeFile('master.m3u8', file.content, (err) => {
 		if (err) throw err;
  		callback(playlist)
	  });

        }
      });
    });

})
}

function parsePlayList(playlist,callback){
	let parser = m3u8.createStream();
	  //const playlist = HLS.parse(file);
	  let file2   = fs.createReadStream(playlist);

	  file2.pipe(parser);

	  parser.on('item', function(item) {
	  // emits PlaylistItem, MediaItem, StreamItem, and IframeStreamItem
	  	//console.log(item)
		callback(item.properties.uri,item.properties.duration)

	  });

}


function doTick(){
    if(received>0&&loadedMaxTime>playTime)playTime+=tickTime;
    else bufferingTime+=tickTime;
    //console.log("Play time "+playTime+ " "+loadedMaxTime)
		if(requested<frags.length) {
			//console.log("Play time "+playTime + " " + loadedMaxTime+" "+requested+" "+received+" "+maxOnFly)
			if((playTime>0&&loadedMaxTime-playTime<bufferSize&&requested-received==0)||(playTime==0&&(requested-received)<maxOnFly)) {
				//console.log("Load "+frags[requested])
				loaderContext = { url: frags[requested], frag: null, responseType: 'arraybuffer', progressData: false };
		  	//time = performanceNow();
				requested++
				loader.load(loaderContext,loaderConfig,loaderCallbacks);
			}
		}/* else {
			//stream.end();
			node.stop(error => {
			    if (error) {
			      return console.error('Node failed to stop cleanly!', error)
			    }
			    console.log('Node stopped!')
			    process.exit();
			})
		}*/

}

function run() {
  setInterval(doTick, tickTime);
};


getPlaylist("master.m3u8", function(name) {
  // use the return value here instead of like a regular (non-evented) return value

  parsePlayList(name,function(frag,duration) {
	//console.log("Received "+frag+" "+duration)
	frags.push(frag)
	durations.push(duration)
  	//console.log("Result " +frags[frags.length-1]+" "+durations[durations.length-1])
	if(frags.length==1){
        	loaderContext = { url: frags[0], frag: null, responseType: 'arraybuffer', progressData: false };
  		time = performanceNow();
		loader.load(loaderContext,loaderConfig,loaderCallbacks)
                requested++
		run();

	}
  });

});
