window.initializeBooksDue = function() {
  console.log('Initializing Books Due component');
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Check if we're on a page that needs books due data loaded
  if (document.getElementById('booksDueTableBody')) {
    loadBooksDue();
  }
};

window.searchBooksDue = function() {
  console.log('Search books due function called');
  const searchType = document.getElementById('searchType');
  const searchInput = document.getElementById('searchInput');
  
  if (!searchType || !searchInput) {
    console.error('Search elements not found');
    return;
  }
  
  const type = searchType.value;
  const query = searchInput.value.trim();
  
  if (!query) {
    // If search is empty, load all books due
    loadBooksDue();
    return;
  }
  
  console.log(`Searching books due with type: ${type}, query: ${query}`);
  
  fetch(`http://localhost:3000/admin/books-due?type=${type}&query=${encodeURIComponent(query)}`, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      displayBooksDue(data.booksDue);
    } else {
      console.error('Search failed:', data.message);
      showNotification('Search failed: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error searching books due:', error);
    showNotification('Error searching books due. Please try again.', 'error');
  });
};

function loadBooksDue() {
  console.log('Loading books due...');
  fetch('http://localhost:3000/admin/books-due', {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Books due data:', data);
    if (data.success) {
      displayBooksDue(data.booksDue);
    } else {
      console.error('Failed to load books due:', data.message);
      showNotification('Failed to load books due: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error loading books due:', error);
    showNotification('Error loading books due. Please try again.', 'error');
    
    const tbody = document.getElementById('booksDueTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-table-message">
            <div class="empty-state">
              <i data-lucide="alert-circle" class="empty-icon"></i>
              <p>Error loading books due. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
      lucide.createIcons();
    }
  });
}

// Update any references from books-table to books-due-table
function displayBooksDue(booksDue) {
  const tbody = document.getElementById('booksDueTableBody');
  
  if (!booksDue || booksDue.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="book-open" class="empty-icon"></i>
            <p>No books are currently due</p>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }
  
  tbody.innerHTML = '';
  
  booksDue.forEach(book => {
    const borrowedDate = new Date(book.borrowed_date);
    const dueDate = new Date(book.due_date);
    const today = new Date();
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    // Determine status and class
    let statusClass = 'on-time';
    let statusText = 'On Time';
    
    if (book.status === 'overdue' || daysRemaining < 0) {
      statusClass = 'overdue';
      statusText = 'Overdue';
    } else if (daysRemaining <= 3) {
      statusClass = 'due-soon';
      statusText = 'Due Soon';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${book.id}</td>
      <td>${book.user_name}</td>
      <td>${book.book_title}</td>
      <td>${borrowedDate.toLocaleDateString()}</td>
      <td>${dueDate.toLocaleDateString()}</td>
      <td>${daysRemaining}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="books-due-action-btn return" onclick="returnBook(${book.id})">
          <i data-lucide="rotate-ccw"></i> Return
        </button>
        
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  lucide.createIcons();
}

function returnBook(bookDueId) {
  fetch(`http://localhost:3000/admin/return-book/${bookDueId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show success message
      showNotification('Book returned successfully', 'success');
      
      // Refresh the books due list
      loadBooksDue();
    } else {
      showNotification('Error returning book: ' + data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error returning book:', error);
    showNotification('Error returning book. Please try again.', 'error');
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
  lucide.createIcons();
  
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