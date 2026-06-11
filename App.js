const SUPABASE_URL = 'https://udoohspcusdgmdqwppjh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb29oc3BjdXNkZ21kcXdwcGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzAyNTAsImV4cCI6MjA5NjYwNjI1MH0.RNJQm8v-xHp4sF1VCrkBgXeer7Z32MaXA9ZyWVPFVuQ';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById('tripForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  const origin = document.getElementById('origin').value;
  const destination = document.getElementById('destination').value;
  const vehicle = document.getElementById('vehicle').value;
  const fare = parseInt(document.getElementById('fare').value);

  if (origin === destination) {
    alert('Start and end point cannot be the same');
    btn.disabled = false;
    btn.textContent = 'Submit Fare';
    return;
  }

  // Create route key: always alphabetical so Broad→Red and Red→Broad are same route
  const routeKey = [origin, destination].sort().join(' | ');

  const { error } = await _supabase
   .from('trips')
   .insert([{
      origin: origin,
      destination: destination,
      route: routeKey,
      vehicle: vehicle,
      fare: fare
    }]);

  if (error) {
    document.getElementById('result').innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  } else {
    document.getElementById('tripForm').reset();

    // Get average for this route + vehicle
    const { data } = await _supabase
     .from('trips')
     .select('fare')
     .eq('route', routeKey)
     .eq('vehicle', vehicle);

    if (data.length > 0) {
      const avg = Math.round(data.reduce((s, r) => s + r.fare, 0) / data.length);
      const min = Math.min(...data.map(r => r.fare));
      const max = Math.max(...data.map(r => r.fare));

      document.getElementById('result').innerHTML = `
        <b>Thank you!</b><br>
        ${vehicle}: ${origin} → ${destination}<br>
        <b>Average: LRD ${avg}</b><br>
        Range: LRD ${min} - ${max}<br>
        Based on ${data.length} reports
      `;
    } else {
      document.getElementById('result').innerHTML = `<b>Thank you!</b><br>You're the first to report this route!`;
    }
  }

  btn.disabled = false;
  btn.textContent = 'Submit Fare';
});