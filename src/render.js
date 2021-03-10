const {
  getRemoteModules,
  getFsModules,
  getElectronModules,
  createMenu,
  getBufferFromRecordedChunks,
} = window.api;
const { desktopCapturer } = getElectronModules();
const { dialog } = getRemoteModules();
const { writeFile } = getFsModules();

const RECORDER_STATE = {
  INACTIVE: 'inactive',
  RECORDING: 'recording',
  PAUSED: 'paused',
};

let recorder;
let recordedChunks = [];
const recorderOptions = { mimeType: 'video/webm; codecs=vp9' };

const videoElement = document.querySelector('video');
const recordingPulse = document.getElementById('recording-pulse');
const recordingText = document.getElementById('recording-text');

// Buttons
const recordButton = document.getElementById('record-button');
const selectVideo = document.getElementById('select-video');

// Event handlers
recordButton.onclick = () => {
  // Handle events based on recorder's state;
  switch (recorder.state) {
    case RECORDER_STATE.RECORDING:
      stopRecorder();
      return;
    case RECORDER_STATE.INACTIVE:
      startRecorder();
      return;
    default:
      return;
  }
};
selectVideo.onclick = showVideoSources;

function startRecorder() {
  recordedChunks = [];
  recorder.start(0);
  recordingText.innerText = 'Recording';
  recordingPulse.classList.toggle('inline-block');
}

function stopRecorder() {
  recorder.stop();
  recordingText.innerText = 'Record';
  recordingPulse.classList.toggle('inline-block');
}

async function getVideoSources() {
  return await desktopCapturer.getSources({
    types: ['window', 'screen'],
  });
}

async function showVideoSources() {
  const inputSources = await getVideoSources();
  const options = inputSources.map((source) => {
    return {
      label: source.name,
      click: () => selectSource(source),
    };
  });
  createMenu(options);
}

async function getStream(sourceId) {
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
      },
    },
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

function playStream(stream) {
  videoElement.srcObject = stream;
  videoElement.play();
}

// Change the videoSource window to record
async function selectSource(source) {
  selectVideo.innerText = source.name;

  const stream = await getStream(source.id);
  playStream(stream);

  recorder = new MediaRecorder(stream, recorderOptions);
  recorder.ondataavailable = handleDataAvailable;
  recorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  if (e.data && e.data.size > 0) recordedChunks.push(e.data);
}
function play() {
  var superBuffer = new Blob(recordedChunks);
  videoElement.src = window.URL.createObjectURL(superBuffer);
}
async function handleStop() {
  var blob = new Blob(recordedChunks, {
    type: 'video/webm',
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = url;
  a.download = `scrn-rcrd-${Date.now()}.webm`;
  a.click();
  window.URL.revokeObjectURL(url);

  // const buffer = await getBufferFromRecordedChunks(recordedChunks);
  // const { filePath } = await dialog.showSaveDialog({
  //   buttonLabel: 'Save',
  //   defaultPath: `scrn-rcrd-${Date.now()}.webm`,
  // });

  // if (filePath) {
  //   writeFile(filePath, buffer, () => console.log('hakdog'));
  // }
}

(async () => {
  const videoSources = await getVideoSources();
  const entireScreen = videoSources[0];
  selectSource(entireScreen);
})();
