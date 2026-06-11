const SUPABASE_URL = 'https://udoohspcusdgmdqwppjh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb29oc3BjdXNkZ21kcXdwcGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzAyNTAsImV4cCI6MjA5NjYwNjI1MH0.RNJQm8v-xHp4sF1VCrkBgXeer7Z32MaXA9ZyWVPFVuQ';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
});

let userPhone = '';
let userEmail = '';
let userName = '';

// 1. Handle redirect via onAuthStateChange
_supabase.auth.onAuthStateChange((event, session) => {
  console.log("AUTH EVENT:", event, session);
  
  // FIX: Check for session.user specifically, not just session
  if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
    console.log("Session found, redirecting now...");
    
    _supabase.from('users').upsert({
      id: session.user.id,
      full_name: session.user.user_metadata.full_name || userName,
      phone: session.user.user_metadata.phone || userPhone,
      email: session.user.email
    });
    
    window.location.replace('Report.html');
  }
});

// 2. ALSO check on page load after Supabase parses the URL
// This catches cases where onAuthStateChange fires with null first
document.addEventListener('DOMContentLoaded', async () => {
  // Give Supabase 300ms to parse #access_token from URL
  await new Promise(r => setTimeout(r, 300));
  
  const { data: { session } } = await _supabase.auth.getSession();
  console.log("MANUAL SESSION CHECK:", session);
  
  if (session?.user) {
    console.log("Manual check found session, redirecting...");
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
      emailRedirectTo: 'https://zotry.vercel.app',
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