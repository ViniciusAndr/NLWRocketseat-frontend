import axios from 'axios';

const api = axios.create({
    baseURL: 'https://nlw-ecoleta.herokuapp.com'
});

export default api;