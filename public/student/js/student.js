document.addEventListener('DOMContentLoaded', function() {
    console.log('Student dashboard initializing...');
    // Check authentication first
    checkUserAuthentication();
});

function checkUserAuthentication() {
    console.log('Checking user authentication...');
    
    fetch('/check-auth', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Auth check response status:', response.status);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Auth check data:', data);
        if (!data.authenticated || data.user.role !== 'student') {
            console.log('Not authenticated or not a student, redirecting to login');
            window.location.href = '/index.html';
        } else {
            console.log('Authentication successful for:', data.user.name);
            // Set user name in the UI
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = data.user.name;
            }
            
            // Now that we're authenticated, initialize the dashboard
            setupSidebarNavigation();
            setupLogout();
            loadOverviewData();
        }
    })
    .catch(error => {
        console.error('Authentication check failed:', error);
        // Redirect to login on error
        window.location.href = '/index.html';
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('Logout clicked');
            fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Logout response:', data);
                if (data.success) {
                    // Clear any client-side storage
                    localStorage.clear();
                    sessionStorage.clear();
                    // Redirect to login page
                    window.location.href = '/index.html';
                } else {
                    console.error('Logout failed:', data.message);
                }
            })
            .catch(error => {
                console.error('Error logging out:', error);
                // Still redirect to login page on error
                window.location.href = '/index.html';
            });
        });
    }
}

// Add the setupSidebarNavigation function if it doesn't exist
// Update the setupSidebarNavigation function to fix the section IDs
// Add this to your setupSidebarNavigation function
// ... existing code ...

function setupSidebarNavigation() {
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get the target section
            const targetSection = this.getAttribute('data-target');
            
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Show the target section
            const sectionElement = document.getElementById(`${targetSection}-section`);
            if (sectionElement) {
                sectionElement.style.display = 'block';
                sectionElement.classList.add('active');
                
                // Load section-specific content
                switch (targetSection) {
                    case 'overview':
                        loadOverviewData();
                        break;
                    case 'myBooks':
                        loadMyBooksContent();
                        break;
                    case 'browseBooks':
                        loadBrowseBooksContent();
                        break;
                    case 'history':
                        loadHistoryContent();
                        break;
                    case 'profile':
                        loadProfileData();
                        break;
                }
            }
        });
    });
}

// ... existing code ...
// Keep the rest of your functions (loadOverviewData, loadBorrowedBooks, etc.)

// Add this function after setupSidebarNavigation
// Add this to your loadOverviewData function or create it if it doesn't exist

// Update the loadDashboardData function
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Load overview data
    loadOverviewData();
    
    // Initialize charts
    if (typeof initializeOverviewCharts === 'function') {
        initializeOverviewCharts();
    } else {
        console.warn('initializeOverviewCharts function not available');
    }
}

// Update the loadOverviewData function
function loadOverviewData() {
    console.log('Loading overview data...');
    
    // Show loading indicators
    document.getElementById('borrowed-books').textContent = '...';
    document.getElementById('due-soon').textContent = '...';
    document.getElementById('available-books').textContent = '...';
    
    fetch('/student/overview', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                console.error('User not authenticated');
                window.location.href = '/login.html';
                throw new Error('Not authenticated');
            }
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Overview data:', data);
        if (data.success) {
            // Update stats cards
            updateStatsCards(data);
            
            // Fetch available books count
            fetchAvailableBooksCount();
            
            // Initialize charts if they haven't been initialized yet
            if (typeof initializeOverviewCharts === 'function') {
                initializeOverviewCharts();
            }
        } else {
            console.error('Failed to load overview data:', data.message);
        }
    })
    .catch(error => {
        console.error('Error loading overview data:', error);
        document.getElementById('borrowed-books').textContent = 'Error';
        document.getElementById('due-soon').textContent = 'Error';
        document.getElementById('available-books').textContent = 'Error';
    });
}

// Add this new function to fetch available books count
function fetchAvailableBooksCount() {
    console.log('Fetching available books count...');
    
    fetch('/student/books?available=1&countOnly=true', {
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
        console.log('Available books data:', data);
        
        if (data.success) {
            // Update the available books count in the stats
            const availableBooksElement = document.getElementById('available-books');
            if (availableBooksElement) {
                availableBooksElement.textContent = data.count || 0;
                console.log('Updated available books count:', data.count);
            } else {
                console.error('Available books element not found');
            }
        } else {
            throw new Error(data.message || 'Failed to load available books count');
        }
    })
    .catch(error => {
        console.error('Error fetching available books count:', error);
        const availableBooksElement = document.getElementById('available-books');
        if (availableBooksElement) {
            availableBooksElement.textContent = 'Error';
        }
    });
}

