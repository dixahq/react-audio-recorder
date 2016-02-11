var React = require('react');
var ReactDOM = require('react-dom');
var AudioRecorder = require('react-audio-recorder');

var App = React.createClass({
  onSave: function() {
    console.log('Save');
  },

  render () {
    return (
      <div>
        <form>
          <AudioRecorder
            download= {true}
            onSave= {this.onSave}
            downloadFile= 'test.wav'
            text= 'test.wav' />
        </form>
      </div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));
