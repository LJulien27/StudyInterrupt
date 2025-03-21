import './MySessions.css';


const MySessions = () => {

  return (
    <div className="Wrap">
      <aside className="Left"></aside>
      <main className="Middle">
        <div className="active-session-grid">
          <div className="active-session-grid-item-1">Active Session</div>
          <div className="active-session-grid-item-2">5 hours 34 minutes remaining</div>
          <div className="active-session-grid-item-3">
            <button>STOP SESSION</button>
          </div>
        </div>
        <br/><br/>
        <div className="start-session-grid">
          <div className="start-session-grid-item-1">Start Session</div>
          <div className="start-session-grid-item-2">
            <div className="start-session-flex-container">
              <div className="start-session-flex-item">
                <input type="text" />
              </div>
              <div className="start-session-flex-item">hours</div>
              <div className="start-session-flex-item">
                <input type="text" />
              </div>
              <div className="start-session-flex-item">minutes</div>
              <div className="start-session-flex-item">
                <button>START</button>
              </div>
            </div>
          </div>
        </div>
        <br/><br/>
        <div className="my-blocklist-grid">
          <div className="my-blocklist-grid-item-1">Active Session</div>
          <div className="my-blocklist-grid-item-2">
            <input type="text" />
          </div>
          <div className="my-blocklist-grid-item-3">
            <button>ADD SITE</button>
          </div>
        </div>
      </main>
      <aside className="Right"></aside>
    </div>

  );
};

export default MySessions;
