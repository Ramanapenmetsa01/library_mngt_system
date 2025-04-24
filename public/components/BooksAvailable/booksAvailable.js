// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded in booksAvailable.js');
  initializeBooksAvailable();
});

// Create a function that can be called from outside (like dashboard.js)
window.initializeBooksAvailable = function() {
  console.log('Initializing Books Available component');
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Check if we're on a page that needs books loaded
  if (document.getElementById('booksTableBody')) {
    loadBooks();
  }
  
  // Add event listener for search button if it exists
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    // Remove any existing event listeners to avoid duplicates
    const newSearchButton = searchButton.cloneNode(true);
    searchButton.parentNode.replaceChild(newSearchButton, searchButton);
    
    newSearchButton.addEventListener('click', function() {
      console.log('Search button clicked');
      searchBooks();
    });
    console.log('Search button event listener attached');
  } else {
    console.error('Search button not found');
  }
  
  // Add event listener for search input if it exists
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Remove any existing event listeners to avoid duplicates
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        console.log('Enter key pressed in search input');
        searchBooks();
      }
    });
    console.log('Search input event listener attached');
  } else {
    console.error('Search input not found');
  }
  
  // Try to attach the Add Book button listener
  attachAddBookButtonListener();
  
  // Set up a mutation observer to watch for DOM changes
  setupButtonObserver();
};

// Function to attach the Add Book button event listener
function attachAddBookButtonListener() {
  const addBookBtn = document.getElementById('addBookBtn');
  
  if (!addBookBtn) {
    console.log('Add Book button not found, will try again later');
    // Instead of retrying indefinitely, let's check if we're in the right context
    const booksAvailableSection = document.getElementById('booksAvailableSection');
    if (booksAvailableSection && booksAvailableSection.style.display === 'none') {
      // We're not on the Books Available page, so we can stop trying
      console.log('Not on Books Available page, stopping retry');
      return;
    }
    
    // Only retry a limited number of times
    if (!window.addBookBtnRetryCount) {
      window.addBookBtnRetryCount = 1;
    } else {
      window.addBookBtnRetryCount++;
    }
    
    if (window.addBookBtnRetryCount <= 5) {
      setTimeout(attachAddBookButtonListener, 500);
    } else {
      console.error('Failed to find Add Book button after multiple attempts');
    }
    return;
  }
  
  // Reset retry count when button is found
  window.addBookBtnRetryCount = 0;
  
  addBookBtn.addEventListener('click', function() {
    console.log('Add Book button clicked');
    addNewBook();
  });
}

// Make searchBooks function available globally
window.searchBooks = function() {
  console.log('Search books function called');
  const searchType = document.getElementById('searchType');
  const searchInput = document.getElementById('searchInput');
  
  if (!searchType || !searchInput) {
    console.error('Search elements not found');
    return;
  }
  
  const searchTypeValue = searchType.value;
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    // If search term is empty, load all books
    loadBooks();
    return;
  }
  
  console.log(`Searching for ${searchTerm} by ${searchTypeValue}`);
  
  // Use the correct endpoint URL
  fetch(`http://localhost:3000/admin/books?type=${searchTypeValue}&query=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Display books or show "No data found" message
      if (data.books && data.books.length > 0) {
        displayBooks(data.books);
      } else {
        // No books found for the search term
        const tbody = document.getElementById('booksTableBody');
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="empty-table-message">
                <div class="empty-state">
                  <i data-lucide="search-x" class="empty-icon"></i>
                  <p>No books found matching "${searchTerm}"</p>
                </div>
              </td>
            </tr>
          `;
          // Initialize the icon
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      }
    } else {
      console.error('Search failed:', data.message);
    }
  })
  .catch(error => {
    console.error('Error searching books:', error);
    const tbody = document.getElementById('booksTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-message">
            <div class="empty-state">
              <p>Error searching books. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    }
  });
};

// Set up a mutation observer to watch for DOM changes
function setupButtonObserver() {
  // Create a new observer
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check for our elements
        const addBookBtn = document.getElementById('addBookBtn') || 
                          document.querySelector('.action-btn.add');
        
        if (addBookBtn && !addBookBtn.hasAttribute('data-listener-attached')) {
          addBookBtn.addEventListener('click', addNewBook);
          addBookBtn.setAttribute('data-listener-attached', 'true');
          console.log('Add Book button listener attached via observer');
        }
        
        const searchButton = document.getElementById('searchButton');
        if (searchButton && !searchButton.hasAttribute('data-listener-attached')) {
          searchButton.addEventListener('click', function() {
            console.log('Search button clicked via observer');
            searchBooks();
          });
          searchButton.setAttribute('data-listener-attached', 'true');
          console.log('Search button listener attached via observer');
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput && !searchInput.hasAttribute('data-listener-attached')) {
          searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              console.log('Enter key pressed in search input via observer');
              searchBooks();
            }
          });
          searchInput.setAttribute('data-listener-attached', 'true');
          console.log('Search input listener attached via observer');
        }
      }
    });
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Set a timeout to disconnect the observer after 10 seconds to prevent performance issues
  setTimeout(() => {
    observer.disconnect();
    console.log('MutationObserver disconnected after timeout');
  }, 10000);
}

