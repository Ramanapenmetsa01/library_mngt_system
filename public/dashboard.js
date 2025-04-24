// Declare global variables for caching DOM elements
let heroSection, overviewSection, totalUsersEl, totalBooksEl, issuedBooksEl, links;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Cache elements globally
  heroSection     = document.getElementById('heroSection');
  overviewSection = document.getElementById('overviewSection');
  totalUsersEl    = document.getElementById('totalUsersValue');
  totalBooksEl    = document.getElementById('totalBooksValue');
  issuedBooksEl   = document.getElementById('issuedBooksValue');
  links           = document.querySelectorAll('.sidebar a');

  // Initialize sidebar navigation
  initializeSidebar(links, heroSection, overviewSection);

  // Check session and load overview if valid
  checkSession().then(valid => {
    if (valid) {
      loadOverview();
    }
  });
});

// Check session status
function checkSession() {
  return fetch('http://localhost:3000/session', {
    credentials: 'include'
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success || data.user.role !== 'admin') {
      location.replace('/login.html');
      return false;
    }
    return true;
  })
  .catch(() => {
    location.replace('/login.html');
    return false;
  });
}
// Load overview metrics
function loadOverview() {
  console.log('Fetching overview data...');
  fetch('http://localhost:3000/admin/overview', {
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
    console.log('Overview data:', data);
    if (data.success) {
      totalUsersEl.textContent = data.totalUsers || '0';
      totalBooksEl.textContent = data.availableBooks || '0';
      issuedBooksEl.textContent = data.issuedBooks || '0';
    }
  })
  .catch(error => {
    console.error('Overview error:', error);
  });
}
// Initialize sidebar navigation
// Initialize sidebar navigation
/**
 * Fetches a component HTML and injects it into the matching section,
 * then re‑initializes Lucide icons and calls the component's init fn.
 */
function loadSection(htmlPath, sectionId, initFn) {
  const contentDiv = document.getElementById(sectionId + 'Content');
  if (!contentDiv) return console.error(`No container #${sectionId}Content`);

  fetch(htmlPath)
    .then(r => {
      if (!r.ok) throw new Error(`Failed to load ${htmlPath}`);
      return r.text();
    })
    .then(html => {
      contentDiv.innerHTML = html;
      lucide.createIcons();
      if (typeof initFn === 'function') initFn();
    })
    .catch(err => {
      console.error(err);
      contentDiv.innerHTML = '<p class="error">Could not load section.</p>';
    });
}

