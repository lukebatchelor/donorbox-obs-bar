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
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          console.error('err', err)
          reject({data, err});
        }
      });
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

async function getRecentDonations(totalDonations) {
  const url = apiBaseUrl + '/donations';
  const donations = await getRequest(url);

  return donations.map(getCleanedDonationInfo);
}


async function getLargestDonation(totalDonations) {
  const pagesToFetch = Math.ceil(totalDonations / 100)
  const promises = [];
  const url = apiBaseUrl + '/donations';

  // Create an array of promises for all the pages so we can run all the requests in parallel
  for (let i = 1; i <= pagesToFetch; i++) {
    const promise = getRequest(url, `&page=${i}`).then(donations => {
      // Strip out all the sensitive info we don't need
      return donations.map(getCleanedDonationInfo);
    })
    promises.push(promise);
  }

  const allData = await Promise.all(promises);

  // Return the largest donation only
  return allData.flat()
    .reduce((prev, cur) => cur.amount > prev.amount ? cur : prev, { amount: 0 });
}

// Transform a full donation object into just the important bits
function getCleanedDonationInfo(donation) {
  const cleanedData = {
    designation: donation.designation,
    comment: donation.comment,
    fallbackName: donation.donor.first_name,
    amount: Number(donation.amount)
  }
  if (donation.questions[0]) {
    cleanedData.alias = donation.questions[0].answer;
  }
  return cleanedData;
}

exports.handler = async function(event, context) {
  const { queryStringParameters } = event;
  const shouldGetLargest = !!queryStringParameters.get_largest;

  try {
    if (shouldGetLargest) {
      const totalDonations = Number(queryStringParameters.total_donations || 100); // default to 100
      console.log(`Requesting highest donations, donations=${totalDonations}`);
      const highestDonation = await getLargestDonation(totalDonations);

      return { statusCode: 200, body: JSON.stringify({ highestDonation }) };
    }

    console.log('Requesting recent donations');
    const [campaignData, donationData ] = await Promise.all([getCampaignData(), getRecentDonations()]);
    const lastDonation = donationData[0];

    return {
      statusCode: 200,
      body: JSON.stringify({ campaignData, donationData, lastDonation })
    }
  } catch (err) {
    console.error('Error', err);

    return { statusCode: 500, body: JSON.stringify(err) };
  }
}
