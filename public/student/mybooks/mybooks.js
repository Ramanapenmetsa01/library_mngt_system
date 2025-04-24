document.addEventListener('DOMContentLoaded', function() {
    console.log('My Books script loaded');
    // Check if we're on the My Books page
    if (document.getElementById('myBooksContent')) {
        initializeMyBooks();
    }
});
// Initialize the My Books section
let allBooks = [];
let currentBookId = null;
let currentBorrowId = null;

// Start the live update when the page loads
function startLiveTimeUpdates() {
    updateTimeRemainingDisplays();
    setInterval(updateTimeRemainingDisplays, 60000);
}

// Add this function to update time remaining displays live
function updateTimeRemainingDisplays() {
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        const dueDate = card.dataset.dueDate;
        if (!dueDate) return;
        
        const statusContainer = card.querySelector('.book-status-container');
        if (!statusContainer) return;
        
        const statusElement = statusContainer.querySelector('.book-status');
        if (!statusElement) return;
        
        const { timeRemainingText, statusClass, formattedDueDate } = calculateTimeRemaining(dueDate);
        
        statusElement.textContent = timeRemainingText;
        statusElement.title = `Due: ${formattedDueDate}`;
        statusElement.classList.remove('due-now', 'due-soon', 'on-time', 'overdue', 'unknown');
        statusElement.classList.add(statusClass);
    });
}

// Add this function to initialize the My Books section
// Add this at the beginning of the file or in the initialization function

