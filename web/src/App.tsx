import * as React from 'react';
import './App.css';
import logo from './logo.svg';
import sharedFolderTest from './shared/test';
import VictoryTest from './VictoryTest';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">{sharedFolderTest.message}</h1>
        </header>
        <div className="VictoryTest">
          <VictoryTest />
        </div>
      </div>
    );
  }
}

export default App;