// Add this function to adjust spacing dynamically
function adjustTableSpacing() {
  const headerHeight = document.querySelector('.section-header-container')?.offsetHeight || 0;
  const booksTable = document.querySelector('.books-table-container');
  
  if (booksTable) {
    // Calculate appropriate margin based on header height
    const appropriateMargin = Math.max(10, headerHeight + 10); // At least 10px margin
    booksTable.style.marginTop = `${appropriateMargin}px`;
  }
}

// Call this function after loading books and on window resize
window.addEventListener('resize', adjustTableSpacing);

// Modify the loadBooks function to call adjustTableSpacing
function loadBooks() {
  console.log('Loading books...');
  fetch('http://localhost:3000/admin/books', {
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
      displayBooks(data.books);
    } else {
      console.error('Failed to load books:', data.message);
    }
  })
  .catch(error => {
    console.error('Error loading books:', error);
    // Check if the element exists before trying to set innerHTML
    const tbody = document.getElementById('booksTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-message">
            <div class="empty-state">
              <p>Error loading books. Please try again.</p>
            </div>
          </td>
        </tr>
      `;
    }
  });
}

// Function to display books in the table
function displayBooks(books) {
  const tbody = document.getElementById('booksTableBody');
  if (!tbody) {
    console.error('Books table body not found');
    return;
  }
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  if (books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="book-x" class="empty-icon"></i>
            <p>No books available</p>
          </div>
        </td>
      </tr>
    `;
    // Initialize the icon
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    return;
  }
  
  // Add rows for each book
  books.forEach(book => {
    const row = document.createElement('tr');
    
    // Format the date
    const publishedDate = book.published_year ? book.published_year : 'N/A';
    
    // Create the cover image element
    const coverImage = book.cover_image 
      ? `<img src="${book.cover_image}" alt="${book.title}" class="book-cover-thumbnail">`
      : `<div class="no-cover"><i data-lucide="image-off"></i></div>`;
    
    // Set availability status
    const availabilityStatus = book.available 
      ? '<span class="status-badge available">Available</span>' 
      : '<span class="status-badge unavailable">Unavailable</span>';
    
    row.innerHTML = `
      <td class="book-id">${book.id}</td>
      <td class="book-cover">${coverImage}</td>
      <td class="book-title">${book.title}</td>
      <td class="book-author">${book.author}</td>
      <td class="book-year">${publishedDate}</td>
      <td class="book-status">${availabilityStatus}</td>
      <td class="book-actions">
        <button class="action-icon edit" data-id="${book.id}" title="Edit Book">
          <i data-lucide="edit"></i>
        </button>
        <button class="action-icon delete" data-id="${book.id}" title="Delete Book">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Add event listeners to the action buttons
  attachActionListeners();
}

function toggleDropdown(event, bookId) {
  event.stopPropagation(); // Prevent the click from bubbling up
  
  // Close all other dropdowns first
  document.querySelectorAll('.dropdown-content').forEach(dropdown => {
    if (dropdown.id !== `dropdown-${bookId}`) {
      dropdown.classList.remove('show');
    }
  });
  
  // Toggle the clicked dropdown
  const dropdown = document.getElementById(`dropdown-${bookId}`);
  if (dropdown) {
    dropdown.classList.toggle('show');
    
    // Add a click event listener to the document to close the dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
      if (!e.target.matches('.manage-btn') && !e.target.closest('.dropdown-content')) {
        dropdown.classList.remove('show');
        document.removeEventListener('click', closeDropdown);
      }
    });
  }
}

function editBook(bookId) {
  // Show loading indicator
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const loadingPopup = document.createElement('div');
  loadingPopup.className = 'confirmation-popup';
  loadingPopup.innerHTML = `
    <div class="popup-content">
      <h3>Loading...</h3>
      <p>Fetching book details, please wait.</p>
    </div>
  `;
  
  overlay.appendChild(loadingPopup);
  document.body.appendChild(overlay);
  
  // Log for debugging
  console.log(`Attempting to fetch book details for ID: ${bookId}`);
  
  // Use a different approach - try with a direct URL that avoids any routing issues
  const url = new URL(`http://localhost:3000/admin/books/${bookId}`);
  url.searchParams.append('_', Date.now()); // Add cache-busting parameter
  
  // First, fetch the book details with proper headers
  fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => {
    // Check if we got HTML instead of JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response.text().then(html => {
        console.error('Received HTML:', html);
        throw new Error(`Expected JSON but received HTML. Status: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch book details');
    }
    
    const book = data.book;
    console.log('Book details:', book);
    
    // Replace the loading popup with the edit form
    loadingPopup.innerHTML = `
      <div class="popup-content edit">
        <h3>Edit Book</h3>
        <form id="editBookForm" enctype="multipart/form-data">
          <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" name="title" class="popup-input" value="${book.title || ''}" required>
          </div>
          <div class="form-group">
            <label for="author">Author</label>
            <input type="text" id="author" name="author" class="popup-input" value="${book.author || ''}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="published_year">Published Year</label>
              <input type="number" id="published_year" name="published_year" class="popup-input" value="${book.published_year || ''}" required>
            </div>
            <div class="form-group">
              <label for="available">Availability</label>
              <select id="available" name="available" class="popup-input">
                <option value="true" ${book.available ? 'selected' : ''}>Available</option>
                <option value="false" ${!book.available ? 'selected' : ''}>Unavailable</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="cover_image">Cover Image</label>
            <div class="image-upload-container">
              ${book.cover_image ? 
                `<div class="current-image">
                  <img src="${book.cover_image}" alt="${book.title}" class="cover-preview">
                  <p>Current image</p>
                </div>` : 
                '<p>No current image</p>'
              }
              <div class="new-image-upload">
                <input type="file" id="cover_image" name="cover_image" class="file-input" accept="image/*">
                <label for="cover_image" class="file-input-label">Choose new image</label>
                <div id="image-preview-container" class="image-preview-container"></div>
              </div>
            </div>
          </div>
          <div class="popup-buttons">
            <button type="button" id="cancel-edit" class="popup-btn cancel">Cancel</button>
            <button type="submit" class="popup-btn save">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    
    // Add event listener for image preview
    document.getElementById('cover_image').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewContainer = document.getElementById('image-preview-container');
          previewContainer.innerHTML = `
            <div class="preview-image-container">
              <img src="${e.target.result}" alt="Preview" class="preview-image">
              <p>New image preview</p>
            </div>
          `;
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Add event listener for cancel button
    document.getElementById('cancel-edit').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Add event listener for form submission
    document.getElementById('editBookForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      
      // Only include the file if a new one was selected
      if (!formData.get('cover_image').size) {
        formData.delete('cover_image');
      }
      
      // Add the book ID
      formData.append('id', book.id);
      
      // Update the book
      fetch(`http://localhost:3000/admin/books/${book.id}`, {
        method: 'PUT',
        credentials: 'include',
        // Remove the Content-Type header to let the browser set it with the boundary parameter
        body: formData // Use FormData instead of JSON
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Show success message
          loadingPopup.innerHTML = `
            <div class="popup-content success">
              <h3>Success</h3>
              <p>Book updated successfully!</p>
              <div class="popup-buttons">
                <button id="ok-button" class="popup-btn ok">OK</button>
              </div>
            </div>
          `;
          
          document.getElementById('ok-button').addEventListener('click', () => {
            document.body.removeChild(overlay);
            loadBooks(); // Refresh the book list
          });
        } else {
          throw new Error(data.message || 'Failed to update book');
        }
      })
      .catch(error => {
        console.error('Error updating book:', error);
        loadingPopup.innerHTML = `
          <div class="popup-content error">
            <h3>Error</h3>
            <p>${error.message || 'Failed to update book. Please try again.'}</p>
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
  })
  .catch(error => {
    console.error('Error fetching book details:', error);
    loadingPopup.innerHTML = `
      <div class="popup-content error">
        <h3>Error</h3>
        <p>${error.message || 'Failed to fetch book details. Please try again.'}</p>
        <div class="popup-buttons">
          <button id="ok-button" class="popup-btn ok">OK</button>
        </div>
      </div>
    `;
    
    document.getElementById('ok-button').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  });
}

// Helper function to show error popup
function showErrorPopup(message) {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'confirmation-popup';
  popup.innerHTML = `
    <div class="popup-content error">
      <h3>Error</h3>
      <p>${message}</p>
      <div class="popup-buttons">
        <button id="ok-button" class="popup-btn ok">OK</button>
      </div>
    </div>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  document.getElementById('ok-button').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

function displayBooks(books) {
  const tbody = document.getElementById('booksTableBody');
  
  if (!books || books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-message">
          <div class="empty-state">
            <i data-lucide="book-x" class="empty-icon"></i>
            <p>No books found</p>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }
  
  tbody.innerHTML = '';
  
  books.forEach(book => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${book.id}</td>
      <td>
        ${book.cover_image 
          ? `<img src="${book.cover_image}" alt="${book.title}" class="book-cover-thumbnail">` 
          : `<div class="no-cover">No Cover</div>`
        }
      </td>
      <td class="book-title">${book.title}</td>
      <td>${book.author}</td>
      <td>${book.published_year}</td>
      <td>
        <span class="status-badge ${book.available ? 'available' : 'unavailable'}">
          <i data-lucide="${book.available ? 'check-circle' : 'x-circle'}" class="status-icon"></i>
          <span>${book.available ? 'Available' : 'Unavailable'}</span>
        </span>
      </td>
      <td>
        <div class="actions-dropdown">
          <button class="manage-btn" onclick="toggleDropdown(event, ${book.id})">
            <i data-lucide="settings"></i> Manage
          </button>
          <div id="dropdown-${book.id}" class="dropdown-content">
            <a href="javascript:void(0)" class="edit-action" onclick="editBook(${book.id})">
              <i data-lucide="edit-3"></i> Edit
            </a>
            <a href="javascript:void(0)" class="delete-action" onclick="deleteBook(${book.id})">
              <i data-lucide="trash-2"></i> Delete
            </a>
            <a href="javascript:void(0)" class="toggle-action ${book.available ? 'unavailable-action' : ''}" onclick="toggleAvailability(${book.id}, ${!book.available})">
              <i data-lucide="${book.available ? 'x-circle' : 'check-circle'}"></i> 
              ${book.available ? 'Mark Unavailable' : 'Mark Available'}
            </a>
          </div>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Initialize Lucide icons for the newly added content
  lucide.createIcons();
}

function toggleDropdown(event, bookId) {
  event.stopPropagation(); // Prevent the click from bubbling up
  
  // Close all other dropdowns first
  document.querySelectorAll('.dropdown-content').forEach(dropdown => {
    if (dropdown.id !== `dropdown-${bookId}`) {
      dropdown.classList.remove('show');
    }
  });
  
  // Toggle the clicked dropdown
  const dropdown = document.getElementById(`dropdown-${bookId}`);
  dropdown.classList.toggle('show');
  
  // Add a click event listener to the document to close the dropdown when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!e.target.matches('.manage-btn') && !e.target.closest('.dropdown-content')) {
      dropdown.classList.remove('show');
      document.removeEventListener('click', closeDropdown);
    }
  });
}
// Add these functions after the toggleDropdown function

function deleteBook(bookId) {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'confirmation-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Confirm Deletion</h3>
      <p>Are you sure you want to delete this book? This action cannot be undone.</p>
      <div class="popup-buttons">
        <button id="cancel-delete" class="popup-btn cancel">Cancel</button>
        <button id="confirm-delete" class="popup-btn delete">Delete</button>
      </div>
    </div>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  document.getElementById('cancel-delete').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  document.getElementById('confirm-delete').addEventListener('click', () => {
    // Show loading state
    popup.querySelector('.popup-content').innerHTML = `
      <h3>Deleting Book</h3>
      <div class="loading-state">
        <i data-lucide="loader" class="loading-icon"></i>
        <p>Deleting book...</p>
      </div>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Use the full URL to be consistent with other API calls in this file
    fetch(`http://localhost:3000/admin/books/${bookId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        popup.querySelector('.popup-content').innerHTML = `
          <div class="popup-content success">
            <h3>Success</h3>
            <p>Book deleted successfully!</p>
            <div class="popup-buttons">
              <button id="ok-button" class="popup-btn ok">OK</button>
            </div>
          </div>
        `;
        
        document.getElementById('ok-button').addEventListener('click', () => {
          document.body.removeChild(overlay);
          loadBooks(); // Refresh the book list
        });
      } else {
        throw new Error(data.message || 'Failed to delete book');
      }
    })
    .catch(error => {
      console.error('Error deleting book:', error);
      popup.querySelector('.popup-content').innerHTML = `
        <div class="popup-content error">
          <h3>Error</h3>
          <p>${error.message || 'Failed to delete book. Please try again.'}</p>
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
function toggleAvailability(bookId, makeAvailable) {
  fetch(`http://localhost:3000/admin/books/${bookId}/availability`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ available: makeAvailable })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadBooks(); // Refresh the book list
    } else {
      showErrorPopup(data.message || 'Failed to update availability. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error updating availability:', error);
    showErrorPopup('Failed to update availability. Please try again.');
  });
}

// Add this function after your existing functions

function addNewBook() {
  console.log('Add New Book function called');
  
  // First, check if a popup is already open and remove it
  const existingOverlay = document.querySelector('.popup-overlay');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'confirmation-popup';
  popup.innerHTML = `
    <div class="popup-content edit">
      <h3>Add New Book</h3>
      <form id="addBookForm">
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" class="popup-input" required>
        </div>
        <div class="form-group">
          <label for="author">Author</label>
          <input type="text" id="author" name="author" class="popup-input" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="published_year">Published Year</label>
            <input type="number" id="published_year" name="published_year" class="popup-input" required>
          </div>
          <div class="form-group">
            <label for="available">Availability</label>
            <select id="available" name="available" class="popup-input">
              <option value="true" selected>Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="cover_image">Cover Image</label>
          <div class="new-image-upload">
            <input type="file" id="cover_image" name="cover_image" class="file-input" accept="image/*">
            <label for="cover_image" class="file-input-label">Choose image</label>
            <div id="image-preview-container" class="image-preview-container"></div>
          </div>
        </div>
        <div class="popup-buttons">
          <button type="button" id="cancel-add" class="popup-btn cancel">Cancel</button>
          <button type="button" id="submit-add" class="popup-btn save">Add Book</button>
        </div>
      </form>
    </div>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Add event listener for image preview
  const coverImageInput = document.getElementById('cover_image');
  if (coverImageInput) {
    coverImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewContainer = document.getElementById('image-preview-container');
          if (previewContainer) {
            previewContainer.innerHTML = `
              <div class="preview-image-container">
                <img src="${e.target.result}" alt="Preview" class="preview-image">
                <p>Image preview</p>
              </div>
            `;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    console.log('Cover image event listener attached');
  }
  
  // Add direct click handlers instead of using form submission
  const cancelButton = document.getElementById('cancel-add');
  if (cancelButton) {
    cancelButton.onclick = function() {
      console.log('Cancel button clicked');
      document.body.removeChild(overlay);
    };
    console.log('Cancel button event listener attached');
  }
  
  const submitButton = document.getElementById('submit-add');
  if (submitButton) {
    submitButton.onclick = function() {
      console.log('Submit button clicked');
      
      // Get form data manually
      const form = document.getElementById('addBookForm');
      const formData = new FormData();
      
      // Add form fields to FormData
      formData.append('title', document.getElementById('title').value);
      formData.append('author', document.getElementById('author').value);
      formData.append('published_year', document.getElementById('published_year').value);
      formData.append('available', document.getElementById('available').value);
      
      // Add file if selected
      const fileInput = document.getElementById('cover_image');
      if (fileInput.files.length > 0) {
        formData.append('cover_image', fileInput.files[0]);
      }
      
      // Disable the submit button to prevent multiple submissions
      submitButton.disabled = true;
      submitButton.textContent = 'Adding...';
      
      // Add the book
      fetch('http://localhost:3000/admin/books', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Show success message
          popup.innerHTML = `
            <div class="popup-content success">
              <h3>Success</h3>
              <p>Book added successfully!</p>
              <div class="popup-buttons">
                <button id="ok-button" class="popup-btn ok">OK</button>
              </div>
            </div>
          `;
          
          const okButton = document.getElementById('ok-button');
          if (okButton) {
            okButton.onclick = function() {
              console.log('OK button clicked');
              document.body.removeChild(overlay);
              loadBooks(); // Refresh the book list
            };
          }
        } else {
          throw new Error(data.message || 'Failed to add book');
        }
      })
      .catch(error => {
        console.error('Error adding book:', error);
        popup.innerHTML = `
          <div class="popup-content error">
            <h3>Error</h3>
            <p>${error.message || 'Failed to add book. Please try again.'}</p>
            <div class="popup-buttons">
              <button id="ok-button" class="popup-btn ok">OK</button>
            </div>
          </div>
        `;
        
        const okButton = document.getElementById('ok-button');
        if (okButton) {
          okButton.onclick = function() {
            console.log('OK button clicked');
            document.body.removeChild(overlay);
          };
        }
      });
    };
    console.log('Submit button event listener attached');
  }
}
