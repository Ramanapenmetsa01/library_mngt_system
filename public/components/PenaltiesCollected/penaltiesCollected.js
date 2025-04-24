window.initializePenaltiesCollected = function() {
  console.log('Initializing Penalties Collected component');
  
  // Ensure CSS is loaded
  loadPenaltiesCollectedCSS();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Set up search functionality
  setupSearchFunctionality();
  
  // Load penalties data
  loadPenalties();
};

// Update the loadPenaltiesCollectedCSS function
function loadPenaltiesCollectedCSS() {
  // Check if the CSS is already loaded
  if (!document.getElementById('penalties-collected-css')) {
    console.log('Loading penalties collected CSS...');
    const link = document.createElement('link');
    link.id = 'penalties-collected-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/components/PenaltiesCollected/penaltiesCollected.css';
    document.head.appendChild(link);
    console.log('Penalties Collected CSS loaded');
    
    // Add a fallback for CSS loading issues
    link.onerror = function() {
      console.error('Failed to load penalties CSS, adding inline styles');
      addPenaltiesCollectedStyles();
    };
  }
}

// Make sure the component is initialized when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing Penalties Collected component');
  if (typeof window.initializePenaltiesCollected === 'function') {
    window.initializePenaltiesCollected();
  }
});

function setupSearchFunctionality() {
  const searchButton = document.getElementById('penaltySearchButton');
  const searchInput = document.getElementById('penaltySearchInput');
  const searchType = document.getElementById('penaltySearchType');
  
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      searchPenalties();
    });
    console.log('Search button event listener attached');
  } else {
    console.error('Search button not found');
  }
  
  if (searchInput) {
    // Add Enter key support
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchPenalties();
      }
    });
    
    // Add live search with debounce (300ms delay)
    searchInput.addEventListener('input', debounce(function() {
      if (this.value.trim().length >= 1 || this.value.trim().length === 0) {
        searchPenalties();
      }
    }, 300));
    
    console.log('Search input event listeners attached');
  } else {
    console.error('Search input not found');
  }
  
  if (searchType) {
    // When search type changes, re-run the search if there's a value
    searchType.addEventListener('change', function() {
      if (searchInput && searchInput.value.trim().length > 0) {
        searchPenalties();
      }
    });
    console.log('Search type event listener attached');
  } else {
    console.error('Search type not found');
  }
}

