// ── Existing Carousel and About Modal Code (Project 1) ─────────────────────
lucide.createIcons();
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dotsContainer = document.querySelector('.carousel-dots');

slides.forEach((_, index) => {
  const dot = document.createElement('button');
  dot.classList.add('carousel-dot');
  if (index === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(index));
  dotsContainer.appendChild(dot);
});
const dots = document.querySelectorAll('.carousel-dot');

// Add this after your existing carousel code
// Remove or comment out the previous animation code (lines 19-52)
// const titleMessages = ["Modern Learning Space"];
// const subtitleMessages = ["Where tradition meets technology"];

// Animation settings
const typeDelay = 100;
const deleteDelay = 80;
const pauseDelay = 2000;

function typeText(element, text, callback) {
  let index = 0;
  
  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, typeDelay);
    } else if (callback) {
      setTimeout(callback, pauseDelay);
    }
  }
  
  type();
}

function animateCarouselText() {
  const titleElement = document.getElementById('animatedTitle');
  const subtitleElement = document.getElementById('animatedSubtitle');
  
  if (!titleElement || !subtitleElement) return;
  
  // Clear any existing text
  titleElement.textContent = '';
  subtitleElement.textContent = '';
  
  // Animate title first, then subtitle
  typeText(titleElement, titleMessages[0], () => {
    typeText(subtitleElement, subtitleMessages[0]);
  });
}

// Add this to your existing goToSlide function
function goToSlide(index) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  
  // Start animation if it's the third slide
  if (currentSlide === 2) {
    animateCarouselText();
  }
}

function nextSlide() {
  goToSlide((currentSlide + 1) % slides.length);
}
setInterval(nextSlide, 4000);

function openAboutModal() {
  const aboutModal = document.getElementById('aboutModal');
  aboutModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
  const aboutModal = document.getElementById('aboutModal');
  aboutModal.classList.remove('open');
  document.body.style.overflow = '';
}

// ── New Authentication Code ───────────────────────────────────────────────
let selectedUserType = ''; // 'student' or 'admin'

// When Login is clicked, show user type selection modal
function showLoginModal() {
  document.getElementById('userTypeModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// When Sign Up is clicked from header, open signup modal directly (student only)
function showSignupModalDirectly() {
  selectedUserType = 'student';
  document.getElementById('signupModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Called when a user type is selected in the user type modal (for login)
function selectUserType(type) {
  selectedUserType = type;
  closeModal('userTypeModal');
  document.getElementById('loginModal').style.display = 'block';
  // Show student-only extras if role is student
  if (selectedUserType === 'student') {
    document.getElementById('studentExtras').style.display = 'block';
  } else {
    document.getElementById('studentExtras').style.display = 'none';
  }
}

// Toggle between login and signup modals
function switchToSignup() {
  closeModal('loginModal');
  selectedUserType = 'student';
  document.getElementById('signupModal').style.display = 'block';
}

function switchToLogin() {
  closeModal('signupModal');
  document.getElementById('userTypeModal').style.display = 'block';
}

// Generic function to close a modal by ID
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Handle Login Form Submission
function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById('loginForm'));
  const email = formData.get('email');
  const password = formData.get('password');

  const url = 'http://localhost:3000/login';
  const payload = { email, password, role: selectedUserType };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      const alertEl = document.querySelector('.login-alert');
      if (data.success) {
        alertEl.innerText = 'Login success';
        alertEl.classList.remove('error');
        alertEl.classList.add('success');
        setTimeout(() => {
          if (selectedUserType === 'admin') {
            window.location.href = '/admin/dashboard.html';
          } else {
            window.location.href = '/student/dashboard.html';
          }
        }, 1000);
      } else {
        // When credentials are incorrect or account does not exist
        // You might get messages like "Invalid credentials" or "No account exists"
        alertEl.innerText = data.message || 'Incorrect credentials';
        alertEl.classList.remove('success');
        alertEl.classList.add('error');
        setTimeout(() => {
          alertEl.innerText = '';
          alertEl.classList.remove('error');
        }, 1000);
      }
    })
    .catch(err => {
      console.error('Login error:', err);
      const alertEl = document.querySelector('.login-alert');
      alertEl.innerText = 'An error occurred. Please try again.';
      alertEl.classList.remove('success');
      alertEl.classList.add('error');
      setTimeout(() => {
        alertEl.innerText = '';
        alertEl.classList.remove('error');
      }, 1000);
    });
}


