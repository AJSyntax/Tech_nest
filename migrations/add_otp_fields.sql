-- Add OTP fields to users table
ALTER TABLE users ADD COLUMN otp_code TEXT;
ALTER TABLE users ADD COLUMN otp_expiry INTEGER;
