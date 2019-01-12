import * as React from 'react';
import './App.css';
import logo from './logo.svg';
import sharedFolderTest from './shared/test';

import Timeline from 'src/components/Timeline';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">{sharedFolderTest.message}</h1>
        </header>
        <div className="Timeline">
          <Timeline />
        </div>
      </div>
    );
  }
}

export default App;
