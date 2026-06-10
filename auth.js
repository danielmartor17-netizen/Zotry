const SUPABASE_URL = 'https://udoohspcusdgmdqwppjh.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_y1WjTA6d7jg2jZDwLw-t5A_f7vzqSZi'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

let userPhone = ''; 
let userEmail = ''; 
let userName = ''; 

// Handle magic link + check existing session 
_supabase.auth.onAuthStateChange((event, session) => { 
  if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) { 
    window.location.href = 'Report.html'; 
  } 
}); 

// Also check on page load for existing session 
_supabase.auth.getSession().then(({ data: { session } }) => { 
  if (session) window.location.href = 'Report.html'; 
}); 

document.getElementById('detailsForm').onsubmit = async (e) => { 
  e.preventDefault(); 
  const btn = e.target.querySelector('button'); 
  btn.disabled = true; 
  btn.textContent = 'Sending magic link...'; // Changed text
  userName = document.getElementById('fullName').value.trim(); 
  userPhone = document.getElementById('phone').value.trim(); 
  userEmail = document.getElementById('email').value.trim(); 
  
  // NOW SENDS MAGIC LINK INSTEAD OF OTP
  const { error } = await _supabase.auth.signInWithOtp({ 
    email: userEmail, 
    options: { 
      emailRedirectTo: 'https://zotry.vercel.app', // KEY LINE
      shouldCreateUser: true, 
      data: { full_name: userName, phone: userPhone } 
    } 
  }); 
  
  if (error) { 
    alert('Error: ' + error.message); 
    btn.disabled = false; 
    btn.textContent = 'Continue'; 
  } else { 
    alert('Magic link sent! Check your email and tap the link to login.');
    btn.disabled = false; 
    btn.textContent = 'Continue'; 
  } 
}; 

// You can delete the OTP form stuff below since we're using magic links now
// But I'll keep it so nothing breaks
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
    window.location.href = 'Report.html'; 
  } 
};