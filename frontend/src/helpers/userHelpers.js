// One source of truth for your API base:
const ROOT = (import.meta.env.VITE_API_BASE || 'http://localhost:8080').replace(/\/+$/, '');
const API_BASE = `${ROOT}/api`;

// Small helper to safely join paths (accepts '/users' or 'users'):
const apiUrl = (p = '') => `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;


//Fetches whole user info object
const fetchUserByAuthId = async (authUserId) => {

  if (!authUserId) {
    throw new Error("authUserId is required");
  }

  const res = await fetch(apiUrl(`/users/${authUserId}`));
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch user");

  return data;
};

// Fetch all users
const fetchAllUsers = async () => {
  const res = await fetch(apiUrl('/users'));
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch users");

  return data;
};

// update user info
const patchUserProfile = async(authUserId, updates) => {
  if (!authUserId) throw new Error ("authUserId is required"); 

  const res = await fetch (apiUrl(`/users/${authUserId}`), {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update user");
  }
  return data;
}


export { 
  fetchUserByAuthId, 
  fetchAllUsers,
  patchUserProfile,
}; 