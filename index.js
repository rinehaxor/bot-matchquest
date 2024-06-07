const axios = require('axios');
const moment = require('moment');
const readlineSync = require('readline-sync');

// URL endpoints
const loginUrl = 'https://tgapp-api.matchain.io/api/tgapp/v1/user/login';
const claimUrl = 'https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/farming';

const getInitialHeaders = () => ({
   Accept: 'application/json, text/plain, */*',
   'Content-Type': 'application/json',
   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
   Origin: 'https://tgapp.matchain.io',
   Referer: 'https://tgapp.matchain.io/',
   'Sec-Ch-Ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24", "Microsoft Edge WebView2";v="125"',
   'Sec-Ch-Ua-Mobile': '?0',
   'Sec-Ch-Ua-Platform': '"Windows"',
   'Sec-Fetch-Dest': 'empty',
   'Sec-Fetch-Mode': 'cors',
   'Sec-Fetch-Site': 'same-site',
});

const getAuthHeaders = (token) => ({
   Accept: 'application/json, text/plain, */*',
   'Content-Type': 'application/json',
   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
   Authorization: `${token}`,
   Origin: 'https://tgapp.matchain.io',
   Referer: 'https://tgapp.matchain.io/',
   'Sec-Ch-Ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24", "Microsoft Edge WebView2";v="125"',
   'Sec-Ch-Ua-Mobile': '?0',
   'Sec-Ch-Ua-Platform': '"Windows"',
   'Sec-Fetch-Dest': 'empty',
   'Sec-Fetch-Mode': 'cors',
   'Sec-Fetch-Site': 'same-site',
});

// Prompt user for input
const first_name = readlineSync.question('Enter first name: ');
const last_name = readlineSync.question('Enter last name: ');
const tg_login_params = readlineSync.question('Enter tg_login_params: ');
const uid = parseInt(readlineSync.question('Enter UID: '), 10);
const username = readlineSync.question('Enter username: ');

// Payload for login
const loginPayload = {
   first_name: first_name,
   last_name: last_name,
   tg_login_params: tg_login_params,
   uid: uid,
   username: username,
};

const claimPayload = {
   uid: uid,
};

let token = '';

async function login() {
   try {
      const response = await axios.post(loginUrl, loginPayload, { headers: getInitialHeaders() });

      if (response.data && response.data.code === 200) {
         token = response.data.data.token;
         console.log(`[ ${moment().format('HH:mm:ss')} ] Token obtained successfully: ${token}`);
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to obtain token.`);
         console.log(response.data);
      }
   } catch (error) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error obtaining token:`, error.message);
      if (error.response) {
         console.error('Error response data:', error.response.data);
      }
   }
}

async function makeClaim() {
   if (!token) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] No token available for making a claim.`);
      return;
   }
   try {
      const headers = getAuthHeaders(token);
      const response = await axios.post(claimUrl, claimPayload, { headers });

      if (response.data && response.data.code === 200) {
         console.log(`[ ${moment().format('HH:mm:ss')} ] Claim successful: ${JSON.stringify(response.data.data)}`);
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to make claim.`);
         console.log(response.data);
      }
   } catch (error) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error making claim:`, error.message);
      if (error.response) {
         console.error('Error response data:', error.response.data);
      }
   }
}

function scheduleTasks() {
   setInterval(async () => {
      await login();
   }, 5 * 60 * 60 * 1000);

   setInterval(async () => {
      await makeClaim();
   }, 300000);
}

(async () => {
   await login();
   scheduleTasks();
})();
