(async function(){
  for(let i=0;i<20;i++){
    try{
      const h = await fetch('http://127.0.0.1:5001/health');
      console.log('health',h.status);
      break;
    }catch(e){
      console.log('waiting for server...');
      await new Promise(r=>setTimeout(r,500));
    }
  }
  try{
    const res = await fetch('http://127.0.0.1:5001/api/auth/register',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email:'finalnet@test.local',password:'testpass123',confirmPassword:'testpass123',firstName:'Network',lastName:'Tester',userType:'Professional',title:'Dev',skills:[],location:'Here'})
    });
    console.log('post status',res.status);
    try{console.log(await res.json())}catch(e){console.log('no json');}
  }catch(e){console.error('post failed',e)}
})();