import React, {Component} from 'react';
import MessageList from './MessageList.jsx';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      audioStream: null,
      messages: [],
    };
  }

  componentDidMount() {
    this.canvasElement.width = 300;
    this.canvasElement.height = 50;

    this.ctx = this.canvasElement.getContext('2d');
  }

  audioElement = null;
  canvasElement = null;

  ctx = null;

  audioCtx = new AudioContext();
  source = null;
  analyser = null; 

  bufferLength = null;
  dataArray = null;

  recorder = null;
  isRecording = false;
  
  addMessage = (message) => {
    this.setState(() => {
      let prevMessages = this.state.messages;
      prevMessages.push(message);
      return { messages: prevMessages };
    });
  };

  setAudioRef = (ref) => {
    this.audioElement = ref;
  };
  
  setCanvasRef = (ref) => {
    this.canvasElement = ref;
  };

  drawSomething = () => {
    requestAnimationFrame(this.drawSomething);
    this.analyser.getByteTimeDomainData(this.dataArray); //copies the current waveform, or time-domain, data into a Uint8Array

    const WIDTH = this.canvasElement.width;
    const HEIGHT = this.canvasElement.height;

    this.ctx.fillStyle = 'rgb(200, 200, 200)';
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgb(0, 0, 0)';
    
    this.ctx.beginPath();

    const sliceWidth = WIDTH * 1.0 / this.bufferLength;
    let x = 0;

    for(let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = v * HEIGHT/2;

      if(i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    this.ctx.lineTo(WIDTH, HEIGHT/2);
    this.ctx.stroke();
  };

  checkNavigator = () => {
    const constraints = {
      audio: true,
    };
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.isRecording = true;
        this.setState(() => {
          return { audioStream: stream.getAudioTracks().filter(track => track.enabled === true)[0] };
        });
        
        this.audioCtx = new AudioContext();
        this.source = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.source.connect(this.analyser);
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        // store streaming data chunks in array
        const chunks = [];

        // create media recorder instance to initialize recording
        this.recorder = new MediaRecorder(stream);

        this.recorder.ondataavailable = e => {
          chunks.push(e.data);
          if (this.recorder.state == 'inactive') {
            const blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
            this.saveRecord(URL.createObjectURL(blob));
          }
        };

        // start recording with 1 second time between receiving 'ondataavailable' events
        this.recorder.start(1000);

        this.drawSomething();
      })
      .catch((error) => {
        throw new Error(error);
      });
  };

  stopRecording = () => {
    if (this.isRecording !== true) {
      return;
    }
    this.isRecording = false;
    this.recorder.stop();
  };

  saveRecord = (blobUrl) => {
    const downloadEl = document.createElement('a');
    downloadEl.style = 'display: block';
    downloadEl.innerHTML = 'download';
    downloadEl.download = 'audio.webm';
    downloadEl.href = blobUrl;
    const audioEl = document.createElement('audio');
    audioEl.controls = true;

    if (audioEl.duration === Infinity) {
      audioEl.currentTime = 1e101;
      audioEl.ontimeupdate = () => {
        this.ontimeupdate = () => { return; };
        audioEl.currentTime = 0;
      };
    }

    audioEl.src = blobUrl;
    document.body.appendChild(audioEl);
    document.body.appendChild(downloadEl);
    this.addMessage(blobUrl);
    this.stopRecording();
    this.state.audioStream.stop();
  };

  render() {
    return (
      <div className='container'>
        <MessageList messages={this.state.messages} />
        <canvas
          className='audio-visualizer'
          ref={this.setCanvasRef}
          style={{
            display: !this.isRecording ? 'none' : 'block' 
          }}
          id="canvas" 
        />
        <div className='input-container'>
          <div
            className='red-dot'
            style={{
              display: !this.isRecording ? 'none' : 'block'
            }}
          />
          <input
            type='text'
            name='text'
            className='text-input'
            placeholder={this.isRecording ? 'Release outside of the button to cancel recording' : ''}
          />
          <button 
            onMouseDown={this.checkNavigator}
            onMouseUp={this.stopRecording}
            onMouseLeave={this.stopRecording}
            className='input-button'
          >
            press me
          </button>
        </div>
      </div>
    );
  }
}
export default App;
