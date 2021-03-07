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

let recorder;
const recorderOoptions = { mimeType: 'video/webm; codecs=vp9' };
const recordedChunks = [];

const videoElement = document.querySelector('video');

// Buttons
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const selectVideo = document.getElementById('select-video');

// Event handlers
startButton.onclick = () => {
  recorder.start();
  startButton.classList.add('is-danger');
  startButton.innerText = 'Recording';
};
stopButton.onclick = () => {
  recorder.stop();
  startButton.classList.remove('is-danger');
  startButton.innerText = 'Start';
};
selectVideo.onclick = showVideoSources;

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

  recorder = new MediaRecorder(stream, recorderOoptions);
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
    defaultPath: `vid-${Date.now()}.webm`,
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }
}

(async () => {
  const videoSources = await getVideoSources();
  const entireScreen = videoSources[0];
  const stream = await getStream(entireScreen.id);
  playStream(stream);
})();
