import React, { useState, useEffect } from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import TodoList from './TodoList';
import AddTodo from './AddTodo';

function AppContent() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('OAuth Success:', tokenResponse);
      const newToken = tokenResponse.access_token;
      setAccessToken(newToken);
      localStorage.setItem('accessToken', newToken);
    },
    onError: (error) => console.error('OAuth Error:', error),
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  });


  const handleSignOut = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <div className="App">
      <div className="todo-container">
        <h1>My Todo App</h1>
        <nav>
          <ul>
            {accessToken && <li><button onClick={handleSignOut}>Sign Out</button></li>}
          </ul>
        </nav>
        <Switch>
          <Route exact path="/" render={() => <TodoList accessToken={accessToken} login={login} />} />
          <Route path="/add" render={() => <AddTodo accessToken={accessToken} login={login} />} />
        </Switch>
      </div>
    </div>
  );
}

export default AppContent;