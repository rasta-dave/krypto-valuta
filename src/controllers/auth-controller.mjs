import UserModel from '../database/models/UserModel.mjs';
import { createSendToken } from '../auth/jwtUtils.mjs';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Please provide username, email and password',
      });
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `User with this ${
          existingUser.email === email ? 'email' : 'username'
        } already exists`,
      });
    }

    const newUser = await UserModel.create({
      username,
      email,
      password,
    });

    createSendToken(newUser, 201, res, 'User registered successfully');
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Please provide email and password',
      });
    }

    const user = await UserModel.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Incorrect email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Your account has been deactivated',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res, 'Logged in successfully');
  } catch (error) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message,
    });
  }
};

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      user: req.user,
    },
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message,
    });
  }
};
