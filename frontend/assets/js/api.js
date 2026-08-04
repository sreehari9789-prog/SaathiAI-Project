/* Shared API client for every Saathi page.
   Change API_BASE if the backend runs somewhere other than localhost:4000. */
const API_BASE = 'https://your-render-url-here.onrender.com/api';
  ? 'http://localhost:4000/api'
  : 'http://localhost:4000/api'; // same-origin deployments can swap this for a relative '/api'

const Saathi = {
  TOKEN_KEY: 'saathi_token',
  USER_KEY: 'saathi_user',

  getToken(){ return localStorage.getItem(this.TOKEN_KEY); },
  setSession(token, user){
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },
  getUser(){
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); } catch(e){ return null; }
  },
  clearSession(){
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },
  isLoggedIn(){ return !!this.getToken(); },

  async request(method, path, body){
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new Error('Could not reach the Saathi server. Make sure the backend is running on localhost:4000.');
    }
    let data = {};
    try { data = await res.json(); } catch(e) {}
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  },
  get(path){ return this.request('GET', path); },
  post(path, body){ return this.request('POST', path, body); },

  // ---- auth ----
  async signup(payload){
    const data = await this.post('/auth/signup', payload);
    this.setSession(data.token, data.user);
    return data.user;
  },
  async login(payload){
    const data = await this.post('/auth/login', payload);
    this.setSession(data.token, data.user);
    return data.user;
  },
  logout(){ this.clearSession(); window.location.href = 'login.html'; },

  // require login on protected pages; call at top of page
  requireAuth(){
    if (!this.isLoggedIn()){
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop());
    }
  }
};
