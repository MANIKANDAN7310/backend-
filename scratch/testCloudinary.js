import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'octoink',
  api_key: '332843736632742',
  api_secret: 'H8x-qTsT3H2xyyRhNNCFWyRVXuU',
});

cloudinary.api.ping()
  .then(result => console.log('Ping success:', result))
  .catch(err => console.error('Ping error:', err));
