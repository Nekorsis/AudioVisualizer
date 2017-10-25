import React, {Component} from 'react';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      audioStream: null,
    };
  };

  componentDidMount() {
    this.canvasElement.width = 300;//'400px';
    this.canvasElement.height = 300; //'250px';

    this.ctx = this.canvasElement.getContext("2d");
  };

  audioElement = null;
  canvasElement = null;

  ctx = null;

  audioCtx = new AudioContext();
  source = null;
  analyser = null; 

  bufferLength = null; // this.analyser.fftSize;
  dataArray = null; // Uint8Array(bufferLength);

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
    };
    this.ctx.lineTo(WIDTH, HEIGHT/2);
    this.ctx.stroke();
  };

  checkNavigator = () => {
    const constraints = {
      audio: true,
    };
    navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      this.setState(() => {
        return { audioStream: stream.getAudioTracks().filter(track => track.enabled === true)[0] }
      });
      this.audioElement.srcObject  = stream;

      this.audioCtx = new AudioContext();
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.source.connect(this.analyser);
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      //this.analyser.getByteTimeDomainData(this.dataArray);
      this.drawSomething();

    })
    .catch((error) => {
      console.log('err: ', error);
    });
  };

  stopRecording = () => {
    this.state.audioStream.stop();
  };

  saveRecord = () => {
    console.log('hi');
    const url = appState.fullScreenImageUrl;
    const link = document.createElement("a");
    const file = this.files.filter(file => {
      return file.file.src === url;
    });
    link.download = `${file[0].file.file}`;
    link.href = url;
    link.click();
  };

  render() {
    return (
      <div className='container'>
        <button onClick={this.checkNavigator} >Start recording</button>
        <button onClick={this.stopRecording} >Stop recording</button>
        <button onClick={this.saveRecord}> Save record </button>
        <audio ref={this.setAudioRef} />
        <canvas ref={this.setCanvasRef} id="canvas"></canvas>
      </div>
    );
  }
}
export default App;
