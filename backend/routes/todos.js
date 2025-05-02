const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const { protect } = require('../middleware/auth'); // Import the auth middleware

// Apply the auth middleware to all routes
router.use(protect);

// Get all todos for the current user
router.get('/', async (req, res) => {
    try {
        // Only return todos that belong to the current user
        const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a todo
router.post('/', async (req, res) => {
    const todo = new Todo({
        text: req.body.text,
        user: req.user._id // Associate the todo with the current user
    });

    try {
        const newTodo = await todo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a todo (toggle completed)
router.patch('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        
        // Check if todo exists
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        
        // Check if the todo belongs to the current user
        if (todo.user && todo.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this todo' });
        }
        
        // Update fields
        if (req.body.completed !== undefined) {
            todo.completed = req.body.completed;
        }
        if (req.body.text !== undefined) {
            todo.text = req.body.text;
        }
        
        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        
        // Check if todo exists
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        
        // Check if the todo belongs to the current user
        if (todo.user && todo.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this todo' });
        }
        
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;