function initializeSidebar(links, heroSection, overviewSection) {
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.target;
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Clear header controls for all sections
      const headerControls = document.getElementById('sectionControls');
      headerControls.innerHTML = '';

      // Hide all sections
      document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
      });

      // Show relevant section based on target
      if (target === 'overview') {
        heroSection.style.display = '';
        overviewSection.style.display = '';
        loadOverview();
      } else if (target === 'userDetails') {
        const userDetailsSection = document.getElementById('userDetailsSection');
        userDetailsSection.style.display = 'block';
        loadUserDetails();
      } else if (target === 'booksAvailable') {
        // Create booksAvailableSection if it doesn't exist
        let booksAvailableSection = document.getElementById('booksAvailableSection');
        if (!booksAvailableSection) {
          booksAvailableSection = document.createElement('section');
          booksAvailableSection.id = 'booksAvailableSection';
          booksAvailableSection.className = 'other-section';
          
          const contentDiv = document.createElement('div');
          contentDiv.id = 'booksAvailableContent';
          booksAvailableSection.appendChild(contentDiv);
          
          document.querySelector('.dashboard-main').appendChild(booksAvailableSection);
        }
        
        booksAvailableSection.style.display = 'block';
        
        // Add header controls with search and add book button
        headerControls.innerHTML = `
          <div class="header-controls header-right-controls">
            <button id="addBookBtn" class="action-btn add">
              <i data-lucide="plus"></i> Add Book
            </button>
            <select id="searchType" class="search-select">
              <option value="title">Search by Title</option>
              <option value="author">Search by Author</option>
              <option value="year">Search by Year</option>
              <option value="id">Search by ID</option>
            </select>
            <div class="search-input-container">
              <input type="text" id="searchInput" class="search-input" placeholder="Search books...">
              <button class="search-button" id="searchButton">
                <i data-lucide="search"></i>
              </button>
            </div>
          </div>
        `;
        
        // Initialize Lucide icons for the new controls
        lucide.createIcons();
        
        // Load the Books Available content
        loadBooksAvailableContent();
        
        // Add event listeners for the header controls after content is loaded
        setTimeout(() => {
          // Add Book button event listener
          const addBookBtn = document.getElementById('addBookBtn');
          if (addBookBtn) {
            addBookBtn.addEventListener('click', () => {
              if (typeof addNewBook === 'function') {
                addNewBook();
              } else if (typeof showAddBookForm === 'function') {
                showAddBookForm();
              }
            });
          }
          
          // Live search implementation
          const searchInput = document.getElementById('searchInput');
          const searchType = document.getElementById('searchType');
          
          if (searchInput && searchType) {
            let debounceTimer;
            
            // Add input event listener for live search
            searchInput.addEventListener('input', () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                console.log('Live search triggered');
                if (typeof searchBooks === 'function') {
                  searchBooks();
                }
              }, 300); // 300ms debounce delay
            });
            
            // Also trigger search when search type changes
            searchType.addEventListener('change', () => {
              if (searchInput.value.trim() !== '' && typeof searchBooks === 'function') {
                searchBooks();
              }
            });
            
            // Keep the click event for the search button as a fallback
            const searchButton = document.getElementById('searchButton');
            if (searchButton) {
              searchButton.addEventListener('click', () => {
                if (typeof searchBooks === 'function') {
                  searchBooks();
                }
              });
            }
          }
        }, 500);
      } else if (target === 'booksDue') {
        // Show Books Due section
        const booksDueSection = document.getElementById('booksDueSection');
        booksDueSection.style.display = 'block';
        
        // Add header controls with search
        headerControls.innerHTML = `
          <div class="header-controls header-right-controls">
            <select id="searchType" class="search-select">
              <option value="user">Search by User</option>
              <option value="book">Search by Book</option>
              <option value="status">Search by Status</option>
            </select>
            <div class="search-input-container">
              <input type="text" id="searchInput" class="search-input" placeholder="Search books due...">
              <button class="search-button" id="searchButton">
                <i data-lucide="search"></i>
              </button>
            </div>
          </div>
        `;
        
        // Initialize Lucide icons for the new controls
        lucide.createIcons();
        
        // Call the function to load Books Due content
        loadBooksDueContent();
        
        // Add event listeners for the search controls
        setTimeout(() => {
          // Live search implementation
          const searchInput = document.getElementById('searchInput');
          const searchType = document.getElementById('searchType');
          
          if (searchInput && searchType) {
            let debounceTimer;
            
            // Add input event listener for live search
            searchInput.addEventListener('input', () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                console.log('Live search triggered for books due');
                if (typeof window.searchBooksDue === 'function') {
                  window.searchBooksDue();
                }
              }, 300); // 300ms debounce delay
            });
            
            // Also trigger search when search type changes
            searchType.addEventListener('change', () => {
              if (searchInput.value.trim() !== '' && typeof window.searchBooksDue === 'function') {
                window.searchBooksDue();
              }
            });
            
            // Keep the click event for the search button as a fallback
            const searchButton = document.getElementById('searchButton');
            if (searchButton) {
              searchButton.addEventListener('click', () => {
                if (typeof window.searchBooksDue === 'function') {
                  window.searchBooksDue();
                }
              });
            }
          }
        }, 500);
      }else if(target ==='penaltiesCollected' ){
        document.getElementById('penaltiesCollectedSection').style.display = 'block';
        loadSection(
          '/components/PenaltiesCollected/penaltiescollected.html',
          'penaltiesCollected',
          window.initializePenaltiesCollected
        );
      } else if(target === 'booksHistory') {
        // Create booksHistorySection if it doesn't exist
        let booksHistorySection = document.getElementById('booksHistorySection');
        if (!booksHistorySection) {
          booksHistorySection = document.createElement('section');
          booksHistorySection.id = 'booksHistorySection';
          booksHistorySection.className = 'other-section';
          
          const contentDiv = document.createElement('div');
          contentDiv.id = 'booksHistoryContent';
          booksHistorySection.appendChild(contentDiv);
          
          document.querySelector('.dashboard-main').appendChild(booksHistorySection);
        }
        
        booksHistorySection.style.display = 'block';
        
        // Add header controls with search
        headerControls.innerHTML = `
          <div class="header-controls header-right-controls">
            <select id="historySearchType" class="search-select">
              <option value="book_title">Search by Book</option>
              <option value="user_name">Search by User</option>
              <option value="status">Search by Status</option>
            </select>
            <div class="search-input-container">
              <input type="text" id="historySearchInput" class="search-input" placeholder="Search books history...">
              <button class="search-button" id="historySearchButton">
                <i data-lucide="search"></i>
              </button>
            </div>
          </div>
        `;
        
        // Initialize Lucide icons for the new controls
        lucide.createIcons();
        
        // Load the Books History content
        loadBooksHistoryContent();
        
        // Add event listeners for the search controls
        setTimeout(() => {
          const searchInput = document.getElementById('historySearchInput');
          const searchType = document.getElementById('historySearchType');
          
          if (searchInput && searchType) {
            let debounceTimer;
            
            // Add input event listener for live search
            searchInput.addEventListener('input', () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                console.log('Live search triggered for books history');
                if (typeof window.searchBooksHistory === 'function') {
                  window.searchBooksHistory();
                }
              }, 300); // 300ms debounce delay
            });
            
            // Also trigger search when search type changes
            searchType.addEventListener('change', () => {
              if (searchInput.value.trim() !== '' && typeof window.searchBooksHistory === 'function') {
                window.searchBooksHistory();
              }
            });
            
            // Keep the click event for the search button as a fallback
            const searchButton = document.getElementById('historySearchButton');
            if (searchButton) {
              searchButton.addEventListener('click', () => {
                if (typeof window.searchBooksHistory === 'function') {
                  window.searchBooksHistory();
                }
              });
            }
          }
        }, 500);
      }
    });
  });
}

