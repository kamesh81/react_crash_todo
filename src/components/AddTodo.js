import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
const RANGE = 'Sheet1!A2:D';

function AddTodo({ accessToken, login }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}:append`;
      const newRow = [Date.now().toString(), title, 'N', dueDate];

      await axios.post(url, {
        values: [newRow],
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS'
        }
      });

      history.push('/');
    } catch (error) {
      console.error('Error adding new task:', error);
    }
  };

  const handleCancel = () => {
    history.push('/');
  };

  if (!accessToken) {
    return (
      <div className="add-todo-container">
        <h2>Add New Task</h2>
        <button className="google-sign-in" onClick={() => login()}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="add-todo-container">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit} className="add-todo-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter new task"
          required
          className="add-todo-input"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          className="add-todo-input"
        />
        <div className="button-container">
          <button type="submit" className="add-todo-button">Add Task</button>
          <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default AddTodo;