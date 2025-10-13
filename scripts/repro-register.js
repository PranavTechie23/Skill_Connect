(async () => {
  try {
    const res = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'repro3@test.local',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        firstName: 'Rep3',
        lastName: 'Tester3',
        userType: 'Professional',
        title: 'Dev',
        skills: [],
        location: 'Here'
      }),
    });
    console.log('status', res.status);
    try { console.log(await res.json()); } catch(e) { console.error('no json'); }
  } catch (err) {
    console.error('request failed', err);
  }
})();