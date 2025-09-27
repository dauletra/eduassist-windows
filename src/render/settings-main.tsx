import React from 'react';
import ReactDOM from 'react-dom/client';
import SettingsApp from './components/Settings/SettingsApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('settings-root')!).render(
  <React.StrictMode>
    <SettingsApp />
  </React.StrictMode>
)
