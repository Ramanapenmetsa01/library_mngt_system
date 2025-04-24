function loadUserDetails() {
  const headerControls = document.getElementById('sectionControls');
  
  // Insert search controls in header
  // Update the select options to match database column names
  headerControls.innerHTML = `
    <div class="search-container">
      <select id="searchType" class="search-select">
        <option value="name">Search by Username</option>
        <option value="email">Search by Email</option>
      </select>
      <div class="search-input-container">
        <input type="text" id="searchInput" placeholder="Search users..." class="search-input">
        <button class="search-button">
          <i data-lucide="search"></i>
        </button>
      </div>
    </div>
  `;

  // Load the table content
  // Update the table header
  const userDetailsSection = document.getElementById('userDetailsSection');
  userDetailsSection.innerHTML = `
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Password</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="usersTableBody">
        </tbody>
      </table>
    </div>
  `;

  loadUsers();
  setupSearchHandlers();
  lucide.createIcons();
}

function loadUsers(searchType = '', searchQuery = '') {
  fetch(`http://localhost:3000/admin/users?type=${searchType}&query=${searchQuery}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      if (response.status === 401) {
        window.location.replace('/login.html');
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data) return;
      if (data.success) {
        displayUsers(data.users);
      }
    })
    .catch(error => {
      console.error('Error loading users:', error);
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2rem; color: #ef4444;">
            Failed to load users. Please try again later.
          </td>
        </tr>
      `;
    });
}

// Update the displayUsers function
function displayUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem; color: #ef4444; font-weight: 500;">
          No users found
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.password}</td>
      <td>
        <div class="edit-menu" id="edit-menu-${user.id}">
          <button onclick="toggleEditMenu('${user.id}')" class="action-btn edit">
            <i data-lucide="edit"></i> Edit
          </button>
          <div class="edit-options" id="edit-options-${user.id}">
            <button onclick="changePassword('${user.id}')" class="action-btn edit">
              <i data-lucide="key"></i> Change Password
            </button>
            <button onclick="deleteUser('${user.id}')" class="action-btn delete">
              <i data-lucide="trash-2"></i> Delete
            </button>
          </div>
        </div>
      </td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function toggleEditMenu(userId) {
  const editOptions = document.getElementById(`edit-options-${userId}`);
  const isVisible = editOptions.classList.contains('show');
  
  // Hide all other menus first
  document.querySelectorAll('.edit-options').forEach(menu => {
    menu.classList.remove('show');
  });
  
  if (!isVisible) {
    editOptions.classList.add('show');
  }
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.edit-menu')) {
    document.querySelectorAll('.edit-options').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

// Add this to your CSS file

function setupSearchHandlers() {
  const searchInput = document.getElementById('searchInput');
  const searchType = document.getElementById('searchType');
  
  let debounceTimer;
  
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadUsers(searchType.value, searchInput.value);
    }, 300);
  });
  
  searchType.addEventListener('change', () => {
    loadUsers(searchType.value, searchInput.value);
  });
}

function editUser(userId) {
  const newPassword = prompt('Enter new password for the user:');
  if (newPassword) {
    fetch(`http://localhost:3000/admin/users/${userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Password updated successfully');
        loadUsers();
      } else {
        alert('Failed to update password');
      }
    })
    .catch(error => {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    });
  }
}

function deleteUser(userId) {
  // Create and show confirmation popup
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'confirmation-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Delete User</h3>
      <p>Are you sure you want to delete this user? This action cannot be undone.</p>
      <div class="popup-buttons">
        <button id="cancel-delete" class="popup-btn cancel">Cancel</button>
        <button id="confirm-delete" class="popup-btn confirm">Delete</button>
      </div>
    </div>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Handle button clicks
  document.getElementById('cancel-delete').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  document.getElementById('confirm-delete').addEventListener('click', () => {
    fetch(`http://localhost:3000/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Change popup to success message
        popup.innerHTML = `
          <div class="popup-content success">
            <h3>Success</h3>
            <p>User deleted successfully!</p>
            <div class="popup-buttons">
              <button id="ok-button" class="popup-btn ok">OK</button>
            </div>
          </div>
        `;
        
        document.getElementById('ok-button').addEventListener('click', () => {
          document.body.removeChild(overlay);
          loadUsers(); // Refresh the user list
        });
      } else {
        // Show error message
        popup.innerHTML = `
          <div class="popup-content error">
            <h3>Error</h3>
            <p>Failed to delete user. Please try again.</p>
            <div class="popup-buttons">
              <button id="ok-button" class="popup-btn ok">OK</button>
            </div>
          </div>
        `;
        
        document.getElementById('ok-button').addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
      }
    })
    .catch(error => {
      console.error('Error deleting user:', error);
      popup.innerHTML = `
        <div class="popup-content error">
          <h3>Error</h3>
          <p>Failed to delete user. Please try again.</p>
          <div class="popup-buttons">
            <button id="ok-button" class="popup-btn ok">OK</button>
          </div>
        </div>
      `;
      
      document.getElementById('ok-button').addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    });
  });
}

function changePassword(userId) {
  // Create and show password change popup
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'confirmation-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Change Password</h3>
      <div class="form-group">
        <label for="new-password">New Password</label>
        <input type="password" id="new-password" class="popup-input" placeholder="Enter new password">
      </div>
      <div class="popup-buttons">
        <button id="cancel-password" class="popup-btn cancel">Cancel</button>
        <button id="confirm-password" class="popup-btn confirm">Update</button>
      </div>
    </div>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Handle button clicks
  document.getElementById('cancel-password').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  document.getElementById('confirm-password').addEventListener('click', () => {
    const newPassword = document.getElementById('new-password').value;
    
    if (!newPassword) {
      // Show validation error
      const errorMsg = document.createElement('p');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Please enter a new password';
      
      // Remove any existing error message
      const existingError = popup.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      // Insert error before buttons
      const formGroup = popup.querySelector('.form-group');
      formGroup.appendChild(errorMsg);
      return;
    }
    
    fetch(`http://localhost:3000/admin/users/${userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Change popup to success message
        popup.innerHTML = `
          <div class="popup-content success">
            <h3>Success</h3>
            <p>Password updated successfully!</p>
            <div class="popup-buttons">
              <button id="ok-button" class="popup-btn ok">OK</button>
            </div>
          </div>
        `;
        
        document.getElementById('ok-button').addEventListener('click', () => {
          document.body.removeChild(overlay);
          loadUsers(); // Refresh the user list
        });
      } else {
        // Show error message
        popup.innerHTML = `
          <div class="popup-content error">
            <h3>Error</h3>
            <p>Failed to update password. Please try again.</p>
            <div class="popup-buttons">
              <button id="ok-button" class="popup-btn ok">OK</button>
            </div>
          </div>
        `;
        
        document.getElementById('ok-button').addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
      }
    })
    .catch(error => {
      console.error('Error updating password:', error);
      popup.innerHTML = `
        <div class="popup-content error">
          <h3>Error</h3>
          <p>Failed to update password. Please try again.</p>
          <div class="popup-buttons">
            <button id="ok-button" class="popup-btn ok">OK</button>
          </div>
        </div>
      `;
      
      document.getElementById('ok-button').addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    });
  });
}