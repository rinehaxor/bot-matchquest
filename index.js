const axios = require('axios');
const moment = require('moment');
const fs = require('fs');

// URL endpoints
const loginUrl = 'https://tgapp-api.matchain.io/api/tgapp/v1/user/login';
const startFarmingUrl = 'https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/farming';
const rewardClaimUrl = 'https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/claim';

// Headers without authorization (for initial login)
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

// Read accounts from a text file
const accounts = fs
   .readFileSync('accounts.txt', 'utf-8')
   .trim()
   .split('\n')
   .map((line) => {
      const [first_name, last_name, tg_login_params, uid, username] = line.split(',');
      return { first_name, last_name, tg_login_params, uid: parseInt(uid, 10), username };
   });

const tokens = {};

// Function to login and get token
async function login(account) {
   const loginPayload = {
      first_name: account.first_name,
      last_name: account.last_name,
      tg_login_params: account.tg_login_params,
      uid: account.uid,
      username: account.username,
   };

   try {
      const response = await axios.post(loginUrl, loginPayload, { headers: getInitialHeaders() });

      if (response.data && response.data.code === 200) {
         tokens[account.username] = response.data.data.token;
         console.log(`[ ${moment().format('HH:mm:ss')} ] Token obtained successfully for ${account.username}: ${tokens[account.username]}`);
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to obtain token for ${account.username}.`);
         console.log(response.data);
      }
   } catch (error) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error obtaining token for ${account.username}:`, error.message);
      if (error.response) {
         console.error('Error response data:', error.response.data);
      }
   }
}

// Function to make a claim
async function makeClaim(account, claimUrl) {
   const token = tokens[account.username];
   if (!token) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] No token available for making a claim for ${account.username}.`);
      return;
   }

   const claimPayload = {
      uid: account.uid,
   };

   try {
      const headers = getAuthHeaders(token);
      const response = await axios.post(claimUrl, claimPayload, { headers });

      if (response.data && response.data.code === 200) {
         console.log(`[ ${moment().format('HH:mm:ss')} ] Claim successful for ${account.username}: ${JSON.stringify(response.data.data)}`);
      } else {
         console.error(`[ ${moment().format('HH:mm:ss')} ] Failed to make claim for ${account.username}.`);
         console.log(response.data);
      }
   } catch (error) {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error making claim for ${account.username}:`, error.message);
      if (error.response) {
         console.error('Error response data:', error.response.data);
      }
   }
}

// Function to schedule login and claim with delay
async function scheduleTasks(account, delay) {
   await new Promise((resolve) => setTimeout(resolve, delay));

   // Login every 5 hours
   setInterval(async () => {
      await login(account);
   }, 5 * 60 * 60 * 1000);

   setInterval(async () => {
      await makeClaim(account, startFarmingUrl);
   }, 3 * 60 * 1000);

   setInterval(async () => {
      await makeClaim(account, rewardClaimUrl);
   }, 4.2 * 60 * 1000);

   // Initial login
   await login(account);
}

accounts.forEach(async (account, index) => {
   const delay = index * 10 * 1000;
   await scheduleTasks(account, delay);
});
