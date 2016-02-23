import React, { Component, PropTypes } from 'react';
import encodeWAV from './wav-encoder.js';

class AudioRecorder extends Component {
  constructor(props) {
    super(props);

    this.buffers = [[], []];
    this.bufferLength = 0;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    this.recordingStream = null;
    this.playbackSource = null;

    this.state = {
      recording: false,
      playing: false,
      audio: props.audio,
      duration: 0
    };
  }

  startRecording() {
    navigator.getUserMedia = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;
    navigator.getUserMedia({ audio: true }, (stream) => {
      const gain = this.audioContext.createGain();
      const audioSource = this.audioContext.createMediaStreamSource(stream);
      audioSource.connect(gain);

      const bufferSize = 2048;
      const recorder = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
      recorder.onaudioprocess = (event) => {
        // save left and right buffers
        for(let i = 0; i < 2; i++) {
          const channel = event.inputBuffer.getChannelData(i);
          this.buffers[i].push(new Float32Array(channel));
          this.bufferLength += bufferSize;
        }
      };

      gain.connect(recorder);
      recorder.connect(this.audioContext.destination);
      this.recordingStream = stream;
    }, (err) => {

    });

    this.setState({
      recording: true
    });

    if(this.props.onRecordStart) {
      this.props.onRecordStart.call();
    }
  }

  stopRecording() {
    this.recordingStream.getTracks()[0].stop();

    const audioData = encodeWAV(this.buffers, this.bufferLength, this.sampleRate);
    this.setState({
      recording: false,
      audio: audioData,
      duration: this.bufferLength / this.sampleRate / 2
    });

    console.log(this.buffers);

    console.log(this.bufferLength / this.sampleRate / 2);

    if(this.props.onChange) {
      this.props.onChange.call(null, {
        duration: this.bufferLength / this.sampleRate / 2,
        blob: audioData
      });
    }
  }

  startPlayback() {
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(this.state.audio);
    reader.onloadend = () => {
      this.audioContext.decodeAudioData(reader.result, (buffer) => {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.loop = this.props.loop;
        source.start(0);
        source.onended = this.onAudioEnded.bind(this);

        this.playbackSource = source;
      });

      this.setState({
        playing: true
      });

      if(this.props.onPlay) {
        this.props.onPlay.call();
      }
    };
  }

  stopPlayback(event) {
    if(this.state.playing) {
      event.preventDefault();

      this.setState({
        playing: false
      });

      if(this.props.onAbort) {
        this.props.onAbort.call();
      }
    }
  }

  removeAudio() {
    console.log(this);
    if(this.state.audio) {
      this.recordingStream = null;
      this.playbackSource = null;

      this.setState({
        recording: false,
        playing: false,
        audio: false,
        duration: 0
      });

      this.buffers = [[], []];

      if(this.props.onChange) {
        this.props.onChange.call();
      }
    }
  }

  downloadAudio() {
    const url = (window.URL || window.webkitURL).createObjectURL(this.state.audio);
    const link = document.createElement('a');
    link.href = url;

    if(this.props.downloadFile) {
      link.download = this.props.downloadFile;
    } else {
      link.download = 'output.wav';
    }

    const click = document.createEvent('Event');
    click.initEvent('click', true, true);
    link.dispatchEvent(click);
  }

  saveAudio() {
    if(this.props.onSave) {
      this.props.onSave.call();
    }
    this.setState({audio: this.props.adio});
  }

  onAudioEnded() {
    if(this.state.playing) {
      this.setState({ playing: false });
    }

    if(this.props.onEnded) {
      this.props.onEnded.call();
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.audio && nextProps.audio !== this.state.audio) {
      this.stopPlayback();
      this.setState({
        audio: nextProps.audio
      });
    }
  }

  render() {
    const icons = this.props.icons;

    let buttonIcon, audioButtons;
    let clickHandler;

    let buttonClass = ['AudioRecorder-button'];
    let downloadButtonClass = ['AudioRecorder-download'];
    let removeButtonClass = ['AudioRecorder-remove'];

    if(this.state.audio) {
      buttonClass.push('hasAudio');

      downloadButtonClass.splice(downloadButtonClass.indexOf('disabled'),1);
      removeButtonClass.splice(removeButtonClass.indexOf('disabled'),1);

      if(this.state.playing) {
        buttonClass.push('isPlaying');
        buttonIcon = icons.playing;
        clickHandler = this.stopPlayback;
      } else {
        buttonIcon = icons.play;
        clickHandler = this.startPlayback;
      }
    } else {
      downloadButtonClass.push('disabled');
      removeButtonClass.push('disabled');

      if(this.state.recording) {
        buttonClass.push('isRecording');
        buttonIcon = icons.recording;
        clickHandler = this.stopRecording;
      } else {
        buttonIcon = icons.record;
        clickHandler = this.startRecording;
      }
    }

    audioButtons = [];

    if(this.props.download) {
      audioButtons.push(
        <button type="button" id="download-button" key="download" className={downloadButtonClass.join(' ')} onClick={this.downloadAudio.bind(this)} >
          {icons.download}
        </button>
      );
    }

    if(this.props.onSave) {
      audioButtons.push(
        <button type="button" id="save-button" key="save" className={downloadButtonClass.join(' ')} onClick={this.saveAudio.bind(this)} >
          {icons.save}
        </button>
      );
    }

    return (
      <div className="AudioRecorder">
        <button type="button" className={buttonClass.join(' ')} onClick={clickHandler && clickHandler.bind(this)} >
          {buttonIcon}
        </button>
        <p className="AudioRecorderInfoText">{this.props.text}</p>
        <button type="button" id="remove-button" key="remove" className={removeButtonClass.join(' ')} onClick={this.removeAudio.bind(this)} >
          {icons.remove}
        </button>
        {audioButtons}
      </div>
    );
  }
}

AudioRecorder.PropTypes = {
  audio: PropTypes.instanceOf(Blob),
  download: PropTypes.bool,
  downloadFile: PropTypes.string,
  text: PropTypes.string,
  loop: PropTypes.bool,

  onAbort: PropTypes.func,
  onChange: PropTypes.func,
  onEnded: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  onRecordStart: PropTypes.func,
  onSave: PropTypes.func,

  icons: React.PropTypes.shape({
    play: PropTypes.object,
    playing: PropTypes.object,
    record: PropTypes.object,
    recording: PropTypes.object,
    remove: PropTypes.object,
    download: PropTypes.object,
    save: PropTypes.object
  })
};

AudioRecorder.defaultProps = {
  loop: false,

  icons: {
    play: <span className="i-play s-icon" aria-hidden="true"></span>,
    playing: <span className="i-pause s-icon" aria-hidden="true"></span>,
    record: <span className="i-circle-full s-icon" aria-hidden="true"></span>,
    recording: <span className="i-circle-full s-icon blinking" aria-hidden="true"></span>,
    remove: <span className="i-delete s-icon" aria-hidden="true"></span>,
    save: <span className="i-upload s-icon" aria-hidden="true"></span>,
    download: <span className="i-download s-icon" aria-hidden="true"></span>
  }
};

export default AudioRecorder;
