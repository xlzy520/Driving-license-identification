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
      // 在标准输出中查看运行结果
      // res.pipe(process.stdout);
      res.on('data', (d) => {
        const data = d.toString();
        const dataJson = JSON.parse(data);
        const accessToken = dataJson.accsee_token;
        sessionStorage.setItem('accessToken', accessToken);
        // fs.writeFile('./a.json', d, (err) => {
        //   if (err) {
        //     throw err;
        //   }
        // });
      });
    },
  );
}
