// theme toggle
const themeMap = {
    dark: 'light',
    light: 'solar',
    solar: 'dark'
};

const theme = localStorage.getItem('theme');
const bodyClass = document.body.classList;
theme && bodyClass.add(theme);

function toggleTheme() {
    const current = localStorage.getItem('theme') || 'light';
    const next = themeMap[current];
    bodyClass.replace(current, next);
    localStorage.setItem('theme', next);
}

document.getElementById('themeButton').onclick = toggleTheme;
// button and video
const videoElement = document.querySelector('video');
const startBtn = document.querySelector('#startBtn');
const stopBtn = document.querySelector('#stopBtn');
const shotBtn = document.querySelector('#shotBtn');
const videoSelectBtn = document.querySelector('#videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;
let mediaRecorder;
const chunks = [];

if (!!startBtn) {
    startBtn.onclick = e => {
        mediaRecorder.start();
        startBtn.classList.add('is-danger');
        startBtn.innerText = 'Recording';
    };
}

if (!!stopBtn) {
    stopBtn.onclick = e => {
        mediaRecorder.stop();
        startBtn.classList.remove('is-danger');
        startBtn.innerText = 'Start';
    };
}

if (!!shotBtn) {
    shotBtn.onclick = e => {
        saveScreenshot(e)
    };
}

const { desktopCapturer,remote } = require('electron');
const {Menu} = remote;
// get video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({types: ['window', 'screen']});
    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source),

            }
        })
    );
    videoOptionsMenu.popup();
}


async function selectSource(source) {
    videoSelectBtn.innerText = source.name;
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    videoElement.play();
    const options = {mimeType: 'video/webm; codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = handleAvailability;
    mediaRecorder.onstop = handleStop;

}

function handleAvailability(e) {
    chunks.push(e.data);
}

const {dialog} = remote;
const {writeFile} = require('fs');
async function handleStop(e) {
    const blob = new Blob(chunks , {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    writeFile(filePath, buffer, () => console.log('saved'));


}

async function saveScreenshot(_e) {
    const imageFormat = 'image/jpeg';
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0,0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL(imageFormat);
    var buffer = Buffer.from(base64.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64');
    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: 'Save Screenshot',
        defaultPath: `scr-${Date.now()}.jpg`
    });
    writeFile(filePath, buffer, () => console.log('saved'));
    chunks.splice(0, chunks.length);
}