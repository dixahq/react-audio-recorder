'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _wavEncoderJs = require('./wav-encoder.js');

var _wavEncoderJs2 = _interopRequireDefault(_wavEncoderJs);

var AudioRecorder = (function (_Component) {
  _inherits(AudioRecorder, _Component);

  function AudioRecorder(props) {
    _classCallCheck(this, AudioRecorder);

    _get(Object.getPrototypeOf(AudioRecorder.prototype), 'constructor', this).call(this, props);

    this.buffers = [[], []];
    this.bufferLength = 0;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    this.recordingStream = null;
    this.playbackSource = null;

    this.state = {
      recording: false,
      playing: false,
      audio: props.audio
    };
  }

  _createClass(AudioRecorder, [{
    key: 'startRecording',
    value: function startRecording() {
      var _this = this;

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      navigator.getUserMedia({ audio: true }, function (stream) {
        var gain = _this.audioContext.createGain();
        var audioSource = _this.audioContext.createMediaStreamSource(stream);
        audioSource.connect(gain);

        var bufferSize = 2048;
        var recorder = _this.audioContext.createScriptProcessor(bufferSize, 2, 2);
        recorder.onaudioprocess = function (event) {
          // save left and right buffers
          for (var i = 0; i < 2; i++) {
            var channel = event.inputBuffer.getChannelData(i);
            _this.buffers[i].push(new Float32Array(channel));
            _this.bufferLength += bufferSize;
          }
        };

        gain.connect(recorder);
        recorder.connect(_this.audioContext.destination);
        _this.recordingStream = stream;
      }, function (err) {});

      this.setState({
        recording: true
      });

      if (this.props.onRecordStart) {
        this.props.onRecordStart.call();
      }
    }
  }, {
    key: 'stopRecording',
    value: function stopRecording() {
      this.recordingStream.getTracks()[0].stop();

      var audioData = (0, _wavEncoderJs2['default'])(this.buffers, this.bufferLength, this.sampleRate);

      console.log(audioData);

      this.setState({
        recording: false,
        audio: audioData,
        duration: this.bufferLength / this.sampleRate
      });

      if (this.props.onChange) {
        this.props.onChange.call(null, {
          duration: this.bufferLength / this.sampleRate,
          blob: audioData
        });
      }
    }
  }, {
    key: 'startPlayback',
    value: function startPlayback() {
      var _this2 = this;

      var reader = new window.FileReader();
      reader.readAsArrayBuffer(this.state.audio);
      reader.onloadend = function () {
        _this2.audioContext.decodeAudioData(reader.result, function (buffer) {
          var source = _this2.audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(_this2.audioContext.destination);
          source.loop = _this2.props.loop;
          source.start(0);
          source.onended = _this2.onAudioEnded.bind(_this2);

          _this2.playbackSource = source;
        });

        _this2.setState({
          playing: true
        });

        if (_this2.props.onPlay) {
          _this2.props.onPlay.call();
        }
      };
    }
  }, {
    key: 'stopPlayback',
    value: function stopPlayback(event) {
      if (this.state.playing) {
        event.preventDefault();

        this.setState({
          playing: false
        });

        if (this.props.onAbort) {
          this.props.onAbort.call();
        }
      }
    }
  }, {
    key: 'removeAudio',
    value: function removeAudio() {
      if (this.state.audio) {
        if (this.playbackSource) {
          this.playbackSource.stop();
          delete this.playbackSource;
        }

        this.setState({
          audio: false
        });

        if (this.props.onChange) {
          this.props.onChange.call();
        }
      }
    }
  }, {
    key: 'downloadAudio',
    value: function downloadAudio() {
      var url = (window.URL || window.webkitURL).createObjectURL(this.state.audio);
      var link = document.createElement('a');
      link.href = url;

      if (this.props.downloadFile) {
        link.download = this.props.downloadFile;
      } else {
        link.download = 'output.wav';
      }

      var click = document.createEvent('Event');
      click.initEvent('click', true, true);
      link.dispatchEvent(click);
    }
  }, {
    key: 'saveAudio',
    value: function saveAudio() {
      if (this.props.onSave) {
        this.props.onSave.call();
      }
    }
  }, {
    key: 'onAudioEnded',
    value: function onAudioEnded() {
      if (this.state.playing) {
        this.setState({ playing: false });
      }

      if (this.props.onEnded) {
        this.props.onEnded.call();
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (this.state.audio && nextProps.audio !== this.state.audio) {
        this.stopPlayback();
        this.setState({
          audio: nextProps.audio
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var icons = this.props.icons;

      var buttonIcon = undefined,
          audioButtons = undefined;
      var clickHandler = undefined;

      var buttonClass = ['AudioRecorder-button'];
      var downloadButtonClass = ['AudioRecorder-download'];
      var removeButtonClass = ['AudioRecorder-remove'];

      console.log(this.state.audio);

      if (this.state.audio) {
        buttonClass.push('hasAudio');

        downloadButtonClass.splice(downloadButtonClass.indexOf('disabled'), 1);
        removeButtonClass.splice(removeButtonClass.indexOf('disabled'), 1);

        if (this.state.playing) {
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

        if (this.state.recording) {
          buttonClass.push('isRecording');
          buttonIcon = icons.recording;
          clickHandler = this.stopRecording;
        } else {
          buttonIcon = icons.record;
          clickHandler = this.startRecording;
        }
      }

      audioButtons = [];

      if (this.props.download) {
        audioButtons.push(_react2['default'].createElement(
          'button',
          { type: 'button', id: 'download-button', key: 'download', className: downloadButtonClass.join(' '), onClick: this.downloadAudio.bind(this) },
          icons.download
        ));
      }

      if (this.props.onSave) {
        audioButtons.push(_react2['default'].createElement(
          'button',
          { type: 'button', id: 'save-button', key: 'save', className: downloadButtonClass.join(' '), onClick: this.saveAudio.bind(this) },
          icons.save
        ));
      }

      return _react2['default'].createElement(
        'div',
        { className: 'AudioRecorder' },
        _react2['default'].createElement(
          'button',
          { type: 'button', className: buttonClass.join(' '), onClick: clickHandler && clickHandler.bind(this) },
          buttonIcon
        ),
        _react2['default'].createElement(
          'button',
          { type: 'button', id: 'remove-button', key: 'remove', className: removeButtonClass.join(' '), onClick: this.removeAudio.bind(this) },
          icons.remove
        ),
        audioButtons
      );
    }
  }]);

  return AudioRecorder;
})(_react.Component);

AudioRecorder.PropTypes = {
  audio: _react.PropTypes.instanceOf(Blob),
  download: _react.PropTypes.bool,
  downloadFile: _react.PropTypes.string,
  loop: _react.PropTypes.bool,

  onAbort: _react.PropTypes.func,
  onChange: _react.PropTypes.func,
  onEnded: _react.PropTypes.func,
  onPause: _react.PropTypes.func,
  onPlay: _react.PropTypes.func,
  onRecordStart: _react.PropTypes.func,
  onSave: _react.PropTypes.func,

  icons: _react2['default'].PropTypes.shape({
    play: _react.PropTypes.object,
    playing: _react.PropTypes.object,
    record: _react.PropTypes.object,
    recording: _react.PropTypes.object,
    remove: _react.PropTypes.object,
    download: _react.PropTypes.object,
    save: _react.PropTypes.object
  })
};

AudioRecorder.defaultProps = {
  loop: false,

  icons: {
    play: _react2['default'].createElement('span', { className: 'i-play s-icon', 'aria-hidden': 'true' }),
    playing: _react2['default'].createElement('span', { className: 'i-pause s-icon', 'aria-hidden': 'true' }),
    record: _react2['default'].createElement('span', { className: 'i-circle-full s-icon', 'aria-hidden': 'true' }),
    recording: _react2['default'].createElement('span', { className: 'i-circle-full s-icon blinking', 'aria-hidden': 'true' }),
    remove: _react2['default'].createElement('span', { className: 'i-delete s-icon', 'aria-hidden': 'true' }),
    save: _react2['default'].createElement('span', { className: 'i-upload s-icon', 'aria-hidden': 'true' }),
    download: _react2['default'].createElement('span', { className: 'i-download s-icon', 'aria-hidden': 'true' })
  }
};

exports['default'] = AudioRecorder;
module.exports = exports['default'];