// Handle Signup Form Submission (student only)
function handleSignup(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById('signupForm'));
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');

  const url = 'http://localhost:3000/signup';
  const payload = { name, email, password };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Add this line
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      const alertEl = document.querySelector(".signup-alert");
      if (data.success) {
        alertEl.innerText = 'Account created successfully! Please login.';
        alertEl.classList.remove('error');
        alertEl.classList.add('success');
        // After 1 second, clear the message and switch modals
        setTimeout(() => {
          alertEl.innerText = '';
          alertEl.classList.remove('success');
          closeModal('signupModal');
          showLoginModal();
        }, 1000);
      } else {
        // When there's an error (e.g., account already exists)
        alertEl.innerText = data.message || 'Signup failed';
        alertEl.classList.remove('success');
        alertEl.classList.add('error');
        // Clear the alert message after 1 second
        setTimeout(() => {
          alertEl.innerText = '';
          alertEl.classList.remove('error');
        }, 1000);
      }
    })
    .catch(err => {
      console.error('Signup error:', err);
      const alertEl = document.querySelector(".signup-alert");
      alertEl.innerText = 'An error occurred. Please try again.';
      alertEl.classList.remove('success');
      alertEl.classList.add('error');
      setTimeout(() => {
        alertEl.innerText = '';
        alertEl.classList.remove('error');
      }, 1000);
    });
}
// Add this new function for direct Google login
function directGoogleLogin() {
  // Show loading state
  const loginAlert = document.querySelector('.login-alert');
  loginAlert.textContent = 'Connecting to Google...';
  loginAlert.className = 'login-alert info';
  
  // Redirect to the server's Google auth endpoint
  window.location.href = '/auth/google';
}
// Dummy Google Login Functionality (student only)
function handleGoogleLogin() {
  // Show loading state
  const loginAlert = document.querySelector('.login-alert');
  loginAlert.textContent = 'Connecting to Google...';
  loginAlert.className = 'login-alert info';

  // Make sure the Google API is loaded
  if (typeof google === 'undefined' || !google.accounts) {
    console.error('Google API not loaded');
    loginAlert.textContent = 'Error: Google authentication service not available';
    loginAlert.className = 'login-alert error';
    return;
  }

  // Clear any existing buttons first
  const buttonContainer = document.getElementById('googleSignInButton');
  if (buttonContainer) {
    buttonContainer.innerHTML = '';
  }

  // Initialize Google Sign-In with FedCM opt-in
  google.accounts.id.initialize({
    client_id: '244071899620-1vsnbihlgftfrq91m66apbpgdlq2ik0m.apps.googleusercontent.com',
    callback: handleGoogleCredentialResponse,
    use_fedcm_for_prompt: true, // Enable FedCM
    cancel_on_tap_outside: true,
    context: 'signin'
  });

  // Render a Google Sign-In button
  if (buttonContainer) {
    google.accounts.id.renderButton(
      buttonContainer, 
      { 
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 240
      }
    );
  }
  
  // Use the newer approach with FedCM
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      console.log('Google Sign-In skipped:', notification.getNotDisplayedReason() || notification.getSkippedReason());
      // Update the message to be more helpful
      loginAlert.textContent = 'Please click the Google Sign-In button to continue';
      loginAlert.className = 'login-alert info';
    }
  });
}

function handleGoogleCredentialResponse(response) {
  // Get the ID token from the response
  const idToken = response.credential;
  
  // Show loading state
  const loginAlert = document.querySelector('.login-alert');
  loginAlert.textContent = 'Logging in with Google...';
  loginAlert.className = 'login-alert info';
  
  // Send the token to your backend for verification
  fetch('/auth/google-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ 
      token: idToken,
      role: 'student' // Explicitly set role as student for Google login
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Login successful
      loginAlert.textContent = 'Login successful! Redirecting...';
      loginAlert.className = 'login-alert success';
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to student dashboard
      setTimeout(() => {
        window.location.href = '/student/dashboard.html';
      }, 1000);
    } else {
      // Login failed
      loginAlert.textContent = data.message || 'Google login failed. Please try again.';
      loginAlert.className = 'login-alert error';
    }
  })
  .catch(error => {
    console.error('Google login error:', error);
    loginAlert.textContent = 'An error occurred during Google login. Please try again.';
    loginAlert.className = 'login-alert error';
  });
}
// Close modals when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
    document.body.style.overflow = '';
  }
};

// Add these variables at the top of your script
// Update the messages array to only include two messages
const messages = [
  "Welcome to Library",
  "Modern Learning Space"
];

const staticMessages = [
  "Discover Your Next Adventure",
  "Where Knowledge Meets Innovation"
];

const animationSettings = {
  typeDelay: 80,
  deleteDelay: 70,
  pauseAfterType: 1000,
  pauseAfterDelete: 500
};

let messageIndex = 0;
let isAnimating = false;

function animateText(textElement, staticElement, message, staticMessage, callback) {
  if (isAnimating) return;
  isAnimating = true;
  let currentText = "";
  let i = 0;

  // Update static text
  staticElement.textContent = staticMessage;
  staticElement.classList.add('visible');

  function typeLetter() {
    if (i < message.length) {
      currentText += message[i];
      textElement.textContent = currentText;
      i++;
      setTimeout(typeLetter, animationSettings.typeDelay);
    } else {
      setTimeout(deleteLetter, animationSettings.pauseAfterType);
    }
  }

  function deleteLetter() {
    if (currentText.length > 0) {
      currentText = currentText.slice(0, -1);
      textElement.textContent = currentText;
      setTimeout(deleteLetter, animationSettings.deleteDelay);
    } else {
      isAnimating = false;
      staticElement.classList.remove('visible');
      setTimeout(callback, animationSettings.pauseAfterDelete);
    }
  }

  typeLetter();
}

function runTextAnimation() {
  const textElement = document.getElementById('animatedTextContent');
  const staticElement = document.getElementById('staticText');
  if (!textElement || !staticElement) return;

  animateText(textElement, staticElement, messages[messageIndex], staticMessages[messageIndex], () => {
    messageIndex = (messageIndex + 1) % messages.length;
    runTextAnimation();
  });
}

// Start the animation when the page loads
document.addEventListener('DOMContentLoaded', runTextAnimation);