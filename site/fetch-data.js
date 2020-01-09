
function displayLatestDonation() {
  const latestDonationElem = document.querySelector('.recent-donator');
  latestDonationElem.style.opacity = 1;
  setTimeout(() => {
    latestDonationElem.style.opacity = 0;
  }, 5000);
}

function updateData() {
  // from https://stackoverflow.com/a/14428340
  const toMoneyStr = amt => '$' + amt.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  fetch('/.netlify/functions/get-data')
    .then(r => r.json())
    .then(data => {
      const { campaignData, donationData, lastDonation, highestDonation} = data;
      const totalRaised = Number(campaignData.total_raised);
      const goalAmt = Number(campaignData.goal_amt);
      const raisedPercent = Math.min(totalRaised / goalAmt, 1) * 100;
      const lastDonationName = lastDonation.alias || lastDonation.fallbackName || '';
      const lastDonationAmt = Number(lastDonation.amount);
      const lastDonationComment = lastDonation.comment || '';
      const highestDonationName = highestDonation.alias || highestDonation.fallbackName || '';
      const highestDonationAmt = Number(highestDonation.amount);
      const recentDonatorStr = `${lastDonationName} donated ${toMoneyStr(lastDonationAmt)}`;

      const raisedEl = document.querySelector('.raised-box div:nth-child(2)');
      const raisedBarEl = document.querySelector('.raised-bar .bar');
      const goalEl = document.querySelector('.goal-box div:nth-child(2)');
      const lastDonationEl = document.querySelector('.last-donation-box div:nth-child(2)');
      const highestDonationEl = document.querySelector('.highest-donation-box div:nth-child(2)');
      const recentDonatorNameEl = document.querySelector('.recent-donator .donator');
      const recentDonatorCommentEl = document.querySelector('.recent-donator .donation-message');

      raisedEl.innerText = toMoneyStr(totalRaised);
      goalEl.innerText = toMoneyStr(goalAmt);
      raisedBarEl.style.width = raisedPercent + '%';
      lastDonationEl.innerText = lastDonationName + ' ' + toMoneyStr(lastDonationAmt);
      highestDonationEl.innerText = highestDonationName + ' ' + toMoneyStr(highestDonationAmt);
      recentDonatorNameEl.innerText = recentDonatorStr;
      recentDonatorCommentEl.innerText = lastDonationComment;
    });
}

document.body.addEventListener('keydown', (e) => {
  if (e.keyCode === 32 || e.keyCode === 65) {
    displayLatestDonation();
  }
});

updateData()
window.setInterval(updateData, 120 * 1000); // update every 120 seconds
