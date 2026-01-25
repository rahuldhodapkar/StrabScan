// Copyright 2026 Rahul DHodapkar.
//
// Adapted from content released by The MediaPipe Authors under
// the Apache License, Version 2.0.
//
// Now released under GNU GPL v3 (LICENSE) in accordance with
// the license file included in this directory.
//
// you may not use this file except in compliance with the LICENSE.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3"
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision
const demosSection = document.getElementById("demos")
const imageBlendShapes = document.getElementById("image-blend-shapes")
const videoBlendShapes = document.getElementById("video-blend-shapes")

// ===========================================================
// =========== DEFINE GLOBAL CONSTANTS =======================
// ===========================================================

let faceLandmarker
let runningMode = "IMAGE"
let enableWebcamButton
let webcamRunning = false
const videoWidth = 480

let currentFacingMode = "environment"; // "user" (front) | "environment" (back)
let currentStream = null;

// ===========================================================
// =========== INIT FACE LANDMARKER ==========================
// ===========================================================

async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  )
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  })
  demosSection.classList.remove("invisible")
}
createFaceLandmarker()

// ===========================================================
// =========== BEGIN WEBCAM INIT =============================
// ===========================================================

const video = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")

const canvasCtx = canvasElement.getContext("2d")

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton")
  enableWebcamButton.addEventListener("click", enableCam)
} else {
  console.warn("getUserMedia() is not supported by your browser")
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.")
    return
  }

  if (webcamRunning === true) {
    webcamRunning = false
    enableWebcamButton.innerText = "ENABLE PREDICTIONS"
  } else {
    webcamRunning = true
    enableWebcamButton.innerText = "DISABLE PREDICTIONS"
  }

  if (!webcamRunning && currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    return;
  }

  startCamera();
}

async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: { ideal: currentFacingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    video.addEventListener("loadeddata", predictWebcam);
    video.style.transform =
      currentFacingMode === "user" ? "scaleX(-1)" : "scaleX(1)";
  } catch (err) {
    console.error("Camera error:", err);
  }
}

// ===========================================================
// =========== BEGIN CAMERA TOGGLE CODE ======================
// ===========================================================

const switchCameraBtn = document.getElementById("switchCamera");

switchCameraBtn.addEventListener("click", async () => {
  currentFacingMode =
    currentFacingMode === "user" ? "environment" : "user";

  if (webcamRunning) {
    await startCamera();
  }
});

// ===========================================================
// =========== BEGIN DRAWING CODE ============================
// ===========================================================


let lastVideoTime = -1
let results = undefined
const drawingUtils = new DrawingUtils(canvasCtx)
async function predictWebcam() {
  // set required transform for back and front facing camera support

  canvasElement.style.transform =
      currentFacingMode === "user" ? "scaleX(-1)" : "scaleX(1)";

  const radio = video.videoHeight / video.videoWidth
  video.style.width = videoWidth + "px"
  video.style.height = videoWidth * radio + "px"
  canvasElement.style.width = videoWidth + "px"
  canvasElement.style.height = videoWidth * radio + "px"
  canvasElement.width = video.videoWidth
  canvasElement.height = video.videoHeight
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO"
    await faceLandmarker.setOptions({ runningMode: runningMode })
  }
  let startTimeMs = performance.now()
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = faceLandmarker.detectForVideo(video, startTimeMs)
  }
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      )
    }
  }
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes)

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam)
  }
}

function drawBlendShapes(el, blendShapes) {
  if (!blendShapes.length) {
    return
  }

  console.log(blendShapes[0])

  let htmlMaker = ""
  blendShapes[0].categories.map(shape => {
    htmlMaker += `
      <li class="blend-shapes-item">
        <span class="blend-shapes-label">${shape.displayName ||
          shape.categoryName}</span>
        <span class="blend-shapes-value" style="width: calc(${+shape.score *
          100}% - 120px)">${(+shape.score).toFixed(4)}</span>
      </li>
    `
  })

  el.innerHTML = htmlMaker
}
