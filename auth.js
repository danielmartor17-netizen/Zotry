const SUPABASE_URL = 'https://udoohspcusdgmdqwppjh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb29oc3BjdXNkZ21kcXdwcGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzAyNTAsImV4cCI6MjA5NjYwNjI1MH0.RNJQm8v-xHp4sF1VCrkBgXeer7Z32MaXA9ZyWVPFVuQ';

// FIX 1: Added detectSessionInUrl to read magic link token
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true
  }
});

let userPhone = '';
let userEmail = '';
let userName = '';

// FIX 2: Only redirect on actual SIGNED_IN event, not INITIAL_SESSION
_supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("AUTH EVENT:", event);
  
  // Only act when user actually signs in via magic link
  if (event === 'SIGNED_IN' && session) {
    console.log("Saving user and redirecting...");
    await _supabase.from('users').upsert({
      id: session.user.id,
      full_name: session.user.user_metadata.full_name || userName,
      phone: session.user.user_metadata.phone || userPhone,
      email: session.user.email
    });
    window.location.replace('Report.html'); // replace prevents back button loop
  }
});

// FIX 3: Check session once on load, after Supabase parses URL
window.addEventListener('load', async () => {
  // Small delay to let detectSessionInUrl finish
  setTimeout(async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    console.log("SESSION AFTER LOAD:", session);
    if (session) {
      window.location.replace('Report.html');
    }
  }, 500);
});

document.getElementById('detailsForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Sending magic link...';
  
  userName = document.getElementById('fullName').value.trim();
  userPhone = document.getElementById('phone').value.trim();
  userEmail = document.getElementById('email').value.trim();
  
  console.log("Sending magic link to:", userEmail);
  const { error } = await _supabase.auth.signInWithOtp({
    email: userEmail,
    options: {
      emailRedirectTo: 'https://zotry.vercel.app', // removed trailing / to match Supabase
      shouldCreateUser: true,
      data: { full_name: userName, phone: userPhone }
    }
  });
  
  console.log("Magic link response:", error);
  if (error) {
    alert('Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Continue';
  } else {
    document.getElementById('detailsForm').innerHTML = `
      <div style="text-align:center; padding: 20px;">
        <h3 style="color:#1E88E5;">Check your email!</h3>
        <p>We sent a magic link to <b>${userEmail}</b></p>
        <p style="font-size:14px; color:#666;">Tap the link in your email to login instantly.</p>
        <button onclick="location.reload()" class="secondary">Send again</button>
      </div>
    `;
  }
};

// Keep OTP stuff in case you want it later, but we don't use it now
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
    await _supabase.from('users').upsert({
      id: data.user.id,
      full_name: userName,
      phone: userPhone,
      email: userEmail
    });
    window.location.replace('Report.html');
  }
};