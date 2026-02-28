import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import initAuth from './lib/initAuth';

const root = ReactDOM.createRoot(document.getElementById('root'));
// initialize JWT fetch interceptor before app mounts
initAuth({
  onUnauthorized: () => {
    // redirect to login on 401 from backend
    // Remove token and let the app handle auth state
    // Don't use window.location to avoid infinite redirect loops
  },
});
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// TODO: name all of the buttons on the navigation bar
// TODO: Change the home page to say Welcome, (username)
// TODO: Make admin have different buttons than teacher
reportWebVitals();




