// Don't create a new client - use the shared _supabase from Supabase.js

document.getElementById('checkForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Loading...';
  
  const origin = document.getElementById('checkOrigin').value;
  const destination = document.getElementById('checkDestination').value;
  const vehicle = document.getElementById('checkVehicle').value;
  
  if (origin === destination) {
    alert('Start and end point cannot be the same');
    btn.disabled = false;
    btn.textContent = 'Check Current Fares';
    return;
  }
  
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<div class="card">Loading fares...</div>';
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  let query = _supabase
    .from('trips')
    .select('vehicle, fare, created_at')
    .or(`and(origin.eq.${origin},destination.eq.${destination}),and(origin.eq.${destination},destination.eq.${origin})`)
    .gte('created_at', sevenDaysAgo);
  
  if (vehicle !== 'All') {
    query = query.eq('vehicle', vehicle);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    resultsDiv.innerHTML = `<div class="card" style="color:red;">Error: ${error.message}</div>`;
  } else if (!data || data.length === 0) {
    const vehicleText = vehicle === 'All' ? '' : ` for ${vehicle}`;
    resultsDiv.innerHTML = `
      <div class="card">
        <b>No recent reports</b><br>
        No one has reported fares${vehicleText} for ${origin} → ${destination} in the last 7 days.<br>
        <a href="Report.html">Be the first to report</a>
      </div>`;
  } else {
    let html = `<div class="card"><h3>${origin} → ${destination}</h3>`;
    
    if (vehicle === 'All') {
      const vehicles = ['Keke', 'Taxi', 'Bus'];
      vehicles.forEach(v => {
        const vehicleData = data.filter(d => d.vehicle === v);
        if (vehicleData.length > 0) {
          const avg = Math.round(vehicleData.reduce((s, r) => s + r.fare, 0) / vehicleData.length);
          const min = Math.min(...vehicleData.map(r => r.fare));
          const max = Math.max(...vehicleData.map(r => r.fare));
          const lastUpdate = new Date(vehicleData[0].created_at).toLocaleString('en-LR', { 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
          });
          html += `
            <div class="fare-box">
              <h3>${v}</h3>
              <b>Average: LRD ${avg}</b><br>
              Range: LRD ${min} - ${max}<br>
              <span class="meta">${vehicleData.length} reports | Updated ${lastUpdate}</span>
            </div>`;
        }
      });
    } else {
      const avg = Math.round(data.reduce((s, r) => s + r.fare, 0) / data.length);
      const min = Math.min(...data.map(r => r.fare));
      const max = Math.max(...data.map(r => r.fare));
      const lastUpdate = new Date(data[0].created_at).toLocaleString('en-LR', { 
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
      });
      html += `
        <div class="fare-box">
          <h3>${vehicle}</h3>
          <b>Average: LRD ${avg}</b><br>
          Range: LRD ${min} - ${max}<br>
          <span class="meta">${data.length} reports | Updated ${lastUpdate}</span>
        </div>`;
    }
    html += '</div>';
    resultsDiv.innerHTML = html;
  }
  
  btn.disabled = false;
  btn.textContent = 'Check Current Fares';
});