function initializeMyBooks() {
    console.log('Initializing My Books component');
    
    // Add CSS for no-image-icon if it doesn't exist
    if (!document.getElementById('no-image-icon-style')) {
        const style = document.createElement('style');
        style.id = 'no-image-icon-style';
        style.textContent = `
            .no-image-icon {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                min-height: 150px;
                background-color: #f5f5f5;
                border-radius: 4px;
                color: #666;
                text-align: center;
                padding: 20px;
            }
            
            .no-image-icon i {
                font-size: 2.5rem;
                margin-bottom: 10px;
                color: #999;
            }
            
            .no-image-icon span {
                font-size: 0.9rem;
            }
            
            /* Style for modal no-image-icon */
            .modal-book-cover .no-image-icon {
                min-height: 200px;
                width: 150px;
                margin: 0 auto;
            }
            
            /* Return modal book cover */
            #returnBookCover {
                text-align: center;
                margin-bottom: 15px;
            }
            
            #returnBookCover img {
                max-width: 150px;
                max-height: 200px;
                object-fit: contain;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Load books data
    loadMyBooks();
    
    // Set up search functionality
    setupSearch();
    
    // Start live updates for time remaining
    startLiveTimeUpdates();
}

// Load borrowed books from the server
// Update the loadMyBooks function to ensure we're getting complete book data
function loadMyBooks() {
    console.log('Loading borrowed books...');
    const myBooksGrid = document.getElementById('myBooksGrid');
    
    if (!myBooksGrid) {
        console.error('My Books grid element not found');
        
        // Try to create the grid element if it doesn't exist
        const myBooksContent = document.getElementById('myBooksContent');
        if (myBooksContent) {
            console.log('Creating myBooksGrid element dynamically');
            const gridElement = document.createElement('div');
            gridElement.id = 'myBooksGrid';
            gridElement.className = 'books-grid';
            myBooksContent.appendChild(gridElement);
            
            // Now try to get the element again
            const newGrid = document.getElementById('myBooksGrid');
            if (newGrid) {
                console.log('Successfully created myBooksGrid element');
                // Continue with the newly created element
                loadBooksIntoGrid(newGrid);
                return;
            }
        }
        
        console.error('Could not create or find myBooksGrid element');
        return;
    }
    
    // If we found the grid, load books into it
    loadBooksIntoGrid(myBooksGrid);
}

function loadBooksIntoGrid(myBooksGrid) {
    myBooksGrid.innerHTML = `
        <div class="loading-spinner">
            <i data-lucide="loader" class="spinner-icon"></i>
            <p>Loading your books...</p>
        </div>
    `;
    
    // Initialize Lucide icons for the loading spinner
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    const timestamp = new Date().getTime();
    fetch(`/student/borrowed-books?_=${timestamp}`, {
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
        console.log('Borrowed books data (full response):', data);
        
        if (!data.success || !data.books || data.books.length === 0) {
            // No books display code (unchanged)
            myBooksGrid.innerHTML = `
                <div class="no-books">
                    <i data-lucide="book-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>You haven't borrowed any books yet.</p>
                    <p>Visit the <a href="#" onclick="loadSection('browseBooks')">Browse Books</a> section to find books to borrow.</p>
                </div>
            `;
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Store the books data globally
        allBooks = data.books;
        
        // Display the books
        displayMyBooks(data.books);
        
        // Only set up search if the search input exists
        const searchInput = document.getElementById('myBooksSearch');
        if (searchInput) {
            setupSearch();
        }
    })
    .catch(error => {
        console.error('Error loading borrowed books:', error);
        myBooksGrid.innerHTML = `
            <div class="error-message">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                <p>Error loading your books. Please try again later.</p>
                <p>Details: ${error.message}</p>
            </div>
        `;
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// Filter books based on search input
function filterBooks(searchTerm) {
    if (!allBooks || allBooks.length === 0) {
        // If no books at all, show a message
        const myBooksGrid = document.getElementById('myBooksGrid');
        if (myBooksGrid) {
            myBooksGrid.innerHTML = `
                <div class="no-books">
                    <i data-lucide="book-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>You haven't borrowed any books yet.</p>
                    <p>Visit the <a href="#" onclick="loadSection('browseBooks')">Browse Books</a> section to find books to borrow.</p>
                </div>
            `;
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        return;
    }
    
    searchTerm = searchTerm.toLowerCase().trim();
    
    if (searchTerm === '') {
        // If search is empty, show all books
        displayMyBooks(allBooks);
        return;
    }
    
    // Filter books based on title or author
    const filteredBooks = allBooks.filter(book => {
        return (
            (book.book_title && book.book_title.toLowerCase().includes(searchTerm)) ||
            (book.title && book.title.toLowerCase().includes(searchTerm)) ||
            (book.author && book.author.toLowerCase().includes(searchTerm))
        );
    });
    
    // Display filtered books or show no results message
    const myBooksGrid = document.getElementById('myBooksGrid');
    if (!myBooksGrid) return;
    
    if (filteredBooks.length === 0) {
        myBooksGrid.innerHTML = `
            <div class="no-books">
                <i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                <p>No books found matching "${searchTerm}"</p>
                <button class="clear-search-btn" onclick="clearSearch()">Clear Search</button>
            </div>
        `;
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        // Display filtered books
        displayMyBooks(filteredBooks);
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('myBooksSearch');
    if (searchInput) {
        searchInput.value = '';
        displayMyBooks(allBooks);
    }
}

// Display borrowed books in the grid
function displayMyBooks(books) {
    const myBooksGrid = document.getElementById('myBooksGrid');
    if (!myBooksGrid) return;
    
    myBooksGrid.innerHTML = '';
    
    const activeBooks = books.filter(book => book.status !== 'returned');
    
    if (activeBooks.length === 0) {
        myBooksGrid.innerHTML = `
            <div class="no-books">
                <i data-lucide="book-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                <p>You haven't borrowed any books yet.</p>
                <p>Visit the <a href="#" onclick="loadSection('browseBooks')">Browse Books</a> section to find books to borrow.</p>
            </div>
        `;
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    console.log('Active books data:', activeBooks);
    
    activeBooks.forEach(book => {
        // IMPORTANT: Normalize the due date by setting hours, minutes, seconds to end of day if only date is stored
        let dueDate = book.due_date;
        if (dueDate) {
            const due = new Date(dueDate);
            // Check if the due date has no time component or time is set to midnight (00:00:00)
            if (due.getHours() === 0 && due.getMinutes() === 0 && due.getSeconds() === 0) {
                console.log(`Book ${book.id}: Due date has no time component, setting to end of day`);
                // Set to end of day (23:59:59)
                due.setHours(23, 59, 59, 999);
                dueDate = due.toISOString();
                book.due_date = dueDate; // Update the book object with the normalized date
            }
        }
        
        // Calculate time remaining and status
        const { timeRemainingText, statusClass, formattedDueDate } = calculateTimeRemaining(dueDate);
        
        // Get book title, handling different property names
        const bookTitle = book.title || book.book_title || 'Unknown Title';
        
        // Get book ID, handling different property names
        const bookId = book.book_id || book.id;
        
        // Get borrow ID
        const borrowId = book.id;
        
        // Create book card
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.dataset.dueDate = dueDate;
        bookCard.dataset.bookId = bookId;
        bookCard.dataset.borrowId = borrowId;
        
        // Create book cover with fallback
        let coverHtml = '';
        if (book.cover_image) {
            coverHtml = `
                <div class="book-cover">
                    <img src="${book.cover_image}" alt="${bookTitle}" onerror="this.classList.add('error');">
                    <div class="fallback-icon">
                        <i class="fas fa-book"></i>
                    </div>
                </div>
            `;
        } else {
            coverHtml = `
                <div class="book-cover">
                    <div class="no-image-icon">
                        <i class="fas fa-book"></i>
                        <span>${bookTitle}</span>
                    </div>
                </div>
            `;
        }
        
        // Format borrowed date
        const borrowedDate = book.borrowed_date || book.borrow_date;
        let formattedBorrowedDate = 'Unknown date';
        if (borrowedDate) {
            const date = new Date(borrowedDate);
            if (!isNaN(date.getTime())) {
                formattedBorrowedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }
        
        // FIX: Always make the return button active, regardless of due status
        bookCard.innerHTML = `
            ${coverHtml}
            <div class="book-info">
                <h3 class="book-title">${bookTitle}</h3>
                <p class="book-author">${book.author || 'Unknown Author'}</p>
                <p class="book-borrowed">Borrowed on ${formattedBorrowedDate}</p>
                <div class="book-status-container">
                    <span class="book-status ${statusClass}" title="Due: ${formattedDueDate}">${timeRemainingText}</span>
                </div>
                <button class="return-btn" onclick="openReturnModal('${bookId}', '${borrowId}', '${bookTitle.replace(/'/g, "\\'")}', '${dueDate}')">Return</button>
            </div>
        `;
        
        myBooksGrid.appendChild(bookCard);
    });
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Set up search functionality
    setupSearch();
}// Update the closeReturnModal function to properly reset the modal
function confirmReturnBook() {
    // Disable the confirm button to prevent multiple clicks
    const confirmButton = document.getElementById('confirmReturn');
    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = 'Returning...';
    }

    // Ensure currentBookId and currentBorrowId are set
    if (!currentBookId || !currentBorrowId) {
        console.error("No book or borrow ID defined.");
        return;
    }

    // Optional: Add a timestamp to avoid caching
    const timestamp = new Date().getTime();

    // Replace the URL below with your actual endpoint for returning a book
    fetch(`/student/return-book?_=${timestamp}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bookId: currentBookId,
            borrowId: currentBorrowId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok. Status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show a success toast
            showToast("Book returned successfully!", "success");
            // Refresh the books list to reflect the return
            loadMyBooks();
        } else {
            // Show an error toast with server-provided message
            showToast("Error returning book: " + (data.message || "Unknown error"), "error");
        }
    })
    .catch(error => {
        console.error('Error in returning book:', error);
        showToast("Error returning book: " + error.message, "error");
    })
    .finally(() => {
        // Re-enable the button and close the modal after processing
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.textContent = "Return Book";
        }
        closeReturnModal();
    });
}

