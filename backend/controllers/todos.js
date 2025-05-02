const Todo = require('../models/Todo');

// @desc    Get all todos for current user
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = async (req, res) => {
  try {
    const todo = new Todo({
      text: req.body.text,
      user: req.user._id
    });

    const newTodo = await todo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a todo
// @route   PATCH /api/todos/:id
// @access  Private
exports.updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    // Check if todo exists
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Check if user owns the todo
    if (todo.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this todo' });
    }
    
    // Update fields
    if (req.body.text !== undefined) {
      todo.text = req.body.text;
    }
    if (req.body.completed !== undefined) {
      todo.completed = req.body.completed;
    }
    
    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    // Check if todo exists
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Check if user owns the todo
    if (todo.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this todo' });
    }
    
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};