// Helper function to update stats cards
function updateStatsCards(data) {
    // Update available books
    const availableBooksEl = document.getElementById('available-books');
    if (availableBooksEl) {
        availableBooksEl.textContent = data.availableBooks || '0';
    }
    
    // Update borrowed books
    const borrowedBooksEl = document.getElementById('borrowed-books');
    if (borrowedBooksEl) {
        borrowedBooksEl.textContent = data.borrowedCount || '0';
    }
    
    // Update due soon
    const dueSoonEl = document.getElementById('due-soon');
    if (dueSoonEl) {
        dueSoonEl.textContent = data.dueSoonCount || '0';
    }
}

// Helper function to generate reading progress data
function generateReadingProgressData(borrowedCount) {
    // Generate last 6 months labels
    const labels = [];
    const values = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        labels.push(month.toLocaleString('default', { month: 'short' }));
        
        // Generate a realistic reading progress based on borrowed count
        // More recent months have values closer to the current borrowed count
        const value = Math.max(0, Math.round(borrowedCount * (0.5 + (i * 0.1))));
        values.push(value);
    }
    
    return { labels, values };
}

// Helper function to generate book categories data
function generateBookCategoriesData(borrowedCount) {
    // Create realistic category distribution based on borrowed count
    return {
        labels: ['Fiction', 'Science', 'History', 'Biography', 'Technology'],
        values: [
            Math.ceil(borrowedCount * 0.4), 
            Math.ceil(borrowedCount * 0.2), 
            Math.ceil(borrowedCount * 0.15), 
            Math.ceil(borrowedCount * 0.15), 
            Math.ceil(borrowedCount * 0.1)
        ]
    };
}

