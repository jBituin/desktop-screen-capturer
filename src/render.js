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
const recorderOptions = { mimeType: 'video/webm; codecs=vp9' };
const recordedChunks = [];

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
  recorder.start();
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
  recordedChunks.push(e.data);
}

async function handleStop() {
  const buffer = await getBufferFromRecordedChunks(recordedChunks);
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save',
    defaultPath: `scrn-rcrd-${Date.now()}.webm`,
  });

  if (filePath) {
    writeFile(filePath, buffer);
  }
}

(async () => {
  const videoSources = await getVideoSources();
  const entireScreen = videoSources[0];
  selectSource(entireScreen);
})();