// Add a debounce function to prevent too many searches while typing
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function loadPenalties() {
  console.log('Loading penalties...');
  
  // Show loading state
  const tbody = document.getElementById('penaltiesTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-message">
          <div class="loading-state">
            <i data-lucide="loader" class="loading-icon"></i>
            <p>Loading penalties...</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } else {
    console.error('penaltiesTableBody not found when trying to load penalties');
    return;
  }
  
  // Use the full URL to avoid any path issues
  fetch('/admin/penalties-collected', {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => {
    console.log('Penalties response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Penalties data received:', data);
    if (data.success) {
      displayPenalties(data.penalties);
      updateTotalAmount(data.penalties);
    } else {
      console.error('Failed to load penalties:', data.message);
      const tbody = document.getElementById('penaltiesTableBody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-table-message">
              <div class="empty-state">
                <i data-lucide="alert-circle" class="empty-icon"></i>
                <p>Error: ${data.message || 'Failed to load penalties'}</p>
              </div>
            </td>
          </tr>
        `;
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    }
  })
  .catch(error => {
    console.error('Error loading penalties:', error);
    const tbody = document.getElementById('penaltiesTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-message">
            <div class="empty-state">
              <i data-lucide="alert-circle" class="empty-icon"></i>
              <p>Error loading penalties: ${error.message}</p>
              <button onclick="loadPenalties()" class="retry-btn">Retry</button>
            </div>
          </td>
        </tr>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  });
}

// Update the displayPenalties function to remove the Actions column
function displayPenalties(penalties) {
  const tbody = document.getElementById('penaltiesTableBody');
  
  if (!penalties || penalties.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="dollar-sign" class="empty-icon"></i>
            <p>No penalties collected yet</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    return;
  }
  
  tbody.innerHTML = '';
  
  penalties.forEach(penalty => {
    const paymentDate = new Date(penalty.payment_date);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${penalty.id}</td>
      <td>${penalty.user_name || 'Unknown'}</td>
      <td>${penalty.book_title || 'Unknown'}</td>
      <td>${paymentDate.toLocaleDateString()}</td>
      <td>$${parseFloat(penalty.amount).toFixed(2)}</td>
      <td><span class="status-badge ${penalty.status.toLowerCase()}">${penalty.status}</span></td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Initialize Lucide icons for the newly added content
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Update the searchPenalties function
function searchPenalties() {
  const searchType = document.getElementById('penaltySearchType');
  const searchInput = document.getElementById('penaltySearchInput');
  
  if (!searchType || !searchInput) {
    console.error('Search elements not found');
    return;
  }
  
  const searchTypeValue = searchType.value;
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    // If search term is empty, load all penalties
    loadPenalties(); // This is the correct function to call
    return;
  }
  
  console.log(`Searching for ${searchTerm} by ${searchTypeValue}`);
  
  // Show loading state
  const tbody = document.getElementById('penaltiesTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table-message">
          <div class="loading-state">
            <i data-lucide="loader" class="loading-icon"></i>
            <p>Searching penalties...</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  // Use the full URL to avoid any path issues
  fetch(`/admin/penalties-collected?type=${searchTypeValue}&query=${encodeURIComponent(searchTerm)}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Search results:', data);
    if (data.success) {
      // Check if we have any penalties that match the search
      if (data.penalties && data.penalties.length > 0) {
        displayPenalties(data.penalties);
        updateTotalAmount(data.penalties);
      } else {
        // No matches
        showNoSearchResults(searchTerm);
      }
    } else {
      showNotification(data.message || 'Failed to search penalties', 'error');
      showNoSearchResults(searchTerm);
    }
  })
  .catch(error => {
    console.error('Error searching penalties:', error);
    showNotification('Error searching penalties: ' + error.message, 'error');
    showNoSearchResults(searchTerm);
  });
}

function showNoSearchResults(searchTerm) {
  const tbody = document.getElementById('penaltiesTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="search-x" class="empty-icon"></i>
            <p>No penalties found matching "${searchTerm}"</p>
            <button onclick="loadPenalties()" class="retry-btn">Show All Penalties</button>
          </div>
        </td>
      </tr>
    `;
    
    // Update the total amount to show $0.00 when no results
    const totalElement = document.getElementById('totalPenaltiesAmount');
    if (totalElement) {
      totalElement.textContent = '$0.00';
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Make sure to update the setupSearchFunctionality function
function setupSearchFunctionality() {
  const searchButton = document.getElementById('penaltySearchButton');
  const searchInput = document.getElementById('penaltySearchInput');
  const searchType = document.getElementById('penaltySearchType');
  
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      searchPenalties();
    });
    console.log('Search button event listener attached');
  } else {
    console.error('Search button not found');
  }
  
  if (searchInput) {
    // Add Enter key support
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchPenalties();
      }
    });
    
    // Add live search with debounce (300ms delay)
    searchInput.addEventListener('input', debounce(function() {
      if (this.value.trim().length >= 1 || this.value.trim().length === 0) {
        searchPenalties();
      }
    }, 300));
    
    console.log('Search input event listeners attached');
  } else {
    console.error('Search input not found');
  }
  
  if (searchType) {
    // When search type changes, re-run the search if there's a value
    searchType.addEventListener('change', function() {
      if (searchInput && searchInput.value.trim().length > 0) {
        searchPenalties();
      }
    });
    console.log('Search type event listener attached');
  } else {
    console.error('Search type not found');
  }
}

function updateTotalAmount(penalties) {
  const totalElement = document.getElementById('totalPenaltiesAmount');
  if (!totalElement) return;
  
  if (!penalties || penalties.length === 0) {
    totalElement.textContent = '$0.00';
    return;
  }
  
  const total = penalties.reduce((sum, penalty) => sum + parseFloat(penalty.amount), 0);
  totalElement.textContent = `$${total.toFixed(2)}`;
}

window.viewPenaltyDetails = function(penaltyId) {
  console.log(`Viewing details for penalty ID: ${penaltyId}`);
  
  fetch(`/admin/penalties/${penaltyId}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Penalty details:', data);
    if (data.success) {
      showPenaltyDetailsModal(data.penalty);
    } else {
      showNotification('Failed to load penalty details: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error loading penalty details:', error);
    showNotification('Error loading penalty details: ' + error.message, 'error');
  });
};

function showPenaltyDetailsModal(penalty) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  // Format the payment date
  const paymentDate = new Date(penalty.payment_date);
  const formattedDate = paymentDate.toLocaleDateString();
  
  // Create modal content
  overlay.innerHTML = `
    <div class="penalty-details-modal">
      <div class="modal-header">
        <h3>Penalty Details</h3>
        <button class="close-modal-btn"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">${penalty.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Student:</span>
          <span class="detail-value">${penalty.user_name || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Book:</span>
          <span class="detail-value">${penalty.book_title || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount:</span>
          <span class="detail-value">$${parseFloat(penalty.amount).toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value status-badge ${penalty.status.toLowerCase()}">${penalty.status}</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn close">Close</button>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(overlay);
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Add event listeners for closing
  const closeBtn = overlay.querySelector('.close-modal-btn');
  const closeModalBtn = overlay.querySelector('.modal-btn.close');
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  closeModalBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // Close on click outside the modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

function showNotification(message, type = 'info') {
  // Check if notification container exists, if not create it
  let notificationContainer = document.querySelector('.notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert-triangle' : 'info'}"></i>
      <p>${message}</p>
    </div>
    <button class="notification-close">×</button>
  `;
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Add close button functionality
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}


// Update the searchPenalties function in dashboard.js
// Update the searchPenalties function
function searchPenalties() {
  const searchType = document.getElementById('penaltySearchType');
  const searchInput = document.getElementById('penaltySearchInput');
  
  if (!searchType || !searchInput) {
    console.error('Search elements not found');
    return;
  }
  
  const searchTypeValue = searchType.value;
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    // If search term is empty, load all penalties
    loadPenaltiesCollectedContent();
    return;
  }
  
  console.log(`Searching for ${searchTerm} by ${searchTypeValue}`);
  
  // Show loading state
  const tbody = document.getElementById('penaltiesTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table-message">
          <div class="loading-state">
            <i data-lucide="loader" class="loading-icon"></i>
            <p>Searching penalties...</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  // Use the full URL to avoid any path issues
  fetch(`/admin/penalties-collected?type=${searchTypeValue}&query=${encodeURIComponent(searchTerm)}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Search results:', data);
    if (!data.success) {
      showNotification(data.message || 'Failed to search penalties', 'error');
      loadPenaltiesCollectedContent();
      return;
    }
  
    // 1) filter the returned array by the searchType & searchTerm
    const penaltiesArray = data.penalties || [];
    const filtered = penaltiesArray.filter(penalty => {
      let field = penalty[searchTypeValue];
      if (searchTypeValue === 'payment_date') {
        field = new Date(penalty.payment_date).toLocaleDateString();
      }
      const val = field ? field.toString().toLowerCase() : '';
      return val.includes(searchTerm.toLowerCase());
    });
  
    // 2) display either the filtered results or a no‐results message
    if (filtered.length > 0) {
      displayPenalties(filtered);
      updateTotalAmount(filtered);
      // your existing row‐by‐row animation code here…
    } else {
      const tbody = document.getElementById('penaltiesTableBody');
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table-message">
            <div class="no-results-state">
              <i data-lucide="search-x" class="empty-icon"></i>
              <p>No penalties found matching "${searchTerm}"</p>
              <button onclick="loadPenaltiesCollectedContent()" class="retry-btn">Show All</button>
            </div>
          </td>
        </tr>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      updateTotalAmount(0);
    }
  })
  
}
// Function to update the total amount with animation
// Function to update the total amount with animation
function updateTotalAmount(penalties) {
  const totalElement = document.getElementById('totalPenaltiesAmount');
  if (!totalElement) return;
  
  // Calculate total from penalties array
  let total = 0;
  
  if (typeof penalties === 'number') {
    total = penalties;
  } else if (Array.isArray(penalties)) {
    total = penalties.reduce((sum, penalty) => {
      const amount = parseFloat(penalty.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }
  
  // Get current value
  const currentValue = parseFloat(totalElement.textContent.replace('$', '')) || 0;
  
  // Animate the value change
  const duration = 1000; // 1 second
  const start = Date.now();
  
  // Add the updating class for styling
  totalElement.classList.add('updating');
  
  const animate = () => {
    const now = Date.now();
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smoother animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    // Calculate current value in the animation
    const currentAnimatedValue = currentValue + (total - currentValue) * easeOutQuart;
    
    // Update the display
    totalElement.textContent = `$${currentAnimatedValue.toFixed(2)}`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Final update with exact value
      totalElement.textContent = `$${total.toFixed(2)}`;
      // Remove the updating class
      setTimeout(() => {
        totalElement.classList.remove('updating');
      }, 200);
    }
  };
  
  animate();
}