// Function to load Books Available content
// Add this to your loadBooksAvailableContent function
function loadBooksAvailableContent() {
  const contentContainer = document.getElementById('booksAvailableContent');
  if (!contentContainer) return;
  
  // Check if content is already loaded
  if (contentContainer.innerHTML.trim() !== '') {
    // If content is already loaded, just refresh the books data
    if (typeof window.initializeBooksAvailable === 'function') {
      window.initializeBooksAvailable();
    } else if (typeof loadBooks === 'function') {
      loadBooks();
    }
    return;
  }
  
  // Load the content
  fetch('/components/BooksAvailable/booksAvailable.html')
    .then(response => response.text())
    .then(html => {
      contentContainer.innerHTML = html;
      
      // Load the CSS
      if (!document.querySelector('link[href="/components/BooksAvailable/booksAvailable.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/components/BooksAvailable/booksAvailable.css';
        document.head.appendChild(link);
      }
      
      // Load the JS
      if (!document.querySelector('script[src="/components/BooksAvailable/booksAvailable.js"]')) {
        const script = document.createElement('script');
        script.src = '/components/BooksAvailable/booksAvailable.js';
        script.onload = function() {
          console.log('BooksAvailable script loaded');
          // Initialize the component after the script is loaded
          if (typeof window.initializeBooksAvailable === 'function') {
            window.initializeBooksAvailable();
          } else {
            console.error('initializeBooksAvailable function not available');
            // Try again after a short delay
            setTimeout(() => {
              if (typeof window.initializeBooksAvailable === 'function') {
                window.initializeBooksAvailable();
              } else {
                console.error('initializeBooksAvailable function not available after waiting');
              }
            }, 1000);
          }
        };
        document.body.appendChild(script);
      } else {
        // If the script is already loaded, just initialize the component
        if (typeof window.initializeBooksAvailable === 'function') {
          window.initializeBooksAvailable();
        }
      }
    })
    .catch(error => {
      console.error('Error loading Books Available content:', error);
      contentContainer.innerHTML = '<p>Error loading content. Please try again.</p>';
    });
}

// Function to search books with parameters from header
function searchBooksWithParams(searchType, searchQuery) {
  // Update the component's search fields to match header search
  if (document.getElementById('searchType')) {
    document.getElementById('searchType').value = searchType;
  }
  
  if (document.getElementById('searchInput')) {
    document.getElementById('searchInput').value = searchQuery;
  }
  
  // Call the component's search function
  if (typeof searchBooks === 'function') {
    searchBooks();
  } else {
    console.error('searchBooks function not available');
  }
}
// Logout function
function logout() {
  fetch('/admin/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Logout response:', data);
    // Redirect to the index page instead of login.html
    window.location.href = '/index.html';
  })
  .catch(err => {
    console.error('Logout error:', err);
    // Redirect to the index page on error
    window.location.href = '/index.html';
  });
}
// Function to load Books Due content
function loadBooksDueContent() {
  const contentContainer = document.getElementById('booksDueContent');
  if (!contentContainer) return;
  
  // Check if content is already loaded
  if (contentContainer.innerHTML.trim() !== '') {
    // If content is already loaded, just refresh the books data
    if (typeof window.initializeBooksDue === 'function') {
      window.initializeBooksDue();
    }
    return;
  }
  
  // Load the content
  fetch('/components/BooksDue/booksDue.html')
    .then(response => response.text())
    .then(html => {
      contentContainer.innerHTML = html;
      
      // Load the CSS
      if (!document.querySelector('link[href="/components/BooksDue/booksdue.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/components/BooksDue/booksdue.css';
        document.head.appendChild(link);
      }
      
      // Load the JS
      if (!document.querySelector('script[src="/components/BooksDue/booksDue.js"]')) {
        const script = document.createElement('script');
        script.src = '/components/BooksDue/booksDue.js';
        script.onload = function() {
          console.log('BooksDue script loaded');
          // Initialize the component after the script is loaded
          if (typeof window.initializeBooksDue === 'function') {
            window.initializeBooksDue();
          } else {
            console.error('initializeBooksDue function not available');
            // Try again after a short delay
            setTimeout(() => {
              if (typeof window.initializeBooksDue === 'function') {
                window.initializeBooksDue();
              } else {
                console.error('initializeBooksDue function not available after waiting');
              }
            }, 1000);
          }
        };
        document.body.appendChild(script);
      } else {
        // If the script is already loaded, just initialize the component
        if (typeof window.initializeBooksDue === 'function') {
          window.initializeBooksDue();
        }
      }
    })
    .catch(error => {
      console.error('Error loading Books Due content:', error);
      contentContainer.innerHTML = '<p>Error loading content. Please try again.</p>';
    });
}

// Add 'penaltiesCollected' to your sections array
const sections = ['overview', 'booksAvailable', 'booksDue', 'students', 'penaltiesCollected'];
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

// 4. Add a debug function to check the DOM structure

// Add this function to your dashboard.js file
function debugDomStructure() {
  console.log('--- DOM Structure Debug ---');
  
  // Check booksHistorySection
  const section = document.getElementById('booksHistorySection');
  if (section) {
    console.log('booksHistorySection found:');
    console.log('- display:', getComputedStyle(section).display);
    console.log('- visibility:', getComputedStyle(section).visibility);
    console.log('- height:', getComputedStyle(section).height);
    console.log('- position in DOM:', section.parentElement.tagName);
  } else {
    console.error('booksHistorySection not found in DOM!');
  }
  
  // Check booksHistoryContent
  const content = document.getElementById('booksHistoryContent');
  if (content) {
    console.log('booksHistoryContent found:');
    console.log('- display:', getComputedStyle(content).display);
    console.log('- visibility:', getComputedStyle(content).visibility);
    console.log('- height:', getComputedStyle(content).height);
    console.log('- content HTML length:', content.innerHTML.length);
    console.log('- first 100 chars of content:', content.innerHTML.substring(0, 100));
  } else {
    console.error('booksHistoryContent not found in DOM!');
  }
  
  // Check table
  const table = document.querySelector('.books-history-table');
  if (table) {
    console.log('books-history-table found:');
    console.log('- display:', getComputedStyle(table).display);
    console.log('- visibility:', getComputedStyle(table).visibility);
    console.log('- rows count:', table.querySelectorAll('tr').length);
  } else {
    console.error('books-history-table not found in DOM!');
  }
  
  console.log('--- End DOM Structure Debug ---');
}

// Modify your loadBooksHistoryContent function to call this debug function
function loadBooksHistoryContent() {
  console.log('Loading Books History content...');
  
  // Get the container
  const booksHistoryContent = document.getElementById('booksHistoryContent');
  if (!booksHistoryContent) {
    console.error('Books History content container not found');
    return;
  }
  
  // Get the section
  const booksHistorySection = document.getElementById('booksHistorySection');
  console.log('Books History section display:', booksHistorySection ? booksHistorySection.style.display : 'section not found');
  
  // Make sure the section is visible with important flag
  if (booksHistorySection) {
    booksHistorySection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
    console.log('Set Books History section to display:block with !important');
  }
  
  // Add debug styling to make content visible
  booksHistoryContent.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background-color: #f0f0f0; min-height: 300px;';
  
  // Show loading state
  booksHistoryContent.innerHTML = `
    <div class="loading-container" style="display: flex; justify-content: center; align-items: center; padding: 2rem;">
      <i data-lucide="loader" class="loading-icon"></i>
      <p>Loading Books History...</p>
    </div>
  `;
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Insert the HTML content directly
  fetch('/components/BooksHistory/booksHistory.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Insert the HTML content
      booksHistoryContent.innerHTML = html;
      
      // Initialize Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Initialize the Books History component
      if (typeof window.initializeBooksHistory === 'function') {
        window.initializeBooksHistory();
        
        // Add a delay before debugging to allow rendering
        setTimeout(debugDomStructure, 1000);
      } else {
        console.error('initializeBooksHistory function not found');
        // Try loading the script
        const script = document.createElement('script');
        script.src = '/components/BooksHistory/booksHistory.js';
        script.onload = function() {
          console.log('Books History script loaded');
          if (typeof window.initializeBooksHistory === 'function') {
            window.initializeBooksHistory();
          } else {
            console.error('initializeBooksHistory function still not found after loading script');
          }
        };
        document.head.appendChild(script);
      }
    })
    .catch(error => {
      console.error('Error loading Books History content:', error);
      booksHistoryContent.innerHTML = `
        <div class="error-container">
          <i data-lucide="alert-circle" class="error-icon"></i>
          <p>Error loading Books History: ${error.message}</p>
          <button onclick="loadBooksHistoryContent()" class="retry-btn">Retry</button>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
}