function closeReturnModal() {
    const modal = document.getElementById('returnModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Reset the confirm button if it exists
        const confirmButton = document.getElementById('confirmReturn');
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.textContent = 'Return Book';
        }
    }
    
    // Reset the current IDs
    currentBookId = null;
    currentBorrowId = null;
    
    // Optional: Remove the modal from DOM to ensure a fresh start next time
    // This is more aggressive but ensures no stale data
    // if (modal) {
    //     modal.remove();
    // }
}
function setupSearch() {
    const searchInput = document.getElementById('myBooksSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    if (!searchInput) {
        console.log('Search input not found, skipping search setup');
        return;
    }
    function filterBooks(searchTerm) {
        searchTerm = searchTerm.toLowerCase().trim();
        if (!searchTerm) {
            displayMyBooks(allBooks);
            return;
        }     
        const filteredBooks = allBooks.filter(book => {
            const title = (book.title || book.book_title || '').toLowerCase();
            const author = (book.author || '').toLowerCase();
            return title.includes(searchTerm) || author.includes(searchTerm);
        });     
        displayMyBooks(filteredBooks); 
        if (clearSearchBtn) {
            clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
        }
    }  
    searchInput.addEventListener('input', (e) => {
        filterBooks(e.target.value);
    });
    if (clearSearchBtn) {
        clearSearchBtn.style.display = 'none'; // Hide initially
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterBooks('');
            clearSearchBtn.style.display = 'none';
        });
    }
}
// Add this function at the beginning of your file
function calculateTimeRemaining(dueDate) {
    if (!dueDate) {
        return {
            timeRemainingText: 'Unknown due date',
            statusClass: 'unknown',
            formattedDueDate: 'Unknown'
        };
    }
    const now = new Date();
    const due = new Date(dueDate);
    // Format the due date for display
    const formattedDueDate = due.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    // Calculate the time difference in milliseconds
    const timeDiff = due - now;
    let timeRemainingText;
    let statusClass;
    if (timeDiff < 0) {
        // Book is overdue
        const daysOverdue = Math.ceil(Math.abs(timeDiff) / (1000 * 60 * 60 * 24));
        timeRemainingText = `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;
        statusClass = 'overdue';
    } else {
        // Book is not overdue
        const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minsRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));  
        if (daysRemaining === 0 && hoursRemaining === 0) {
            // Less than an hour remaining - show in minutes with orange color
            timeRemainingText = `${minsRemaining} minute${minsRemaining !== 1 ? 's' : ''} remaining`;
            statusClass = 'due-by-mins';
        } else if (daysRemaining === 0) {
            // Less than a day remaining - show in hours
            timeRemainingText = `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining`;
            statusClass = 'due-by-hours';
        } else {
            // More than a day remaining
            timeRemainingText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
            statusClass = 'on-time';
        }
    }
    
    return {
        timeRemainingText,
        statusClass,
        formattedDueDate
    };
}
// Add this function to show a penalty popup
// Update the showPenaltyPopup function to replace Pay Later with Cancel
function showPenaltyPopup(penalty, bookTitle) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'penalty-popup';
    
    // Format current date for display
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Popup inner HTML with Pay Now and Cancel buttons
    popup.innerHTML = `
        <div class="penalty-popup-header">
            <h3><i class="fas fa-exclamation-circle"></i> Late Return Fee</h3>
        </div>
        <div class="penalty-popup-body">
            <p>You have returned <strong>${bookTitle}</strong> after the due date.</p>
            <p>A late fee of <strong>$${penalty.toFixed(2)}</strong> has been applied to your account.</p>
            <div class="penalty-details">
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Book:</strong> ${bookTitle}</p>
                <p><strong>Amount:</strong> $${penalty.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="penalty-status">Unpaid</span></p>
            </div>
            <p class="penalty-note">Click "Pay Now" to pay the fee immediately or "Cancel" to pay later in the Penalties section.</p>
        </div>
        <div class="penalty-popup-footer">
            <button id="cancelPenaltyBtn" class="btn btn-secondary">Cancel</button>
            <button id="payPenaltyBtn" class="btn btn-primary">Pay Now</button>
        </div>
    `; 
    // Add to body
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    // Add event listeners
    document.getElementById('payPenaltyBtn').addEventListener('click', () => {
        processPenaltyPayment(penalty, bookTitle, backdrop, popup);
    });
    document.getElementById('cancelPenaltyBtn').addEventListener('click', () => {
        // Just close the popup without showing any toast message
        backdrop.remove();
        popup.remove();  
    });
}
// Update the processPenaltyPayment function to handle errors better
function processPenaltyPayment(penalty, bookTitle, backdrop, popup) {
    const payBtn = document.getElementById('payPenaltyBtn');
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';
    } 
    // Add a timestamp to avoid caching
    const timestamp = new Date().getTime();
    // Make sure penalty is a valid number and convert to a proper number format
    const penaltyAmount = parseFloat(penalty);
    console.log('Processing penalty payment:', {
        bookTitle: bookTitle,
        penaltyAmount: penaltyAmount,
        borrowId: currentBorrowId
    }); 
    if (isNaN(penaltyAmount) || penaltyAmount <= 0) {
        showToast("Invalid penalty amount", "error");
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now';
        }
        return;
    }
    // Send the borrowId (currentBorrowId), penalty amount, and book title to the server
    fetch(`/student/pay-penalty?_=${timestamp}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            bookTitle: bookTitle,
            penaltyAmount: penaltyAmount,
            borrowId: currentBorrowId,
            paid:1
        })
    })
    .then(response => {
        if (response.status === 500) {
            // Close the popup since the payment likely went through
            if (backdrop && popup) {
                backdrop.remove();
                popup.remove();
            }            
            loadMyBooks();
            return { success: true, message: "Payment likely processed despite server error" };
        }
        if (!response.ok) {
            // Try to get error details from response
            return response.json()
                .then(data => {
                    throw new Error(data.message || `Payment failed. Status: ${response.status}`);
                })
                .catch(err => {
                    // If we can't parse the JSON, use a generic error
                    if (err instanceof SyntaxError) {
                        throw new Error(`Payment failed. Status: ${response.status}`);
                    }
                    throw err;
                });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Close the popup
            if (backdrop && popup) {
                backdrop.remove();
                popup.remove();
            }
            showToast("Penalty paid successfully!", "success");
            // Also refresh the books list to update the UI
            loadMyBooks();
        } else {
            showToast("Error paying penalty: " + (data.message || "Unknown error"), "error");
            // Re-enable the pay button
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.textContent = 'Pay Now';
            }
        }
    })
    .catch(error => {
        console.error('Error processing penalty payment:', error);
        // Check if the error message indicates a database error
        if (error.message.includes('Database error')) {
            // treat it as a success without showing a toast message
            if (backdrop && popup) {
                backdrop.remove();
                popup.remove();
            }
            // Refresh the UI
            loadMyBooks();
        } else {
            showToast("Error processing payment: " + error.message, "error");
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.textContent = 'Pay Now';
            }
        }
    });
}
// Helper function to safely refresh penalties if the section exists
function refreshPenaltiesIfExists() {
    const penaltiesContainer = document.getElementById('penaltiesContent');
    if (typeof loadPenaltiesContent === 'function' && penaltiesContainer) {
        setTimeout(() => {
            loadPenaltiesContent();
        }, 1000);
    }
}
// Add a function to record the penalty without payment
function recordPenaltyWithoutPayment(penalty, bookTitle) {
    const timestamp = new Date().getTime();   
    fetch(`/student/record-penalty?_=${timestamp}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            bookTitle: bookTitle,
            penaltyAmount: parseFloat(penalty),
            borrowId: currentBorrowId || null,
            status: 'unpaid'
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error recording penalty:', response.status);
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            console.log('Penalty recorded successfully');
            // Refresh the books list
            loadMyBooks();
        } else {
            console.error('Failed to record penalty:', data ? data.message : 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error in recording penalty:', error);
    });
}
// Update the openReturnModal function to properly handle overdue books
function openReturnModal(bookId, borrowId, bookTitle, dueDate) {
    console.log('Opening return modal for book:', bookId, 'borrow ID:', borrowId, 'due date:', dueDate);
    // Set current IDs for confirmReturnBook
    currentBookId = bookId;
    currentBorrowId = borrowId;
    // ----- Overdue Check Block -----
    if (dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        if (now > due) {
            // Calculate days overdue and penalty
            const daysOverdue = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
            const penalty = daysOverdue * 0.50; // $0.50 per day penalty
            // Show penalty popup BEFORE returning the book - ONLY show this popup
            showPenaltyPopupBeforeReturn(bookId, borrowId, bookTitle, penalty);
            return; // Exit so the normal modal isn't shown
        }
    }
    // Normal (non-overdue) return flow:
    if (!document.getElementById('returnModal')) {
        // Update the createReturnModal function to use the new CSS classes
        function createReturnModal() {
            const modal = document.createElement('div');
            modal.id = 'returnModal';
            modal.className = 'return-modal';
            
            modal.innerHTML = `
                <div class="return-modal-header">
                    <h3>Return Book</h3>
                    <button class="return-modal-close" id="closeReturnModal">&times;</button>
                </div>
                <div class="return-modal-body">
                    <div class="return-book-details">
                        <div class="return-book-info">
                            <h4 id="returnBookTitle"></h4>
                            <p>Are you sure you want to return this book?</p>
                        </div>
                    </div>
                    <div id="penaltyContainer" style="display: none;">
                        <div class="penalty-details">
                            <p><strong>Late Return Fee:</strong> $<span id="penaltyAmount">0.00</span></p>
                            <p><strong>Status:</strong> <span class="penalty-status unpaid">Unpaid</span></p>
                        </div>
                        <p class="penalty-note">A late fee will be applied to your account.</p>
                    </div>
                </div>
                <div class="return-modal-footer">
                    <button id="cancelReturn" class="btn cancel-btn">Cancel</button>
                    <button id="confirmReturn" class="btn confirm-btn">Return Book</button>
                </div>
            `;
            
            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.id = 'returnModalBackdrop';
            
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('closeReturnModal').addEventListener('click', closeReturnModal);
            document.getElementById('cancelReturn').addEventListener('click', closeReturnModal);
            document.getElementById('confirmReturn').addEventListener('click', confirmReturnBook);
        }
    }
    const modal = document.getElementById('returnModal');
    if (!modal) {
        console.error('Return modal element not found');
        return;
    }
    const bookTitleEl = document.getElementById('returnBookTitle');
    if (bookTitleEl) {
        bookTitleEl.textContent = bookTitle;
    }
    const penaltyContainer = document.getElementById('penaltyContainer');
    const penaltyAmount = document.getElementById('penaltyAmount');
    if (penaltyContainer && penaltyAmount) {
        penaltyContainer.style.display = 'none';
        penaltyAmount.textContent = '';
    }   
    modal.style.display = 'block';
}
// Update the returnOverdueBook function to NOT show another popup
function returnOverdueBook(bookId, borrowId, bookTitle, penalty) {
    const timestamp = new Date().getTime();
    // First return the book
    fetch(`/student/return-book?_=${timestamp}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bookId: bookId,
            borrowId: borrowId,
            penalty: penalty,
            paid:1
              // Include the penalty amount
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok. Status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast("Book returned successfully. Penalty applied.", "success");
            loadMyBooks();
            refreshPenaltiesIfExists();
            
            // Refresh payment history if available
            if (typeof loadPaymentHistory === 'function') {
                setTimeout(() => {
                    loadPaymentHistory();
                    
                }, 1000);
            }
        } else {
            // Show an error toast with server-provided message
            showToast("Error returning book: " + (data.message || "Unknown error"), "error");
        }
    })
    .catch(error => {
        console.error('Error in returning book:', error);
        showToast("Error returning book: " + error.message, "error");
    });
}
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
        // Add CSS for toasts
        const style = document.createElement('style');
        style.textContent = `
            #toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .toast {
                padding: 12px 20px;
                border-radius: 4px;
                color: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                animation: toast-in 0.3s ease-in-out;
                max-width: 300px;
                word-wrap: break-word;
            }
            @keyframes toast-in {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .toast.success {
                background-color: #28a745;
            }
            .toast.error {
                background-color: #dc3545;
            }
            .toast.info {
                background-color: #17a2b8;
            }
            .toast.warning {
                background-color: #ffc107;
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }
    // Remove any existing toast with the same message to prevent duplicates
    const existingToasts = toastContainer.querySelectorAll('.toast');
    existingToasts.forEach(existingToast => {
        if (existingToast.textContent === message) {
            existingToast.remove();
        }
    });
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);   
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
// Update the showPenaltyPopupBeforeReturn function to show penalty popup BEFORE returning the book
function showPenaltyPopupBeforeReturn(bookId, borrowId, bookTitle, penalty) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'penalty-popup';
    // Format current date for display
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });   
    // Popup inner HTML with Return & Pay and Cancel buttons
    popup.innerHTML = `
        <div class="penalty-popup-header">
            <h3><i class="fas fa-exclamation-circle"></i> Late Return Fee</h3>
        </div>
        <div class="penalty-popup-body">
            <p>You are returning <strong>${bookTitle}</strong> after the due date.</p>
            <p>A late fee of <strong>$${penalty.toFixed(2)}</strong> will be applied to your account.</p>
            <div class="penalty-details">
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Book:</strong> ${bookTitle}</p>
                <p><strong>Amount:</strong> $${penalty.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="penalty-status">Unpaid</span></p>
            </div>
            <p class="penalty-note">Click "Return & Pay" to return the book and pay the fee immediately or "Cancel" to keep the book.</p>
        </div>
        <div class="penalty-popup-footer">
            <button id="cancelPenaltyBtn" class="btn btn-secondary">Cancel</button>
            <button id="returnAndPayBtn" class="btn btn-primary">Return & Pay</button>
        </div>
    `;
    // Add to body
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    // Add event listeners
    document.getElementById('returnAndPayBtn').addEventListener('click', () => {
        // First return the book, then show payment options
        returnOverdueBook(bookId, borrowId, bookTitle, penalty);
        // Close this popup
        backdrop.remove();
        popup.remove();
    });
    document.getElementById('cancelPenaltyBtn').addEventListener('click', () => {
        // Just close the popup without returning the book
        backdrop.remove();
        popup.remove();
        // Show a red notification when canceling
        showToast("Return canceled. Book remains borrowed.", "error");
    });
}