// Helper function to generate recent activity data
function generateRecentActivityData(data) {
    const activities = [];
    const borrowedCount = data.borrowedCount || 0;
    const dueSoonCount = data.dueSoonCount || 0;
    
    // Add login activity
    activities.push({
        type: 'login',
        description: 'You logged into the library system',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    });
    
    // Add borrowed books activity if there are borrowed books
    if (borrowedCount > 0) {
        activities.push({
            type: 'borrow',
            description: `You borrowed "${borrowedCount > 1 ? 'multiple books' : 'a book'}"`,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    // Add due soon activity if there are books due soon
    if (dueSoonCount > 0) {
        activities.push({
            type: 'due',
            description: `You have ${dueSoonCount} book${dueSoonCount > 1 ? 's' : ''} due soon`,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return activities;
}

// Add this function to load available books
function loadAvailableBooks() {
    console.log('Loading available books...');
    const availableBooksContainer = document.getElementById('available-books-container');
    
    if (!availableBooksContainer) {
        console.error('Available books container not found');
        return;
    }
    
    // Show loading indicator
    availableBooksContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading available books...</p>
        </div>
    `;
    
    // Fetch available books from the server
    fetch('/student/books?available=1', {
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
        console.log('Available books data:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load books');
        }
        
        // Display the books
        displayAvailableBooks(data.books, availableBooksContainer);
    })
    .catch(error => {
        console.error('Error loading available books:', error);
        availableBooksContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading available books. Please try again later.</p>
                <p>${error.message}</p>
                <button onclick="loadAvailableBooks()" class="retry-btn">Retry</button>
            </div>
        `;
    });
}

// Function to display available books
function displayAvailableBooks(books, container) {
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="no-books">No books available at the moment.</div>';
        return;
    }
    
    // Create HTML for the books
    let booksHTML = '<div class="books-grid">';
    
    // Display up to 6 books
    const displayBooks = books.slice(0, 6);
    
    displayBooks.forEach(book => {
        booksHTML += `
            <div class="book-card">
                <div class="book-cover">
                    ${book.cover_image ? 
                        `<img src="${book.cover_image}" alt="${book.title}" onerror="this.onerror=null; this.src='/uploads/default-book-cover.jpg';">` : 
                        `<div class="no-image">No Cover</div>`
                    }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">By ${book.author || 'Unknown'}</p>
                    <p class="book-year">${book.published_year || 'N/A'}</p>
                    <button class="borrow-btn" onclick="openBorrowModal(${book.id})">Borrow</button>
                </div>
            </div>
        `;
    });
    
    booksHTML += '</div>';
    
    // Add a "View All" button
    booksHTML += `
        <div class="view-all-container">
            <button class="view-all-btn" onclick="loadSection('browseBooks')">View All Books</button>
        </div>
    `;
    
    container.innerHTML = booksHTML;
}
// Add this function to load profile data
function loadProfileData() {
    console.log('Loading profile data...');
    
    fetch('/check-auth', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Profile data:', data);
        if (data.authenticated) {
            const container = document.getElementById('profileContent');
            if (!container) return;
            
            container.innerHTML = `
                <div class="profile-card">
                    <div class="profile-header">
                        <h2>My Profile</h2>
                    </div>
                    <div class="profile-details">
                        <div class="profile-item">
                            <span class="profile-label">Name:</span>
                            <span class="profile-value">${data.user.name}</span>
                        </div>
                        <div class="profile-item">
                            <span class="profile-label">Email:</span>
                            <span class="profile-value">${data.user.email}</span>
                        </div>
                        <div class="profile-item">
                            <span class="profile-label">Role:</span>
                            <span class="profile-value">Student</span>
                        </div>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error loading profile data:', error);
    });
}

// Add this function to load the Browse Books content
function loadBrowseBooksContent() {
    console.log('Loading Browse Books content...');
    
    const contentContainer = document.getElementById('browseBooksContent');
    if (!contentContainer) {
        console.error('browseBooksContent container not found');
        return;
    }
    
    // Check if content is already loaded
    if (contentContainer.innerHTML.trim() !== '') {
        // If content is already loaded, just refresh the books data
        if (typeof window.initializeBrowseBooks === 'function') {
            window.initializeBrowseBooks();
        } else if (typeof window.loadBooks === 'function') {
            window.loadBooks();
        } else {
            console.log('No initialization function found, reloading content');
            contentContainer.innerHTML = '';
            loadBrowseBooksContent();
        }
        return;
    }
    
    // Load the content
    fetch('/student/browsebooks/browsebooks.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            contentContainer.innerHTML = html;
            
            // Add CSS if not already added
            if (!document.querySelector('link[href="/student/browsebooks/browsebooks.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/student/browsebooks/browsebooks.css';
                document.head.appendChild(link);
            }
            
            // Add script manually to ensure it's loaded properly
            const script = document.createElement('script');
            script.src = '/student/browsebooks/browsebooks.js';
            script.onload = function() {
                console.log('Browse Books script loaded successfully');
                if (typeof window.initializeBrowseBooks === 'function') {
                    window.initializeBrowseBooks();
                } else {
                    console.error('Browse Books initialization function not found');
                    // Try to find any loadBooks function
                    if (typeof window.loadBooks === 'function') {
                        window.loadBooks();
                    }
                }
            };
            script.onerror = function() {
                console.error('Failed to load Browse Books script');
                contentContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error loading Browse Books script. Please try again later.</p>
                    </div>
                `;
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Error loading Browse Books content:', error);
            contentContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading Browse Books. Please try again later.</p>
                    <p>Details: ${error.message}</p>
                </div>
            `;
        });
}

// Update the section loading logic in your existing code
// 3. Make sure the API endpoint for borrowed books is correct:

// Check that your server has the correct endpoint for fetching borrowed books. In your mybooks.js file, you're using `/student/borrowed-books`. Make sure this endpoint exists and returns data in the expected format.

// 4. Ensure the loadSection function properly calls loadMyBooksContent:
function loadSection(sectionName) {
    console.log(`Loading section: ${sectionName}`);
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    // Show the selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';    
        // Update active state in sidebar
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.classList.remove('active');
        });
        const sidebarLink = document.querySelector(`.sidebar a[data-target="${sectionName}"]`);
        if (sidebarLink) {
            sidebarLink.classList.add('active');
        } 
        // Load section-specific content
        if (sectionName === 'overview') {
            loadOverviewData();
            loadAvailableBooks(); // Add this line to load available books   
            // Initialize charts if they exist
            if (typeof initializeOverviewCharts === 'function') {
                setTimeout(initializeOverviewCharts, 500);
            }
        } else if (sectionName === 'myBooks') {
            loadMyBooksContent();
        } else if (sectionName === 'browseBooks') {
            loadBrowseBooksContent();
        } else if (sectionName === 'profile') {
            loadProfileData();
        } else if (sectionName === 'penalties') {
            loadPenaltiesContent();
        }
    } else {
        console.error(`Section with ID "${sectionName}-section" not found`);
    }
}

// Update the loadMyBooksContent function to remove old history code
function loadMyBooksContent() {
    console.log('Loading My Books content...');
    // Get the container
    const myBooksContent = document.getElementById('myBooksContent');
    if (!myBooksContent) {
        console.error('My Books content container not found');
        return;
    }
    // Clear any old content that might be showing
    myBooksContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading your books...</div>';
    // First, load the HTML content
    fetch('/student/mybooks/mybooks.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Insert the HTML content
            myBooksContent.innerHTML = html;
            // Add CSS if not already added
            if (!document.querySelector('link[href="/student/mybooks/mybooks.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/student/mybooks/mybooks.css';
                document.head.appendChild(link);
            }   
            if (typeof initializeMyBooks === 'function') {
                // Script already loaded, just initialize
                initializeMyBooks();
            } else {
                console.log('initializeMyBooks function not available, loading script...');
                const script = document.createElement('script');
                script.src = '/student/mybooks/mybooks.js';
                script.onload = function() {
                    console.log('My Books script loaded');
                    if (typeof initializeMyBooks === 'function') {
                        initializeMyBooks();
                    } else {
                        console.error('initializeMyBooks function not available after loading script');
                        myBooksContent.innerHTML = '<div class="error-message">Error loading My Books content. Please refresh the page and try again.</div>';
                    }
                };
                script.onerror = function() {
                    console.error('Failed to load My Books script');
                    myBooksContent.innerHTML = '<div class="error-message">Error loading My Books content. Please refresh the page and try again.</div>';
                };
                document.body.appendChild(script);
            }
        })
        .catch(error => {
            console.error('Error loading My Books HTML content:', error);
            myBooksContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading My Books content. Please try again later.</p>
                    <p>Details: ${error.message}</p>
                </div>
            `;
        });
}
// Add this function to load penalties history
function loadPenaltiesContent() {
    console.log('Loading penalties content...');
    const penaltiesContent = document.getElementById('penaltiesContent');
    if (!penaltiesContent) {
        console.error('Penalties content container not found');
        return;
    }
    penaltiesContent.innerHTML = '<div class="loading-spinner"><i data-lucide="loader" class="spinner-icon"></i><p>Loading penalties...</p></div>';
    // Initialize Lucide icons for the loading spinner
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    fetch('/student/penalties', {
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
        console.log('Penalties data:', data);
        
        if (!data.success || !data.penalties || data.penalties.length === 0) {
            penaltiesContent.innerHTML = `
                <div class="no-penalties">
                    <i data-lucide="check-circle" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>You don't have any penalties.</p>
                </div>
            `;
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        // Display the penalties
        let html = `
            <div class="penalties-header">
                <h1>My Penalties</h1>
            </div>
            <div class="penalties-table-container">
                <table class="penalties-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.penalties.forEach(penalty => {
            const date = new Date(penalty.created_at).toLocaleDateString();
            const status = penalty.paid ? 'Paid' : 'Unpaid';
            const statusClass = penalty.paid ? 'paid' : 'unpaid';   
            html += `
                <tr>
                    <td>${date}</td>
                    <td>$${parseFloat(penalty.amount).toFixed(2)}</td>
                    <td>${penalty.reason || 'Late return'}</td>
                    <td><span class="penalty-status ${statusClass}">${status}</span></td>
                    <td>
                        ${!penalty.paid ? `<button class="pay-btn" onclick="payPenalty(${penalty.id}, ${penalty.amount})">Pay Now</button>` : ''}
                    </td>
                </tr>
            `;
        }); 
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        penaltiesContent.innerHTML = html;
    })
    .catch(error => {
        console.error('Error loading penalties:', error);
        penaltiesContent.innerHTML = `
            <div class="error-message">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                <p>Error loading penalties. Please try again.</p>
            </div>
        `;  
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}
// Add function to pay a penalty
function payPenalty(penaltyId, amount) {
    console.log('Paying penalty:', penaltyId, 'Amount:', amount);
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to pay $${parseFloat(amount).toFixed(2)} for this penalty?`)) {
        return;
    } 
    fetch('/student/pay-penalty', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            penaltyId: penaltyId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('Penalty paid successfully!', 'success');
            // Reload penalties to update the UI
            loadPenaltiesContent();
        } else {
            showToast(`Error: ${data.message || 'Failed to pay penalty.'}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error paying penalty:', error);
        showToast('Error paying penalty. Please try again.', 'error');
    });
}
// Update the loadSection function to include penalties
function loadSection(sectionName) {
    console.log(`Loading section: ${sectionName}`);
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    // Show the selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error(`Section not found: ${sectionName}-section`);
        return;
    }
    
    // Update active state in sidebar
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar a[data-target="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific content
    switch (sectionName) {
        case 'overview':
            loadDashboardData();
            break;
        case 'myBooks':
            loadMyBooksContent();
            break;
        case 'browseBooks':
            loadAvailableBooksContent();
            break;
        case 'history':
            loadHistoryContent();
            break;
        case 'profile':
            loadProfileData();
            break;
        default:
            console.warn(`No specific loader for section: ${sectionName}`);
    }
}
// Make sure all necessary functions are available globally
window.loadSection = loadSection;
window.loadMyBooksContent = loadMyBooksContent;
window.loadBrowseBooksContent = loadBrowseBooksContent;
window.loadProfileData = loadProfileData;
window.loadPenaltiesContent = loadPenaltiesContent;
window.payPenalty = payPenalty;
function loadBorrowedBooks() {
    console.log('Redirecting to loadMyBooksContent...');
    // This function is just a wrapper to maintain backward compatibility
    loadMyBooksContent();
}
// Make sure it's available globally
window.loadBorrowedBooks = loadBorrowedBooks;
// Make sure to expose the initialization function globally at the end of your file
window.initializeHistory = initializeHistory;

function loadHistoryContent() {
    console.log('Loading history content...');
    // Get the container
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) {
        console.error('History content container not found');
        return;
    }
    
    // Set initial opacity for smooth transition
    historyContent.style.opacity = '0';
    
    // Check if content is already loaded to avoid reloading
    if (historyContent.dataset.loaded === 'true') {
        console.log('History content already loaded, just showing it');
        setTimeout(() => {
            historyContent.style.opacity = '1';
        }, 50);
        return;
    }
    
    // Clear any old content and show loading spinner
    historyContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading history...</div>';
    
    // Fade in the loading spinner
    setTimeout(() => {
        historyContent.style.opacity = '1';
    }, 10);
    
    // First, load the HTML content
    fetch('/student/history/history.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Add CSS if not already added
            if (!document.querySelector('link[href="/student/history/history.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/student/history/history.css';
                document.head.appendChild(link);
            }
            
            // Insert the HTML content
            historyContent.innerHTML = html;
            
            // Mark as loaded to prevent duplicate loading
            historyContent.dataset.loaded = 'true';
            
            // Load the JS if not already loaded
            if (typeof window.historyInitialized === 'undefined') {
                const script = document.createElement('script');
                script.src = '/student/history/history.js';
                script.onload = function() {
                    console.log('History script loaded');
                    // Wait a moment for the script to be fully processed
                    setTimeout(() => {
                        if (typeof window.initializeHistory === 'function') {
                            try {
                                window.initializeHistory();
                            } catch (error) {
                                console.error('Error initializing history:', error);
                                historyContent.innerHTML = '<div class="error-message">Error loading history content. Please try again later. <button onclick="loadHistoryContent()" class="retry-btn">Retry</button></div>';
                            }
                        } else {
                            console.error('initializeHistory function not available after loading script');
                            historyContent.innerHTML = '<div class="error-message">Error loading history content. Please try again later. <button onclick="loadHistoryContent()" class="retry-btn">Retry</button></div>';
                        }
                    }, 100);
                };
                document.body.appendChild(script);
            } else {
                // If the script is already loaded, just initialize
                if (typeof window.initializeHistory === 'function') {
                    try {
                        window.initializeHistory();
                    } catch (error) {
                        console.error('Error initializing history:', error);
                        historyContent.innerHTML = '<div class="error-message">Error loading history content. Please try again later. <button onclick="loadHistoryContent()" class="retry-btn">Retry</button></div>';
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error loading history content:', error);
            historyContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load history content. Please try again later.</p>
                    <button onclick="loadHistoryContent()" class="retry-btn">Retry</button>
                </div>
            `;
        });
}

// ... existing code ...
// Make sure it's available globally
window.loadHistoryContent = loadHistoryContent;