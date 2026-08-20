async function test() {
  try {
    const ts = Date.now();
    const email = `test_${ts}@example.com`;
    const username = `user_${ts}`;
    const password = 'password123';
    
    console.log('Registering...');
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status, regData);
    
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status, loginData);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
