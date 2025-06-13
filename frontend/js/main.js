document.getElementById('accountForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const occupation = document.getElementById('occupation').value;

  try {
    const response = await fetch('http://localhost:3000/api/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, occupation })
    });

    const data = await response.json();
    const result = document.getElementById('result');
    result.textContent = data.message || data.error || JSON.stringify(data);

  } catch (err) {
    console.error(err);
    document.getElementById('result').innerText = 'Error creating account.';
  }
});
