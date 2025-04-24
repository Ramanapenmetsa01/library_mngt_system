window.bookHistoryData = window.bookHistoryData || [];
window.paymentHistoryData = window.paymentHistoryData || [];
function loadBookHistory() {
    console.log('Loading book history...');
    // Show loading spinner
    const loadingElement = document.getElementById('bookHistoryLoading');
    const emptyElement = document.getElementById('bookHistoryEmpty')
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    if (emptyElement) {
        emptyElement.style.display = 'none';
    }
    // Fetch book history data from server with cache-busting
    const timestamp = new Date().getTime();
    fetch(`/student/book-history?_=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Book history data:', data)   
        // Hide loading spinner
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (!data.success || !data.history || data.history.length === 0) {
            // Show empty state
            if (emptyElement) {
                emptyElement.style.display = 'flex';
            }
            return;
        }
        // Store data globally
        window.bookHistoryData = data.history;
        // Display the data
        displayBookHistory(data.history);
    })
    .catch(error => {
        console.error('Error loading book history:', error);
        
        // Hide loading spinner and show empty state with error
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (emptyElement) {
            emptyElement.style.display = 'flex';
            emptyElement.innerHTML = `
                <i data-lucide="alert-circle" class="empty-icon"></i>
                <p>Error loading book history. Please try again later.</p>
            `;
        }
        
        // Initialize Lucide icons for the error state
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// Display book history data
function displayBookHistory(history) {
    const tableBody = document.getElementById('bookHistoryTableBody');
    if (!tableBody) {
        console.error('Book history table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    history.forEach(item => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = '';
        let statusText = '';
        
        if (item.status === 'returned') {
            if (new Date(item.returnDate) > new Date(item.dueDate)) {
                statusClass = 'status-overdue';
                statusText = 'Returned (Overdue)';
            } else {
                statusClass = 'status-in-time';
                statusText = 'Returned (In-time)';
            }
        } else {
            statusClass = 'status-borrowed';
            statusText = 'Currently Borrowed';
        }
        
        // Format dates
        const borrowedDate = new Date(item.borrowDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let returnDate = 'N/A';
        if (item.returnDate) {
            returnDate = new Date(item.returnDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        row.innerHTML = `
            <td>${item.bookTitle}</td>
            <td>${item.author || 'Unknown'}</td>
            <td>${borrowedDate}</td>
            <td>${returnDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load payment history data
function loadPaymentHistory() {
    console.log('Loading payment history...');
    
    const tableBody = document.getElementById('paymentHistoryTableBody');
    const loadingSpinner = document.getElementById('paymentHistoryLoading');
    const emptyState = document.getElementById('paymentHistoryEmpty');
    
    if (!tableBody) {
        console.error('Payment history table body not found');
        return;
    }
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Clear existing table data
    tableBody.innerHTML = '';
    
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    
    // Fetch payment history data from server
    fetch(`/student/payment-history?_=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Payment history data:', data);
        
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        if (!data.success || !data.payments || data.payments.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        }
        
        // Store data for filtering
        window.paymentHistoryData = data.payments;
        
        // Display the data
        displayPaymentHistory(data.payments);
    })
    .catch(error => {
        console.error('Error loading payment history:', error);
        
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        // Show error message in table
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="error-message">
                    Failed to load payment history. Please try again later.<br>
                    Error: ${error.message}
                </td>
            </tr>
        `;
        
        // Show empty state with error message
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
                <i data-lucide="alert-circle" class="empty-icon"></i>
                <p>Error loading payment history. Please try again later.</p>
            `;
            
            // Initialize Lucide icons for the error state
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    });
}
// Display payment history data
function displayPaymentHistory(payments) {
    console.log('Displaying payment history:', payments);
    const tableBody = document.getElementById('paymentHistoryTableBody');
    if (!tableBody) {
        console.error('Payment history table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!payments || payments.length === 0) {
        const emptyState = document.getElementById('paymentHistoryEmpty');
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        
        // Format date
        const paymentDate = new Date(payment.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Format amount
        const amount = parseFloat(payment.amount).toFixed(2);
        
        // Create description with book title and reason
        let description = payment.description || 'Late return fee';
        if (payment.bookTitle) {
            description = `${description} for "${payment.bookTitle}"`;
        }
        
        // Default status if missing
        let statusClass = 'unpaid';
        let statusText = 'Unpaid';
        if (payment.paid === 1 || 
            payment.paid === true || 
            payment.paid === 'true' || 
            payment.paid === 'paid' || 
            payment.status === 'paid') {
            statusClass = 'paid';
            statusText = 'Paid';
        }
        row.innerHTML = `
        <td>${paymentDate}</td>
        <td>${description}</td>
        <td>$${amount}</td>
        <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
    `;
    
        
        tableBody.appendChild(row);
    });
}

// Filter book history based on search input
function filterBookHistory(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    if (!searchTerm) {
        displayBookHistory(window.bookHistoryData);
        return;
    }
    
    const filteredData = window.bookHistoryData.filter(item => 
        item.bookTitle.toLowerCase().includes(searchTerm) || 
        (item.author && item.author.toLowerCase().includes(searchTerm))
    );
    
    displayBookHistory(filteredData);
    
    // Show empty state if no results
    if (filteredData.length === 0) {
        document.getElementById('bookHistoryEmpty').style.display = 'flex';
        document.getElementById('bookHistoryEmpty').innerHTML = `
            <i data-lucide="search-x" class="empty-icon"></i>
            <p>No results found for "${searchTerm}"</p>
        `;
        
        // Initialize Lucide icons for the empty state
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        document.getElementById('bookHistoryEmpty').style.display = 'none';
    }
}

// Filter payment history based on search input
function filterPaymentHistory(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    if (!searchTerm) {
        displayPaymentHistory(window.paymentHistoryData);
        return;
    }
    
    const filteredData = window.paymentHistoryData.filter(payment => 
        payment.bookTitle.toLowerCase().includes(searchTerm)
    );
    
    displayPaymentHistory(filteredData);
    
    // Show empty state if no results
    if (filteredData.length === 0) {
        document.getElementById('paymentHistoryEmpty').style.display = 'flex';
        document.getElementById('paymentHistoryEmpty').innerHTML = `
            <i data-lucide="search-x" class="empty-icon"></i>
            <p>No results found for "${searchTerm}"</p>
        `;
        
        // Initialize Lucide icons for the empty state
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        document.getElementById('paymentHistoryEmpty').style.display = 'none';
    }
}

// Switch between tabs
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab content
    document.querySelectorAll('.history-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'bookHistory') {
        document.getElementById('bookHistoryTab').classList.add('active');
        document.getElementById('bookHistoryContent').classList.add('active');
        
        // Load book history if not already loaded
        if (window.bookHistoryData.length === 0) {
            loadBookHistory();
        }
    } else {
        document.getElementById('paymentHistoryTab').classList.add('active');
        document.getElementById('paymentHistoryContent').classList.add('active');
        
        // Load payment history if not already loaded
        if (window.paymentHistoryData.length === 0) {
            loadPaymentHistory();
        }
    }
}

// Initialize the history page
// Make the function globally accessible
window.initializeHistory = function() {
    console.log('Initializing history page...');
    
    // Check if already initialized to prevent duplication
    if (window.historyInitialized) {
        console.log('History page already initialized, skipping');
        return;
    }
    
    // Make sure Lucide icons are initialized
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize data arrays if not already done
    window.borrowingHistoryData = window.borrowingHistoryData || [];
    window.paymentHistoryData = window.paymentHistoryData || [];
    
    // Set up tab switching
    setupTabs();
    
    // Load borrowing history for the initial active tab
    loadBorrowingHistory();
    
    // Set up search functionality
    setupSearch();
    
    // Set up filters
    setupFilters();
    
    // Mark as initialized
    window.historyInitialized = true;
};

// Add the missing setupTabs function
function setupTabs() {
    console.log('Setting up history tabs...');
    
    // Get all tab buttons
    const tabs = document.querySelectorAll('.history-tab');
    
    // Add click event listeners to each tab
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log('Tab clicked:', tabName);
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.history-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const selectedContent = document.getElementById(tabName + 'History');
            if (selectedContent) {
                selectedContent.classList.add('active');
                
                // Always load data when switching tabs to ensure fresh data
                if (tabName === 'borrowing') {
                    loadBorrowingHistory();
                } else if (tabName === 'payment') {
                    loadPaymentHistory();
                }
            }
        });
    });
}
// Add the missing setupSearch function
function setupSearch() {
    console.log('Setting up search functionality...');
    
    // Get search inputs
    const borrowingSearch = document.getElementById('borrowing-search');
    const paymentSearch = document.getElementById('payment-search');
    
    // Add event listener to borrowing search
    if (borrowingSearch) {
        borrowingSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            filterBorrowingHistory(searchTerm);
        });
    }
    
    // Add event listener to payment search
    if (paymentSearch) {
        paymentSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            filterPaymentHistory(searchTerm);
        });
    }
}

// Add the missing setupFilters function
function setupFilters() {
    console.log('Setting up filters...');
    
    // Get filter elements
    const statusFilter = document.getElementById('statusFilter');
    const timeFilter = document.getElementById('timeFilter');
    const paymentStatusFilter = document.getElementById('paymentStatusFilter');
    const paymentTimeFilter = document.getElementById('paymentTimeFilter');
    
    // Add event listeners to borrowing filters
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            applyBorrowingFilters();
        });
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            applyBorrowingFilters();
        });
    }
    
    // Add event listeners to payment filters
    if (paymentStatusFilter) {
        paymentStatusFilter.addEventListener('change', function() {
            applyPaymentFilters();
        });
    }
    
    if (paymentTimeFilter) {
        paymentTimeFilter.addEventListener('change', function() {
            applyPaymentFilters();
        });
    }
}

// Filter borrowing history based on search term
function filterBorrowingHistory(searchTerm) {
    if (!window.borrowingHistoryData) return;
    
    const filteredData = window.borrowingHistoryData.filter(item => 
        item.bookTitle.toLowerCase().includes(searchTerm)
    );
    
    displayBorrowingHistory(filteredData);
    
    // Show empty state if no results
    const emptyState = document.getElementById('borrowingHistoryEmpty');
    if (emptyState) {
        if (filteredData.length === 0) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
                <i data-lucide="search-x" class="empty-icon"></i>
                <p>No results found for "${searchTerm}"</p>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// Apply borrowing filters
function applyBorrowingFilters() {
    if (!window.borrowingHistoryData) return;
    
    const statusFilter = document.getElementById('statusFilter');
    const timeFilter = document.getElementById('timeFilter');
    const searchInput = document.getElementById('borrowing-search');
    
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const timeValue = timeFilter ? timeFilter.value : 'all';
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let filteredData = [...window.borrowingHistoryData];
    
    // Apply status filter
    if (statusValue !== 'all') {
        filteredData = filteredData.filter(item => {
            if (statusValue === 'returned' && item.actualReturnDate) {
                return true;
            } else if (statusValue === 'overdue' && !item.actualReturnDate && new Date(item.expectedReturnDate) < new Date()) {
                return true;
            } else if (statusValue === 'active' && !item.actualReturnDate && new Date(item.expectedReturnDate) >= new Date()) {
                return true;
            }
            return false;
        });
    }
    
    // Apply time filter
    if (timeValue !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();
        
        if (timeValue === 'month') {
            cutoffDate.setMonth(now.getMonth() - 1);
        } else if (timeValue === '3months') {
            cutoffDate.setMonth(now.getMonth() - 3);
        } else if (timeValue === '6months') {
            cutoffDate.setMonth(now.getMonth() - 6);
        } else if (timeValue === 'year') {
            cutoffDate.setFullYear(now.getFullYear() - 1);
        }
        
        filteredData = filteredData.filter(item => new Date(item.borrowDate) >= cutoffDate);
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.bookTitle.toLowerCase().includes(searchTerm)
        );
    }
    
    displayBorrowingHistory(filteredData);
    
    // Show empty state if no results
    const emptyState = document.getElementById('borrowingHistoryEmpty');
    if (emptyState) {
        if (filteredData.length === 0) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
                <i data-lucide="filter-x" class="empty-icon"></i>
                <p>No results match your filters</p>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            emptyState.style.display = 'none';
        }
    }
}
// Load borrowing history data
function loadBorrowingHistory() {
    console.log('Loading borrowing history...');
    
    const tableBody = document.getElementById('borrowingHistoryTableBody');
    const loadingSpinner = document.getElementById('borrowingHistoryLoading');
    const emptyState = document.getElementById('borrowingHistoryEmpty');
    
    if (!tableBody) {
        console.error('Borrowing history table body not found');
        return;
    }
    
    // Show loading spinner, hide empty state
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Clear existing table data
    tableBody.innerHTML = '';
    
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    
    // Fetch borrowing history from the server
    fetch(`/student/borrowing-history?_=${timestamp}`, {
        method: 'GET',
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
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        console.log('Borrowing history data:', data);
        
        // Check if we need to transform the data format
        let historyItems = [];
        
        if (data.success && data.history && Array.isArray(data.history)) {
            historyItems = data.history;
        }
        
        // Store data for filtering
        window.borrowingHistoryData = historyItems;
        
        if (historyItems.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        }
        
        // Display the data
        displayBorrowingHistory(historyItems);
    })
    .catch(error => {
        console.error('Error loading borrowing history:', error);
        
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        Failed to load borrowing history. Please try again later.
                    </td>
                </tr>
            `;
        }
    });
}
// Add cache-busting parameter

// Display borrowing history in the table
function displayBorrowingHistory(items) {
    const tableBody = document.getElementById('borrowingHistoryTableBody');
    if (!tableBody) {
        console.error('Borrowing history table body not found');
        return;
    }
    tableBody.innerHTML = '';
    items.forEach(item => {
        const row = document.createElement('tr');
        // Determine status
        let status = 'active';
        if (item.actualReturnDate) {
            status = 'returned';
        } else if (new Date(item.expectedReturnDate) < new Date()) {
            status = 'overdue';
        }
        // Format dates
        const borrowDate = new Date(item.borrowDate).toLocaleDateString();
        const expectedReturnDate = new Date(item.expectedReturnDate).toLocaleDateString();
        const actualReturnDate = item.actualReturnDate ? 
            new Date(item.actualReturnDate).toLocaleDateString() : 
            'Not returned yet';
        row.innerHTML = `
            <td>${item.bookTitle}</td>
            <td>${borrowDate}</td>
            <td>${expectedReturnDate}</td>
            <td>${actualReturnDate}</td>
            <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// View book details (read-only, no return option)

// Self-executing function to ensure everything is initialized properly
(function() {
    // If the document is already loaded, initialize immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(function() {
            if (document.getElementById('borrowingHistoryTab')) {
                window.initializeHistory();
            }
        }, 1);
    } else {
        // Otherwise wait for the DOM to be ready
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('borrowingHistoryTab')) {
                window.initializeHistory();
            }
        });
    }
})();
// View book details
function viewBookDetails(bookId) {
    // Navigate to book details page or show modal
    console.log(`Viewing details for book ID: ${bookId}`);
    // Show a modal with book details
    fetch(`/student/book-details/${bookId}`, {
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
        if (!data.success || !data.book) {
            throw new Error('Book details not found');
        }
        // Create and show modal with book details
        const modal = document.createElement('div');
        modal.className = 'book-details-modal';
        const book = data.book;
        const borrowDate = new Date(book.borrowDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const dueDate = new Date(book.dueDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${book.title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="book-cover">
                        <img src="${book.coverUrl || '/images/default-book-cover.jpg'}" alt="${book.title}">
                    </div>
                    <div class="book-info">
                        <p><strong>Author:</strong> ${book.author}</p>
                        <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                        <p><strong>Borrowed On:</strong> ${borrowDate}</p>
                        <p><strong>Due Date:</strong> ${dueDate}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${book.status}">${book.status.charAt(0).toUpperCase() + book.status.slice(1)}</span></p>
                        ${book.returnDate ? `<p><strong>Returned On:</strong> ${new Date(book.returnDate).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>` : ''}
                        ${book.fineAmount ? `<p><strong>Fine Amount:</strong> $${parseFloat(book.fineAmount).toFixed(2)}</p>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    ${!book.returnDate ? `<button class="action-btn return" data-book-id="${book.id}">Return Book</button>` : ''}
                    <button class="action-btn close">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // Add event listeners for modal actions
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        modal.querySelector('.action-btn.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        const returnButton = modal.querySelector('.action-btn.return');
        if (returnButton) {
            returnButton.addEventListener('click', () => {
                returnBook(book.id);
                document.body.removeChild(modal);
            });
        }       
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    })
    .catch(error => {
        console.error('Error loading book details:', error);
        alert('Failed to load book details. Please try again later.');
    });
}
// Function to handle returning a book

// Add CSS for the modal
function addModalStyles() {
    if (document.getElementById('book-details-modal-styles')) {
        return; // Styles already added
    }
    const styleElement = document.createElement('style');
    styleElement.id = 'book-details-modal-styles';
    styleElement.textContent = `
        .book-details-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background-color: white;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
            color: #1e293b;
        }
        .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #64748b;
        }
        .modal-body {
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        .book-cover {
            flex: 0 0 120px;
        }
        .book-cover img {
            width: 100%;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .book-info {
            flex: 1;
            min-width: 250px;
        }
        .book-info p {
            margin: 8px 0;
            color: #475569;
        }
        .modal-footer {
            padding: 16px 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        @media (max-width: 480px) {
            .modal-body {
                flex-direction: column;
            }
            .book-cover {
                margin: 0 auto;
            }
        }
    `;
    document.head.appendChild(styleElement);
}
window.viewBookDetails = viewBookDetails;
window.returnBook = returnBook;
window.addModalStyles = addModalStyles
addModalStyles();

// Add this function after the applyBorrowingFilters function
function applyPaymentFilters() {
    if (!window.paymentHistoryData) return;
    
    const statusFilter = document.getElementById('paymentStatusFilter');
    const timeFilter = document.getElementById('paymentTimeFilter');
    const searchInput = document.getElementById('payment-search');
    
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const timeValue = timeFilter ? timeFilter.value : 'all';
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    console.log('Applying payment filters:', { statusValue, timeValue, searchTerm });
    
    let filteredData = [...window.paymentHistoryData];
    
    // Apply status filter
    if (statusValue !== 'all') {
        filteredData = filteredData.filter(payment => {
            if (statusValue === 'paid') {
                return payment.paid === 1 || 
                       payment.paid === true || 
                       payment.paid === 'true' || 
                       payment.paid === 'paid' || 
                       payment.status === 'paid';
            } else if (statusValue === 'unpaid') {
                return payment.paid === 0 || 
                       payment.paid === false || 
                       payment.paid === 'false' || 
                       payment.paid === 'unpaid' || 
                       payment.paid === null || 
                       payment.status === 'unpaid';
            }
            return true;
        });
    }
    
    // Apply time filter
    if (timeValue !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();
        
        if (timeValue === 'month') {
            cutoffDate.setMonth(now.getMonth() - 1);
        } else if (timeValue === '3months') {
            cutoffDate.setMonth(now.getMonth() - 3);
        } else if (timeValue === '6months') {
            cutoffDate.setMonth(now.getMonth() - 6);
        } else if (timeValue === 'year') {
            cutoffDate.setFullYear(now.getFullYear() - 1);
        }
        
        filteredData = filteredData.filter(payment => new Date(payment.date) >= cutoffDate);
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredData = filteredData.filter(payment => {
            const description = payment.description || '';
            const bookTitle = payment.bookTitle || '';
            return description.toLowerCase().includes(searchTerm) || 
                   bookTitle.toLowerCase().includes(searchTerm);
        });
    }
    
    // Display filtered data
    displayPaymentHistory(filteredData);
    
    // Show empty state if no results
    const emptyState = document.getElementById('paymentHistoryEmpty');
    if (emptyState) {
        if (filteredData.length === 0) {
            emptyState.style.display = 'flex';
            if (searchTerm) {
                emptyState.innerHTML = `
                    <i data-lucide="search-x" class="empty-icon"></i>
                    <p>No results found for "${searchTerm}"</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <i data-lucide="credit-card" class="empty-icon"></i>
                    <p>No payments found with the selected filters</p>
                `;
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            emptyState.style.display = 'none';
        }
    }
}
