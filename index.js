let audioContext = new (window.AudioContext || window.webkitAudioContext);
let oscList = [];
let masterGainNode = null;

let keyboard = document.querySelector(".keyboard");
let wavePicker = document.querySelector("select[name='waveform']");
let volumeControl = document.querySelector("input[name='volume']");

let noteFreq = null;
let customWaveform = null;
let sineTerms = null;
let cosineTerms = null;

setup();

function setup() {
  noteFreq = createNoteTable();
  
  volumeControl.addEventListener("change", changeVolume, false);
  
  masterGainNode = audioContext.createGain();
  masterGainNode.connect(audioContext.destination);
  masterGainNode.gain.value = volumeControl.value;
  
  // Create the keys; skip any that are sharp or flat; for
  // our purposes we don't need them. Each octave is inserted
  // into a <div> of class "octave".
  
  noteFreq.forEach(function(keys, idx) {
    let keyList = Object.entries(keys);
    let octaveElem = document.createElement("div");
    octaveElem.className = "octave";
    
    keyList.forEach(function(key) {
      if (key[0].length == 1) {
        octaveElem.appendChild(createKey(key[0], idx, key[1]));
      }
    });
    
    keyboard.appendChild(octaveElem);
  });
  
  document.querySelector("div[data-note='B'][data-octave='5']").scrollIntoView(false);
  
  sineTerms = new Float32Array([0, 0, 1, 0, 1]);
  cosineTerms = new Float32Array(sineTerms.length);
  customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms);
  
  for (i=0; i<9; i++) {
    oscList[i] = [];
  }
}

function createNoteTable() {
  let noteFreq = [];
  let notes = ["A",  "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
  
  noteFreq[0] = [];
  noteFreq[0]["A"] = 27.500000000000000;
  noteFreq[0]["A#"] = 29.135235094880619;
  noteFreq[0]["B"] = 30.867706328507756;
  
  noteFreq[1] = [];
  noteFreq[1]["C"] = 32.703195662574829;
  noteFreq[1]["C#"] = 34.647828872109012;
  noteFreq[1]["D"] = 36.708095989675945;
  noteFreq[1]["D#"] = 38.890872965260113;
  noteFreq[1]["E"] = 41.203444614108741;
  noteFreq[1]["F"] = 43.653528929125485;
  noteFreq[1]["F#"] = 46.249302838954299;
  noteFreq[1]["G"] = 48.999429497718661;
  noteFreq[1]["G#"] = 51.913087197493142;
  noteFreq[1]["A"] = noteFreq[0]["A"] * 2;
  noteFreq[1]["A#"] = noteFreq[0]["A#"] * 2;
  noteFreq[1]["B"] = noteFreq[0]["B"] * 2;
  
  for (let i = 2; i < 9; i++) {
    noteFreq[i] = [];
    notes.forEach(note =>
      noteFreq[i][note] = noteFreq[i-1][note] * 2
    );
  }
  
  return noteFreq;
}

function createKey(note, octave, freq) {
  let keyElement = document.createElement("div");
  let labelElement = document.createElement("div");
  
  keyElement.className = "key";
  keyElement.dataset["octave"] = octave;
  keyElement.dataset["note"] = note;
  keyElement.dataset["frequency"] = freq;
  
  labelElement.innerHTML = note + "<sub>" + octave + "</sub>";
  keyElement.appendChild(labelElement);
  
  keyElement.addEventListener("mousedown", notePressed, false);
  keyElement.addEventListener("mouseup", noteReleased, false);
  keyElement.addEventListener("mouseover", notePressed, false);
  keyElement.addEventListener("mouseleave", noteReleased, false);
  
  return keyElement;
}

function playTone(freq) {
  let osc = audioContext.createOscillator();
  osc.connect(masterGainNode);
  
  let type = wavePicker.options[wavePicker.selectedIndex].value;
  
  if (type == "custom") {
    osc.setPeriodicWave(customWaveform);
  } else {
    osc.type = type;
  }
  
  osc.frequency.value = freq;
  osc.start();
  
  return osc;
}

function notePressed(event) {
  if (event.buttons & 1) {
    let dataset = event.target.dataset;
    
    if (!dataset["pressed"]) {
      oscList[dataset["octave"][dataset["note"]]] = playTone(dataset["frequency"]);
      dataset["pressed"] = "yes";
    }
  }
}

function noteReleased(event) {
  let dataset = event.target.dataset;
  
  if (dataset && dataset["pressed"]) {
    oscList[dataset["octave"][dataset["note"]]].stop();
    oscList[dataset["octave"][dataset["note"]]] = null;
    delete dataset["pressed"];
  }
}

function changeVolume(event) {
  masterGainNode.gain.value = volumeControl.value
}