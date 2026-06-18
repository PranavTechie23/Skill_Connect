async function run() {
  const res = await fetch('http://localhost:5002/api/debug/admin-jobs');
  const data = await res.json();
  console.log("Total Jobs:", data.totalJobs);
  console.log("Total Apps:", data.totalApplications);
  console.log("Sample enrichedJobs:", JSON.stringify(data.sample, null, 2));
}
run();
