import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
const RANGE = 'Sheet1!A2:D'; // Adjust if your sheet name is different

// Move this function outside of the component
const updateTaskInSpreadsheet = async (accessToken, tasks, taskId, updates) => {
  if (!accessToken) return;

  try {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const range = `Sheet1!A${taskIndex + 2}:D${taskIndex + 2}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

    const updatedTask = { ...tasks[taskIndex], ...updates };
    const values = [[updatedTask.id, updatedTask.title, updatedTask.completed ? 'Y' : 'N', updatedTask.dueDate]];

    await axios.put(url, {
      values: values,
      range: range,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        valueInputOption: 'RAW'
      }
    });

    console.log('Task updated in spreadsheet');
  } catch (error) {
    console.error('Error updating task in spreadsheet:', error);
    throw error;
  }
};

function TodoList({ accessToken, login }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const history = useHistory();

  const fetchTasks = async () => {
    if (!accessToken) return;

    try {
      console.log('Fetching tasks...');
      console.log('Spreadsheet ID:', SPREADSHEET_ID);
      console.log('Range:', RANGE);
      console.log('Access Token:', accessToken.substring(0, 10) + '...');

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`;
      console.log('Request URL:', url);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.values) {
        const fetchedTasks = response.data.values.map(row => {
          const [id, title, completed, dueDate] = row.concat(Array(4).fill(null));
          return {
            id: id || 'unknown',
            title: title || 'Untitled Task',
            completed: completed === 'Y',
            dueDate: dueDate || 'No due date'
          };
        });

        console.log('Fetched tasks:', fetchedTasks);
        setTasks(fetchedTasks);
      } else {
        console.log('No tasks found or unexpected response structure');
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      setError(`Failed to fetch tasks: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [accessToken]);

  const filteredTasks = showCompleted ? tasks : tasks.filter(task => !task.completed);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!accessToken) {
    return (
      <div className="todo-list">
        <h2>My Tasks</h2>
        <button className="google-sign-in" onClick={() => login()}>Sign in with Google</button>
      </div>
    );
  }

  const handleToggleComplete = async (taskId, completed) => {
    try {
      await updateTaskInSpreadsheet(accessToken, tasks, taskId, { completed: !completed });
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ));
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleEditStart = (task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDate(task.dueDate);
  };

  const handleEditTitleChange = (e) => {
    setEditingTitle(e.target.value);
  };

  const handleEditDateChange = (e) => {
    setEditingDate(e.target.value);
  };

  const handleEditSubmit = async (taskId) => {
    if (editingTitle.trim() === '') return;
    try {
      await updateTaskInSpreadsheet(accessToken, tasks, taskId, { 
        title: editingTitle,
        dueDate: editingDate
      });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, title: editingTitle, dueDate: editingDate } : task
      ));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="todo-list">
      <h2>My Tasks</h2>
      <div className="task-controls">
        <button 
          className="toggle-completed" 
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </button>
        <button 
          className="add-task-button" 
          onClick={() => history.push('/add')}
        >
          Add New Task
        </button>
      </div>
      {filteredTasks.length === 0 ? (
        <p>No {showCompleted ? '' : 'active '}tasks found.</p>
      ) : (
        <ul>
          {filteredTasks.map((task) => (
            <li key={task.id} className={task.completed ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleComplete(task.id, task.completed)}
              />
              {editingTaskId === task.id ? (
                <div className="task-content">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={handleEditTitleChange}
                    onBlur={() => handleEditSubmit(task.id)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditSubmit(task.id)}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editingDate}
                    onChange={handleEditDateChange}
                    onBlur={() => handleEditSubmit(task.id)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditSubmit(task.id)}
                  />
                </div>
              ) : (
                <div 
                  className="task-content"
                  onClick={() => handleEditStart(task)}
                >
                  <span className="task-title">{task.title}</span>
                  <span className="task-due-date">{task.dueDate}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TodoList;