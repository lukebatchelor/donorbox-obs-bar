const https = require('https');

const { donorbox_user, donorbox_key, campaign_id} = process.env;

function getRequest(url) {
  const auth = Buffer.from(`${donorbox_user}:${donorbox_key}`).toString('base64');
  const options = {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  };

  return new Promise((resolve, reject) => {
    let data = '';
    const req = https.get(url, options, resp => {
      resp.on('data', chunk => (data += chunk));
      resp.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', err => reject(err));
  });
}

exports.handler = async function(event, context) {
  const apiBaseUrl = 'https://donorbox.org/api/v1/donations';
  const resp = await getRequest(apiBaseUrl);

  return {
    statusCode: 200,
    body: JSON.stringify(resp)
  }


}
