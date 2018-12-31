import * as React from 'react';
import './App.css';

import logo from './logo.svg';

import D3test from './D3test';

import sharedFolderTest from './shared/test';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">{sharedFolderTest.message}</h1>
        </header>
        <D3test />
      </div>
    );
  }
}

export default App;
