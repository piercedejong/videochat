var localVideo;
var localStream;
var remoteVideo;
var peerConnection;
var uuid;
var serverConnection;

const pages = ["0002.jpg","0003.jpg","0004.jpg","0005.jpg","0006.jpg","0007.jpg","0008.jpg","0009.jpg"
  ,"0010.jpg","0011.jpg","0012.jpg","0013.jpg","0014.jpg","0015.jpg","0016.jpg","0017.jpg","0018.jpg","0019.jpg"
  ,"0020.jpg","0021.jpg","0022.jpg","0023.jpg","0024.jpg","0025.jpg","0026.jpg","0027.jpg","0028.jpg","0029.jpg"
  ,"0030.jpg","0031.jpg","0032.jpg","0033.jpg","0034.jpg"]

const audio = [null, null, null, "night.mp3", "walking.mp3", "walking.mp3", null, null, "dragon.mp3"
  , null, "water.mp3", null, "boat.mp3", null, "hungry.mp3", null, null, "moose.mp3", null, "climb.mp3",
  "falling.mp3", null, "hotair.mp3", null, null, "drawing.mp3", null, null, null, "walking.mp3",
  "drawing.mp3", null, "sleeping.mp3"]

var currentPage = 0;

let page1 = document.getElementById("page")
let page2 = document.getElementById("page2")

// page1.src = pages[1];

var peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

function pageReady() {
  uuid = createUUID();

  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');

  serverConnection = new WebSocket('wss://' + window.location.hostname);
  serverConnection.onmessage = gotMessageFromServer;

  var constraints = {
    video: true,
    audio: true,
  };

  if(navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
  } else {
    alert('Your browser does not support getUserMedia API');
  }
}

function getUserMediaSuccess(stream) {
  localStream = stream;
  localVideo.srcObject = stream;
}

function start(isCaller) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.ontrack = gotRemoteStream;
  peerConnection.addStream(localStream);

  if(isCaller) {
    peerConnection.createOffer().then(createdDescription).catch(errorHandler);
  }
  document.getElementById("start").style.display = "none";
  // document.getElementById("remoteVideo").style.display = "block";
}

function gotMessageFromServer(message) {
  console.log(message)
  if(message.data === "Next Page"){
    goToNextPage()
  }else if(message.data === "Previous Page"){
    goToPreviousPage()
  }else if(message.data === "Play Sound"){
    playNextSound()
  }else{
    if(!peerConnection) start(false);

    var signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if(signal.uuid == uuid) return;

    if(signal.sdp) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
        // Only create answers in response to offers
        if(signal.sdp.type == 'offer') {
          peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
        }
      }).catch(errorHandler);
    } else if(signal.ice) {
      peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
  }
}

function gotIceCandidate(event) {
  if(event.candidate != null) {
    serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function() {
    serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  remoteVideo.srcObject = event.streams[0];
}

function errorHandler(error) {
  console.log(error);
}

function goToNextPage(){
  currentPage = currentPage + 1;
  if(currentPage > pages.length-1){
    currentPage = 0
  }
  // console.log("harold/"+pages[currentPage])
  //
  // document.getElementById("page2").src = "harold/"+pages[currentPage];
  // document.getElementById("page2").classList.add('active');
  //
  // setTimeout(function() {
  //   document.getElementById("page1").src = document.getElementById("page2").src;
  //   document.getElementById("page2").classList.remove('active');
  // }, 1500);

  document.getElementById("page").src="harold/"+pages[currentPage];

  if(!(audio[currentPage] === null)){
    document.getElementById("sound").style.display = "block";
  }else{
    document.getElementById("sound").style.display = "none";
  }
}

function goToPreviousPage(){
  currentPage = currentPage - 1;
  if(currentPage < 0){
    currentPage = pages.length-1
  }
  console.log("harold/"+pages[currentPage])
  document.getElementById("page").src="harold/"+pages[currentPage];

  if(!(audio[currentPage] === null)){
    document.getElementById("sound").style.display = "block";
  }else{
    document.getElementById("sound").style.display = "none";
  }
}

function playNextSound(){
  console.log("Sound "+currentPage + " | "+audio[currentPage])
  var music = new Audio('/audio/'+audio[currentPage]);
  music.play();
}

function nextPage(){
  console.log("Next Page");
  serverConnection.send("Next Page");
}

function previousPage(){
  console.log("Previous Page");
  serverConnection.send("Previous Page");
}

function playSound(){
  console.log("Play Sound");
  serverConnection.send("Play Sound");
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
