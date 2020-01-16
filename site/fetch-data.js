const urlParams = new URLSearchParams(window.location.search);
const noPopupsParam = urlParams.has('no_popups');  // don't show donation popups
const campaignIdParam = urlParams.get('campaign_id') || '140282';  // custom campaign_id, or default to BushFires 2020

// Store this globally so we can send it when fetching highest donation
let totalDonations = 0;
let previousDisplayedDonationName = ''; // to check if we've displayed a name already

// from https://stackoverflow.com/a/14428340
const toMoneyStr = amt => '$' + amt.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

function updateDonationData() {
  return fetch(`/.netlify/functions/get-data?campaign_id=${campaignIdParam}`)
    .then(r => r.json())
    .then(data => {
      const { campaignData, donationData, lastDonation} = data;
      const totalRaised = Number(campaignData.total_raised);
      const goalAmt = Number(campaignData.goal_amt);
      const raisedPercent = Math.min(totalRaised / goalAmt, 1) * 100;
      const lastDonationName = lastDonation.alias || lastDonation.fallbackName || '';
      const lastDonationAmt = Number(lastDonation.amount);
      const lastDonationComment = lastDonation.comment || '';
      // update the global var
      totalDonations = campaignData.donations_count;

      const recentDonatorStr = `${lastDonationName} donated ${toMoneyStr(lastDonationAmt)}`;

      const raisedEl = document.querySelector('.raised-box div:nth-child(2)');
      const raisedBarEl = document.querySelector('.raised-bar .bar');
      const goalEl = document.querySelector('.goal-box div:nth-child(2)');
      const lastDonationEl = document.querySelector('.last-donation-box div:nth-child(2)');

      const recentDonatorNameEl = document.querySelector('.recent-donator .donator');
      const recentDonatorCommentEl = document.querySelector('.recent-donator .donation-message');

      raisedEl.innerText = toMoneyStr(totalRaised);
      goalEl.innerText = toMoneyStr(goalAmt);
      raisedBarEl.style.width = raisedPercent + '%';
      lastDonationEl.innerText = lastDonationName + ' ' + toMoneyStr(lastDonationAmt);
      recentDonatorNameEl.innerText = recentDonatorStr;
      recentDonatorCommentEl.innerText = lastDonationComment;

      if (!noPopupsParam && lastDonationName !== previousDisplayedDonationName) {
        // Don't display popop if this is the first time we've fetched data
        if (previousDisplayedDonationName !== '') {
          displayLatestDonation();
        }
        previousDisplayedDonationName = lastDonationName;
      }
    });
}

function updateHighestDonationData() {
  fetch(`/.netlify/functions/get-data?get_largest=true&total_donations=${totalDonations}&campaign_id=${campaignIdParam}`)
    .then(r => r.json())
    .then(data => {
      const { highestDonation } = data;
      const highestDonationName = highestDonation.alias || highestDonation.fallbackName || '';
      const highestDonationAmt = Number(highestDonation.amount);
      const highestDonationEl = document.querySelector('.highest-donation-box div:nth-child(2)');
      highestDonationEl.innerText = highestDonationName + ' ' + toMoneyStr(highestDonationAmt);
    });
}

function displayLatestDonation() {
  const latestDonationElem = document.querySelector('.recent-donator');
  latestDonationElem.style.opacity = 1;
  setTimeout(() => {
    latestDonationElem.style.opacity = 0;
  }, 5000);
}

// Just for debugging, can hit space to display latest donation
document.body.addEventListener('keydown', (e) => {
  // Strangely the space key from within OBS is sending the wrong keycode?
  if (e.keyCode === 32 || e.keyCode === 65) {
    displayLatestDonation();
  }
});

// Get initial data (has side effect of setting totalDonations) then fetch highest donations
updateDonationData().then(updateHighestDonationData);

window.setInterval(updateDonationData, 2 * 60 * 1000); // update every 2 mins
window.setInterval(updateHighestDonationData, 10 * 60 * 1000); // refetch highest donator less often as it is more requests
