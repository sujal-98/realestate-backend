const nodemailer = require('nodemailer');
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../model/user');
const dotenv = require('dotenv');
dotenv.config();

// Unique token generator
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex'); // 64-character token
}

// Forgot password function
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const token = generateResetToken();
        const expiry = Date.now() + 3600000; // 1 hour from now
        const resetLink = `http://localhost:3001/reset-password/${token}`;
        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.mail,
                pass: process.env.mailPassword
            }
        });

        const mailOptions = {
            to: user.email,
            from: 'aireport2000@gmail.com',
            subject: 'Password Reset',
            text: `You requested a password reset.\n\nClick this link to reset your password:\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Reset link sent to your email.' ,success:true});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.',success:false });
    }
}

// Reset password function
async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        console.log(req.body)
        // Find user by token and check expiry
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully!',success:true});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.',success:false });
    }
}

// Export routes if needed
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
