export function Track({ track, onVolumeChange, onPanChange, onRemove }) {
  const handleVolumeChange = (e) => {
    onVolumeChange(track.id, parseFloat(e.target.value));
  };

  const handlePanChange = (e) => {
    onPanChange(track.id, parseFloat(e.target.value));
  };

  const handleVolumeDblClick = () => {
    onVolumeChange(track.id, 1);
  };

  const handlePanDblClick = () => {
    onPanChange(track.id, 0);
  };

  return (
    <div className="track">
      <div className="track-header">
        <h3 title={track.name}>{track.name}</h3>
      </div>

      <div className="pan-container">
        <label className="fader-label">Pan</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={handlePanChange}
          onDoubleClick={handlePanDblClick}
          className="fader horizontal-fader"
          title="Double-click to reset to center"
        />
        <span className="fader-value">{track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}</span>
      </div>

      <div className="faders-container">
        <div className="control-group vertical">
          <label className="fader-label">Vol</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.volume}
            onChange={handleVolumeChange}
            onDoubleClick={handleVolumeDblClick}
            className="fader vertical-fader"
            title="Double-click to reset to 100%"
          />
          <span className="fader-value">{Math.round(track.volume * 100)}%</span>
        </div>
      </div>

      <div className="delete-container">
        <label className="delete-label">DELETE TRACK</label>
        <button className="btn-delete" onClick={() => onRemove(track.id)}>
        </button>          
      </div>
    </div>
  );
}
