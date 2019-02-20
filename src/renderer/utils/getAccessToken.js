export default function getAccessToken() {
  const https = require('https');
  const qs = require('querystring');
  // const fs = require('fs');

  const param = qs.stringify({
    grant_type: 'client_credentials',
    client_id: 'dKoINK2aSnh9IUmfw9NMlGPw',
    client_secret: '8M3VQuyt0dPPvYsTsCHwLFtIGzOixjeW',
  });
  https.get(
    {
      hostname: 'aip.baidubce.com',
      path: `/oauth/2.0/token?${param}`,
    },
    (res) => {
      let data = '';
      res.on('data', (d) => {
        data += d.toString();
      });
      res.on('end', () => {
        const dataJson = JSON.parse(data);
        const accessToken = dataJson.access_token;
        sessionStorage.setItem('accessToken', accessToken);
      });
    },
  );
}
