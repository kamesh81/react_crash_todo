import React, { Component } from 'react';

class Todos extends Component {
  render() {
    return (
      <div>
        {this.props.todos.map((todo) => (
          <div key={todo.id} className="todo-item">
            <input
              type="checkbox"
              onChange={this.props.markComplete.bind(this, todo.id)}
            />
            {todo.title}
          </div>
        ))}
      </div>
    );
  }
}

export default Todos;
