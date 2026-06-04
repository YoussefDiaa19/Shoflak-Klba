async function run() {
  try {
    const res = await fetch('https://ais-pre-ccad7mpgq7vqasiqr54t54-105564735267.europe-west2.run.app/api/health');
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
}
run();
