// Test script to check if our fix for the deserialization issue works
import passport from 'passport';

// Mock user for testing
const mockUser = {
  id: 1,
  username: 'test',
  email: 'test@example.com',
  password: 'password',
  role: 'user'
};

// Test serialization
console.log('Testing serialization...');
passport.serializeUser((user, done) => {
  console.log(`Serializing user: ${user.username} (ID: ${user.id})`);
  done(null, user.id);
});

// Test deserialization with our fix
console.log('Testing deserialization...');
passport.deserializeUser(async (id, done) => {
  try {
    console.log(`Deserializing user with ID: ${id}`);
    // Simulate user not found
    const user = null;

    if (!user) {
      console.error(`User with ID ${id} not found during deserialization`);
      return done(null, false);
    }

    console.log(`User deserialized successfully: ${user.username}`);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error);
  }
});

// Test serialization
passport.serializeUser(mockUser, (err, id) => {
  if (err) {
    console.error('Serialization error:', err);
  } else {
    console.log('Serialized user ID:', id);

    // Test deserialization with the serialized ID
    passport.deserializeUser(id, (err, user) => {
      if (err) {
        console.error('Deserialization error:', err);
      } else if (user === false) {
        console.log('User not found during deserialization, but handled gracefully');
      } else {
        console.log('Deserialized user:', user);
      }
    });
  }
});

console.log('Test completed');
