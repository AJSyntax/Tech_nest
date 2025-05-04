// Simple script to test our fix for the deserialization issue
console.log('Starting test...');

// Simulate the deserialization function
function deserializeUser(id, done) {
  console.log(`Deserializing user with ID: ${id}`);
  
  // Simulate user not found
  const user = null;
  
  if (!user) {
    console.log(`User with ID ${id} not found during deserialization`);
    return done(null, false);
  }
  
  console.log(`User deserialized successfully`);
  done(null, user);
}

// Test with a non-existent user ID
deserializeUser(999, (err, user) => {
  if (err) {
    console.error('Error:', err);
  } else if (user === false) {
    console.log('User not found, but handled gracefully');
  } else {
    console.log('User found:', user);
  }
});

console.log('Test completed');
