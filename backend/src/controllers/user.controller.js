import { User } from '../models/users.model.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const { hash, compare } = bcrypt;

const createMailTransport = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('Email configuration missing. OTPs will be logged to the server console for local development.');
    return null;
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : false;
  const service = process.env.EMAIL_SERVICE || (host === 'smtp.gmail.com' ? 'gmail' : undefined);

  const transportOptions = {
    auth: { user, pass },
    secure,
    tls: {
      rejectUnauthorized: false,
    },
  };

  if (service) {
    transportOptions.service = service;
  } else {
    transportOptions.host = host;
    transportOptions.port = port;
  }

  return nodemailer.createTransport(transportOptions);
};

const sendOtpEmail = async (to, otp) => {
  const transporter = createMailTransport();

  if (!transporter) {
    console.log(`DEV OTP for ${to}: ${otp}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'MeetSync OTP Verification',
      text: `Your MeetSync verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your MeetSync verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error(`Failed to send OTP email. ${error.message || 'Check Gmail SMTP credentials and security settings.'}`);
  }
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const requestOtp = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser && existingUser.emailVerified) {
      return res.status(409).json({ message: 'Email already registered. Please login.' });
    }

    const otp = generateOtp();
    const otpHash = await hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await hash(password, 10);

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.emailVerified = false;
      existingUser.otpHash = otpHash;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      const newUser = new User({
        name,
        username,
        password: hashedPassword,
        emailVerified: false,
        otpHash,
        otpExpires,
      });
      await newUser.save();
    }

    await sendOtpEmail(username, otp);

    return res.status(200).json({ message: 'OTP sent to your email address. Please enter it to complete registration.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ message: error.message || 'Server error while sending OTP. Please check your email settings.' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Request OTP again.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified. Please login.' });
    }

    if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired or invalid. Request a new OTP.' });
    }

    const isOtpValid = await compare(otp, user.otpHash);
    if (!isOtpValid) {
      return res.status(401).json({ message: 'Invalid OTP. Please try again.' });
    }

    user.emailVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Email verified and registration completed successfully.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Server error while verifying OTP.' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await hash(password, 10);
    const newUser = new User({
      name,
      username,
      password: hashedPassword,
      emailVerified: true,
    });
    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: 'Email not verified. Please verify OTP before logging in.' });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ history: user.history });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addToUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { meetingCode } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.history.push({ meetingCode, date: new Date() });
    await user.save();

    return res.status(200).json({ message: 'Meeting code added to history' });
  } catch (error) {
    console.error('Error adding to user history:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



