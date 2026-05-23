import { User } from '../models/users.model.js';
import  bcrypt from 'bcrypt';
const { hash, compare } = bcrypt;
import crypto from 'crypto';


const register = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Validate input
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    // Create new user
    const newUser = new User({ 
        name: name,
        username: username,
        password: hashedPassword
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) { 
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }

};

const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ history: user.history });
  }
  catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addToUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { meetingCode } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.history.push({ meetingCode, date: new Date() });
    await user.save();
    res.status(200).json({ message: 'Meeting code added to history' });
  }
  catch (error) {
    console.error('Error adding to user history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { register, login, getUserHistory, addToUserHistory };
