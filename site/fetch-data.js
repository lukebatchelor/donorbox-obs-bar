
function displayLatestDonation() {
  const latestDonationElem = document.querySelector('.recent-donator');
  latestDonationElem.style.opacity = 1;
  setInterval(() => {
    latestDonationElem.style.opacity = 0.01;
  }, 5000);
}

function fetchData() {

}

document.body.addEventListener('keydown', (e) => {
  if (e.keyCode === 32 || e.keyCode === 65) {
    displayLatestDonation();
  }
})

fetch('/.netlify/functions/get-data').then(r => r.json()).then(r => {
  console.log(r)
})
