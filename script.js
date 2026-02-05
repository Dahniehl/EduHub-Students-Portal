// supabase.js
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

const supabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

//Create Account Page
const form = document.getElementById("createAccountForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Account created successfully. Please check your email.");
    window.location.href = "index.html";
  }
});

//Login Page
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Invalid email or password");
  } else {
    alert("Login successful");
    window.location.href = "dashboard.html";
  }
});

//Header
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    document.getElementById("userName").textContent =
      data.user.email.split("@")[0];

    document.getElementById("userEmail").textContent =
      data.user.email;
  }
});

//Dropdown section (Global)
function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  menu.classList.toggle("show");
}

//logot section
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

//Content section (SAFE)
(function () {
  let box1 = document.getElementById("box1");
  let box2 = document.getElementById("box2");

  box1.textContent = "Section One";
  box2.textContent = "Section Two";
})();