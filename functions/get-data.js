const https = require('https');

const { donorbox_user, donorbox_key, campaign_id, default_pages_to_fetch } = process.env;

const apiBaseUrl = 'https://donorbox.org/api/v1';

// Creating our own getRequest function so we don't need to import anything except default
// node `https`
function getRequest(url, extraParams = '') {
  const auth = Buffer.from(`${donorbox_user}:${donorbox_key}`).toString('base64');
  const options = {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  };
  const queryParams = `?campaign_id=${campaign_id}&per_page=100&order=desc` + extraParams;

  return new Promise((resolve, reject) => {
    let data = '';
    const req = https.get(url + queryParams, options, resp => {
      resp.on('data', chunk => (data += chunk));
      resp.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', err => reject(err));
  });
}

async function getCampaignData() {
  const url = apiBaseUrl + '/campaigns';
  const resp = await getRequest(url);
  const campaign = resp.find(c => `${c.id}` === campaign_id);

  return campaign;
}


async function getDonationData() {
  const initialPages = Number(default_pages_to_fetch);
  const promises = [];
  const url = apiBaseUrl + '/donations';

  // Create an array of promises for all the pages so we can run all the requests in parallel
  for (let i = 1; i <= initialPages; i++) {
    const promise = getRequest(url, `&page=${i}`).then(donations => {
      // Strip out all the sensitive info we don't need
      return donations.map(donation => {
        const cleanedData = {
          designation: donation.designation,
          comment: donation.comment,
          fallbackName: donation.donor.first_name,
          amount: Number(donation.amount)
        }
        if (donation.questions[0]) {
          cleanedData.alias = donation.questions[0].answer
        }
        return cleanedData
      })
    })
    promises.push(promise);
  }

  const allData = await Promise.all(promises);
  // todo: check that all the data is here and we don't need to fetch more

  return allData.flat();
}

exports.handler = async function(event, context) {
  const [campaignData, donationData ] = await Promise.all([getCampaignData(), getDonationData()]);
  const lastDonation = donationData[0];
  const highestDonation = donationData.reduce((prev, cur) => cur.amount > prev.amount ? cur : prev, { amount: 0 });

  return {
    statusCode: 200,
    body: JSON.stringify({ campaignData, donationData, lastDonation, highestDonation })
  }
}
