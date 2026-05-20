import React from 'react';
import ReactDOM from 'react-dom/client';

import Login from './Login.tsx';
import './login.css';

import MainPage from './MainPage';
import './mainPage.css';

import Ticket from './Ticket';
import './ticket.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Ticket />
  </React.StrictMode>,
);