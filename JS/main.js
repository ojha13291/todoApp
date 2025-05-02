const toDoInput = document.querySelector('.todo-input');
const toDoBtn = document.querySelector('.todo-btn');
const toDoList = document.querySelector('.todo-list');
const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');

const API_BASE_URL = 'http://localhost:5000/api';
const API_TODO_URL = `${API_BASE_URL}/todos`;
const API_AUTH_URL = `${API_BASE_URL}/auth`;

document.addEventListener("DOMContentLoaded", checkAuthAndInitialize);
toDoBtn.addEventListener('click', addToDo);
toDoList.addEventListener('click', deletecheck);
standardTheme.addEventListener('click', () => changeTheme('standard'));
lightTheme.addEventListener('click', () => changeTheme('light'));
darkerTheme.addEventListener('click', () => changeTheme('darker'));

let savedTheme = localStorage.getItem('savedTheme') || 'standard';
let currentUser = null;

function checkAuthAndInitialize() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    initializeApp();
}

async function initializeApp() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }
        currentUser = await response.json();
        setupUserInterface();
        await fetchTodos();
        changeTheme(savedTheme);
    } catch (error) {
        console.error('Error initializing app:', error);
        window.location.href = 'login.html';
    }
}

function setupUserInterface() {
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-container');
    const userGreeting = document.createElement('span');
    userGreeting.classList.add('user-greeting');
    userGreeting.textContent = `Hello, ${currentUser.name}`;
    userContainer.appendChild(userGreeting);
    const logoutBtn = document.createElement('button');
    logoutBtn.classList.add('logout-btn', `${savedTheme}-button`);
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', logout);
    userContainer.appendChild(logoutBtn);
    const header = document.getElementById('header');
    header.appendChild(userContainer);
}

async function logout() {
    try {
        await fetch(`${API_AUTH_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

async function fetchTodos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_TODO_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to fetch todos');
        }
        const todos = await response.json();
        toDoList.innerHTML = '';
        todos.forEach(function(todo) {
            createTodoElement(todo);
        });
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function createTodoElement(todo) {
    const toDoDiv = document.createElement("div");
    toDoDiv.classList.add('todo', `${savedTheme}-todo`);
    if (todo.completed) {
        toDoDiv.classList.add("completed");
    }
    toDoDiv.dataset.id = todo._id;
    const newToDo = document.createElement('li');
    newToDo.innerText = todo.text;
    newToDo.classList.add('todo-item');
    toDoDiv.appendChild(newToDo);
    const checked = document.createElement('button');
    checked.innerHTML = '<i class="fas fa-check"></i>';
    checked.classList.add('check-btn', `${savedTheme}-button`);
    toDoDiv.appendChild(checked);
    const deleted = document.createElement('button');
    deleted.innerHTML = '<i class="fas fa-trash"></i>';
    deleted.classList.add('delete-btn', `${savedTheme}-button`);
    toDoDiv.appendChild(deleted);
    toDoList.appendChild(toDoDiv);
}

async function addTodoToServer(text) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_TODO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to add todo');
        }
        fetchTodos();
    } catch (error) {
        console.error('Error adding todo:', error);
    }
}

async function toggleTodoCompleted(id, completed) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_TODO_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to update todo');
        }
    } catch (error) {
        console.error('Error updating todo:', error);
    }
}

async function deleteTodoFromServer(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_TODO_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to delete todo');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

function addToDo(event) {
    event.preventDefault();
    if (toDoInput.value === '') {
        alert("You must write something!");
    } else {
        addTodoToServer(toDoInput.value);
        toDoInput.value = '';
    }
}

function deletecheck(event) {
    const item = event.target;
    const todoElement = item.parentElement;
    const todoId = todoElement.dataset.id;
    if (item.classList[0] === 'delete-btn') {
        todoElement.classList.add("fall");
        deleteTodoFromServer(todoId);
        todoElement.addEventListener('transitionend', function() {
            todoElement.remove();
        });
    }
    if (item.classList[0] === 'check-btn') {
        todoElement.classList.toggle("completed");
        const isCompleted = todoElement.classList.contains("completed");
        toggleTodoCompleted(todoId, isCompleted);
    }
}

function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = color;
    document.body.className = color;
    color === 'darker' ? 
        document.getElementById('title').classList.add('darker-title')
        : document.getElementById('title').classList.remove('darker-title');
    document.querySelector('input').className = `${color}-input`;
    document.querySelectorAll('.todo').forEach(todo => {
        Array.from(todo.classList).some(item => item === 'completed') ? 
            todo.className = `todo ${color}-todo completed`
            : todo.className = `todo ${color}-todo`;
    });
    document.querySelectorAll('button').forEach(button => {
        Array.from(button.classList).some(item => {
            if (item === 'check-btn') {
              button.className = `check-btn ${color}-button`;  
            } else if (item === 'delete-btn') {
                button.className = `delete-btn ${color}-button`; 
            } else if (item === 'todo-btn') {
                button.className = `todo-btn ${color}-button`;
            } else if (item === 'logout-btn') {
                button.className = `logout-btn ${color}-button`;
            }
        });
    });
}