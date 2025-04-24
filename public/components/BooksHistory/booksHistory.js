// Books History Component
// Update the initialization function to ensure search functionality is set up
window.initializeBooksHistory = function() {
  console.log('Initializing Books History component');
  
  // Ensure CSS is loaded
  loadBooksHistoryCSS();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Set up search functionality
  setupSearchFunctionality();
  
  // Load books history data
  loadBooksHistory();
};

// Make sure the component is initialized when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking for Books History component');
  if (typeof window.initializeBooksHistory === 'function') {
    window.initializeBooksHistory();
  }
});

// Add this function to load the CSS
function loadBooksHistoryCSS() {
  // Check if the CSS is already loaded
  if (!document.getElementById('books-history-css')) {
    console.log('Loading books history CSS...');
    const link = document.createElement('link');
    link.id = 'books-history-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/components/BooksHistory/booksHistory.css';
    document.head.appendChild(link);
    console.log('Books History CSS loaded');
    
    // Add a fallback for CSS loading issues
    link.onerror = function() {
      console.error('Failed to load books history CSS, adding inline styles');
      addBooksHistoryStyles();
    };
  }
}

// Add this function as a fallback for CSS loading issues
function addBooksHistoryStyles() {
  const styleElement = document.createElement('style');
  styleElement.id = 'books-history-inline-styles';
  styleElement.textContent = `
    .books-history-container {
      padding: 20px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-top: 20px;
    }
    
    .books-history-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .books-history-summary-card {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .books-history-summary-icon {
      margin-right: 15px;
      background: rgba(255, 255, 255, 0.2);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .books-history-summary-icon svg {
      width: 24px;
      height: 24px;
      color: white;
    }
    
    .books-history-summary-info h3 {
      font-size: 16px;
      margin: 0 0 5px 0;
      font-weight: 500;
    }
    
    .books-history-summary-info p {
      font-size: 24px;
      margin: 0;
      font-weight: 700;
    }
    
    .books-history-search-container {
      display: flex;
      gap: 10px;
    }
    
    .books-history-search-select {
      padding: 10px 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background-color: white;
      min-width: 150px;
    }
    
    .books-history-search-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .books-history-search-input {
      padding: 10px 15px;
      padding-right: 40px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      width: 250px;
    }
    
    .books-history-search-button {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #3b82f6;
    }
    
    .books-history-table-container {
      overflow-x: auto;
    }
    
    .books-history-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .books-history-table th {
      background-color: #f8fafc;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .books-history-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    
    .books-history-table tr:hover {
      background-color: #f1f5f9;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    
    .status-badge.borrowed {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .status-badge.returned {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .status-badge.overdue {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    
    .empty-table-message {
      text-align: center;
      padding: 40px 0;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }
    
    .empty-icon {
      width: 48px;
      height: 48px;
      color: #94a3b8;
      margin-bottom: 15px;
    }
    
    .retry-btn {
      margin-top: 15px;
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .retry-btn:hover {
      background-color: #2563eb;
    }
    
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1050;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .notification {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 300px;
      max-width: 400px;
      animation: slide-in 0.3s ease-out;
      border-left: 4px solid #3b82f6;
    }
    
    .notification.success {
      border-left-color: #10b981;
    }
    
    .notification.error {
      border-left-color: #ef4444;
    }
    
    .notification.warning {
      border-left-color: #f59e0b;
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .notification-content i {
      width: 20px;
      height: 20px;
    }
    
    .notification-content p {
      margin: 0;
      font-size: 14px;
    }
    
    .notification-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #64748b;
    }
    
    .fade-out {
      animation: fade-out 0.3s ease-out forwards;
    }
    
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes fade-out {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    @media (max-width: 768px) {
      .books-history-header-flex {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .books-history-search-container {
        width: 100%;
        flex-direction: column;
      }
      
      .books-history-search-input {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(styleElement);
}

// Update the setupSearchFunctionality function to include debounce and better event handling
function setupSearchFunctionality() {
  console.log('Setting up books history search functionality');
  const searchButton = document.getElementById('historySearchButton');
  const searchInput = document.getElementById('historySearchInput');
  const searchType = document.getElementById('historySearchType');
  
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      searchBooksHistory();
    });
    console.log('Search button event listener attached');
  } else {
    console.error('Search button not found');
  }
  
  if (searchInput) {
    // Add Enter key support
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchBooksHistory();
      }
    });
    
    // Add live search with debounce (300ms delay)
    searchInput.addEventListener('input', debounce(function() {
      if (this.value.trim().length >= 1 || this.value.trim().length === 0) {
        searchBooksHistory();
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
        searchBooksHistory();
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

// Update the searchBooksHistory function to handle the search properly
function searchBooksHistory() {
  console.log('Search books history function called');
  const searchType = document.getElementById('historySearchType');
  const searchInput = document.getElementById('historySearchInput');
  
  if (!searchType || !searchInput) {
    console.error('Search elements not found');
    return;
  }
  
  const type = searchType.value;
  const query = searchInput.value.trim();
  
  if (!query) {
    // If search is empty, load all books history
    loadBooksHistory();
    return;
  }
  
  console.log(`Searching books history with type: ${type}, query: ${query}`);
  
  // Show loading state
  const tbody = document.getElementById('booksHistoryTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-message">
          <div class="loading-state">
            <i data-lucide="loader" class="loading-icon"></i>
            <p>Searching books history...</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  fetch(`/admin/books-history?type=${type}&query=${encodeURIComponent(query)}`, {
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
    console.log('Books history search results:', data);
    if (data.success) {
      if (data.history && data.history.length > 0) {
        displayBooksHistory(data.history);
      } else {
        showNoSearchResults(query);
      }
    } else {
      console.error('Failed to search books history:', data.message);
      showNoSearchResults(query);
    }
  })
  .catch(error => {
    console.error('Error searching books history:', error);
    showNoSearchResults(query);
  });
}

function loadBooksHistory() {
  console.log('Loading books history...');
  fetch('/admin/books-history', {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Books history data:', data);
    if (data.success) {
      displayBooksHistory(data.history);
    } else {
      console.error('Failed to load books history:', data.message);
      showNotification('Failed to load books history: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error loading books history:', error);
    showNotification('Error loading books history. Please try again.', 'error');
    
    const tbody = document.getElementById('booksHistoryTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-message">
            <div class="empty-state">
              <i data-lucide="alert-circle" class="empty-icon"></i>
              <p>Error loading books history</p>
              <button onclick="loadBooksHistory()" class="retry-btn">Retry</button>
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

function displayBooksHistory(history) {
  console.log('Displaying books history with', history.length, 'items');
  const tbody = document.getElementById('booksHistoryTableBody');
  
  if (!tbody) {
    console.error('Books history table body not found!');
    return;
  }
  
  if (!history || history.length === 0) {
    console.log('No history items to display');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="book-open" class="empty-icon"></i>
            <p>No books history found</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Update the total count
    const totalElement = document.getElementById('totalBooksCount');
    if (totalElement) {
      totalElement.textContent = '0';
    }
    
    return;
  }
  
  console.log('Clearing table body and adding', history.length, 'rows');
  tbody.innerHTML = '';
  
  history.forEach((item, index) => {
    console.log(`Processing history item ${index + 1}:`, item);
    const borrowDate = item.borrow_date ? new Date(item.borrow_date) : new Date();
    const dueDate = item.due_date ? new Date(item.due_date) : new Date();
    const returnDate = item.return_date ? new Date(item.return_date) : null;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id || 'N/A'}</td>
      <td>${item.book_title || 'Unknown'}</td>
      <td>${item.user_name || 'Unknown'}</td>
      <td>${borrowDate.toLocaleDateString()}</td>
      <td>${dueDate.toLocaleDateString()}</td>
      <td>${returnDate ? returnDate.toLocaleDateString() : 'Not returned'}</td>
      <td><span class="status-badge ${(item.status || 'unknown').toLowerCase()}">${item.status || 'Unknown'}</span></td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Update the total count
  const totalElement = document.getElementById('totalBooksCount');
  if (totalElement) {
    totalElement.textContent = history.length.toString();
  }
  
  // Initialize Lucide icons for the newly added content
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('Finished displaying books history');
}

function showNoSearchResults(searchTerm) {
  const tbody = document.getElementById('booksHistoryTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="search-x" class="empty-icon"></i>
            <p>No books history found matching "${searchTerm}"</p>
            <button onclick="loadBooksHistory()" class="retry-btn">Show All Books History</button>
          </div>
        </td>
      </tr>
    `;
    
    // Update the total count to show 0 when no results
    const totalElement = document.getElementById('totalBooksCount');
    if (totalElement) {
      totalElement.textContent = '0';
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
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