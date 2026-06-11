let userPhone = '';
let userEmail = '';
let userName = '';

// On index.html: If already logged in, go to Report.html
_supabase.auth.getSession().then(({ data: { session } }) => {
  console.log("INDEX CHECK:", session);
  if (session?.user) {
    window.location.replace('Report.html');
  }
});

document.getElementById('detailsForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Sending magic link...';
  
  userName = document.getElementById('fullName').value.trim();
  userPhone = document.getElementById('phone').value.trim();
  userEmail = document.getElementById('email').value.trim();
  
  const { error } = await _supabase.auth.signInWithOtp({
    email: userEmail,
    options: {
      // FIX: Send user directly to Report.html, not index.html
      emailRedirectTo: 'https://zotry.vercel.app/Report.html',
      shouldCreateUser: true,
      data: { full_name: userName, phone: userPhone }
    }
  });
  
  if (error) {
    alert('Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Continue';
  } else {
    document.getElementById('detailsForm').innerHTML = `
      <div style="text-align:center; padding: 20px;">
        <h3 style="color:#1E88E5;">Check your email!</h3>
        <p>We sent a magic link to <b>${userEmail}</b></p>
      </div>
    `;
  }
};

document.getElementById('backBtn').onclick = () => {
  document.getElementById('otpForm').classList.add('hidden');
  document.getElementById('detailsForm').classList.remove('hidden');
  document.getElementById('detailsForm').querySelector('button').disabled = false;
  document.getElementById('detailsForm').querySelector('button').textContent = 'Continue';
};

document.getElementById('otpForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Verifying...';
  
  const token = document.getElementById('otp').value;
  const { data, error } = await _supabase.auth.verifyOtp({
    email: userEmail,
    token: token,
    type: 'email'
  });
  
  if (error) {
    alert('Wrong code. Try again.');
    btn.disabled = false;
    btn.textContent = 'Verify & Start';
  } else {
    _supabase.from('users').upsert({
      id: data.user.id,
      full_name: userName,
      phone: userPhone,
      email: userEmail
    });
    window.location.replace('Report.html');
  }
};