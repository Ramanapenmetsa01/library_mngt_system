// DOM Elements
// Replace the beginning of the file with this code
// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('Browse Books script loaded');
    
    // Only initialize if we're on the browse books page
    const booksGrid = document.getElementById('booksGrid');
    const searchInput = document.getElementById('browseSearchInput');
    
    if (booksGrid) {
        console.log('On browse books page, initializing component');
        initializeBrowseBooks();
        
        // Add event listeners only if elements exist
        if (searchInput) {
            searchInput.addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    searchBooks();
                }
            });
        }
    } else {
        console.log('Not on browse books page, skipping initialization');
    }
});

// Keep the rest of your initializeBrowseBooks function
function initializeBrowseBooks() {
    console.log('Initializing Browse Books component');
    
    // Only try to access DOM elements if we're on the browse books page
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) {
        console.log('Not on browse books page, skipping initialization');
        return;
    }
    
    // Remove category option from dropdown
    const searchTypeDropdown = document.getElementById('browseSearchType');
    if (searchTypeDropdown) {
        // Remove the category option
        for (let i = 0; i < searchTypeDropdown.options.length; i++) {
            if (searchTypeDropdown.options[i].value === 'category') {
                searchTypeDropdown.remove(i);
                break;
            }
        }
    }
    
    // Add event listeners for search
    const searchInput = document.getElementById('browseSearchInput');
    if (searchInput) {
        // Add event listener for Enter key
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
        
        // Also trigger search when input changes (after a short delay)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 500);
        });
    }
    
    // Add event listener for search type change
    if (searchTypeDropdown) {
        searchTypeDropdown.addEventListener('change', performSearch);
    }
    
    // Load initial books
    loadBooks();
}

// Add this new function to handle the search
function performSearch() {
    const searchType = document.getElementById('browseSearchType');
    const searchInput = document.getElementById('browseSearchInput');
    
    if (!searchType || !searchInput) {
        console.error('Search elements not found');
        return;
    }
    
    const type = searchType.value;
    const query = searchInput.value.trim();
    
    console.log(`Performing search with type: ${type}, query: ${query}`);
    
    // If search is empty, load all books
    if (!query) {
        loadBooks();
        return;
    }
    
    // Show loading state
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        booksGrid.innerHTML = '<div class="loading-spinner">Searching books...</div>';
    }
    
    // Determine the correct search parameter based on the dropdown selection
    let searchParams = {};
    if (type === 'title') {
        searchParams = { type: 'title', query: query };
    } else if (type === 'author') {
        searchParams = { type: 'author', query: query };
    } else if (type === 'year') {
        searchParams = { type: 'published_year_like', query: query };
    }
    
    // Call loadBooks with search parameters
    loadBooks(searchParams);
}

function loadBooks(searchParams = {}) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) {
        console.error('booksGrid element not found');
        return;
    }
    
    booksGrid.innerHTML = '<div class="loading-spinner">Loading books...</div>';
    
    // Build the URL with search parameters
    let url = '/student/books?available=1';
    if (searchParams.type && searchParams.query) {
        url += `&type=${searchParams.type}&query=${encodeURIComponent(searchParams.query)}`;
    }
    
    console.log('Fetching books with URL:', url);
    
    fetch(url, {
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
            displayBooks(data.books);
        } else {
            console.error('Error loading books:', data.message);
            booksGrid.innerHTML = `<div class="error-message">Error loading books: ${data.message}</div>`;
        }
    })
    .catch(error => {
        console.error('Error fetching books:', error);
        booksGrid.innerHTML = `<div class="error-message">Error loading books: ${error.message}</div>`;
    });
}

// Helper function to format date for datetime-local input
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Function to load books
function loadBooks(searchParams = {}) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) {
        console.error('booksGrid element not found');
        return;
    }
    
    booksGrid.innerHTML = '<div class="loading-spinner">Loading books...</div>';
    
    // Use a single endpoint that matches your existing database structure
    let url = '/student/books'; // Use this endpoint to match your existing API pattern
    
    // Add search parameters if provided
    if (searchParams && searchParams.type && searchParams.query) {
        url += `?type=${searchParams.type}&query=${encodeURIComponent(searchParams.query)}`;
    }
    
    console.log('Fetching books from:', url);
    
    fetch(url, {
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
        
        // Check if the response is JSON before trying to parse it
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Server returned non-JSON response:', contentType);
            return response.text().then(text => {
                console.error('Response body:', text.substring(0, 200) + '...');
                throw new Error('Server returned non-JSON response');
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Books data received:', data);
        
        if (!data || !data.success || !data.books || data.books.length === 0) {
            booksGrid.innerHTML = '<div class="no-books">No books available in the database. Please check back later.</div>';
        } else {
            displayBooks(data.books);
        }
    })
    .catch(error => {
        console.error('Error loading books:', error);
        booksGrid.innerHTML = `<div class="error-message">Error loading books: ${error.message}. Please try again later.</div>`;
    });
}

// Function to open the borrow modal
function openBorrowModal(bookId) {
    console.log('Opening borrow modal for book ID:', bookId);
    
    // Show loading indicator in the modal
    const modal = document.getElementById('borrowModal');
    if (!modal) {
        console.error('Borrow modal element not found');
        return;
    }
    
    modal.style.display = 'block';
    
    const bookDetailsContainer = document.getElementById('bookDetails');
    if (bookDetailsContainer) {
        bookDetailsContainer.innerHTML = '<div class="loading-spinner">Loading book details...</div>';
    }
    
    // Set the book ID on the form
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.dataset.bookId = bookId;
    }
    
    // Set current date and time as the default borrow date
    const now = new Date();
    const borrowDateInput = document.getElementById('borrowDate');
    if (borrowDateInput) {
        // Format current date and time as YYYY-MM-DDThh:mm
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Set the value to current date and time
        borrowDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        borrowDateInput.type = 'datetime-local'; // Change to datetime-local
    }
    
    // Set default return date (14 days from now)
    const returnDate = new Date(now);
    returnDate.setDate(returnDate.getDate() + 14);
    
    const returnDateTimeInput = document.getElementById('returnDateTime');
    if (returnDateTimeInput) {
        // Format return date and time as YYYY-MM-DDThh:mm
        const year = returnDate.getFullYear();
        const month = String(returnDate.getMonth() + 1).padStart(2, '0');
        const day = String(returnDate.getDate()).padStart(2, '0');
        const hours = String(returnDate.getHours()).padStart(2, '0');
        const minutes = String(returnDate.getMinutes()).padStart(2, '0');
        
        returnDateTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        // Set min date to just 1 minute after borrow date
        const minDate = new Date(now);
        minDate.setMinutes(minDate.getMinutes() + 1); // Minimum 1 minute
        
        const maxDate = new Date(now);
        maxDate.setDate(maxDate.getDate() + 14); // Maximum 14 days
        
        // Format min and max dates
        const minYear = minDate.getFullYear();
        const minMonth = String(minDate.getMonth() + 1).padStart(2, '0');
        const minDay = String(minDate.getDate()).padStart(2, '0');
        const minHours = String(minDate.getHours()).padStart(2, '0');
        const minMinutes = String(minDate.getMinutes()).padStart(2, '0');
        
        const maxYear = maxDate.getFullYear();
        const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
        const maxDay = String(maxDate.getDate()).padStart(2, '0');
        const maxHours = String(maxDate.getHours()).padStart(2, '0');
        const maxMinutes = String(maxDate.getMinutes()).padStart(2, '0');
        
        returnDateTimeInput.min = `${minYear}-${minMonth}-${minDay}T${minHours}:${minMinutes}`;
        returnDateTimeInput.max = `${maxYear}-${maxMonth}-${maxDay}T${maxHours}:${maxMinutes}`;
    }
    
    // Try to find the book in the existing books data first
    // This avoids making an API call if we already have the data
    const existingBooks = document.querySelectorAll('.book-card');
    let foundBook = null;
    
    existingBooks.forEach(card => {
        const borrowBtn = card.querySelector('.borrow-btn');
        if (borrowBtn && borrowBtn.getAttribute('onclick') === `openBorrowModal(${bookId})`) {
            // Found the book card, extract data
            const title = card.querySelector('.book-title').textContent;
            const author = card.querySelector('.book-author').textContent.replace('By ', '');
            const yearText = card.querySelector('.book-year').textContent;
            const publishedYear = yearText.replace('Published: ', '');
            const statusElement = card.querySelector('.book-status');
            const isAvailable = statusElement && statusElement.classList.contains('available');
            const coverImg = card.querySelector('.book-cover img');
            const coverImage = coverImg ? coverImg.getAttribute('src') : null;
            
            foundBook = {
                id: bookId,
                title: title,
                author: author,
                published_year: publishedYear,
                available: isAvailable,
                available_copies: isAvailable ? 1 : 0,
                cover_image: coverImage
            };
        }
    });
    
    if (foundBook) {
        console.log('Found book in existing data:', foundBook);
        // Update book details in the modal using the found book
        if (bookDetailsContainer) {
            bookDetailsContainer.innerHTML = `
                <div class="book-image">
                    <img src="${foundBook.cover_image || '/images/book-placeholder.png'}" alt="${foundBook.title}" style="max-width: 150px; max-height: 200px; object-fit: contain;" onerror="this.src='/images/book-placeholder.png'">
                </div>
                <div class="book-info">
                    <h3>${foundBook.title}</h3>
                    <p><strong>Author:</strong> ${foundBook.author || 'Unknown'}</p>
                    <p><strong>Published:</strong> ${foundBook.published_year || 'Unknown'}</p>
                    <p><strong>Available Copies:</strong> ${foundBook.available_copies || 0}</p>
                </div>
            `;
        }
        
        // Update form with book details if needed
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            // Set max quantity to available copies
            quantityInput.max = foundBook.available_copies || 1;
            // Ensure default is 1 or max available if less than 1
            quantityInput.value = Math.min(1, foundBook.available_copies || 0);
            // Disable if no copies available
            quantityInput.disabled = !foundBook.available_copies || foundBook.available_copies < 1;
        }
        
        // Update submit button based on availability
        const submitBtn = document.getElementById('submitBorrow');
        if (submitBtn) {
            submitBtn.disabled = !foundBook.available_copies || foundBook.available_copies < 1;
            if (!foundBook.available_copies || foundBook.available_copies < 1) {
                submitBtn.textContent = 'No Copies Available';
            } else {
                submitBtn.textContent = 'Borrow Book';
            }
        }
        
        return; // Skip the API call since we already have the data
    }
    
    // If we couldn't find the book in existing data, try the API
    // Try the student books endpoint first since that's more likely to work
    console.log(`Fetching book details from: /student/books/${bookId}`);
    
    fetch(`/student/books/${bookId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('Book details response status:', response.status);
        if (!response.ok) {
            // Try alternative endpoint if the first one fails
            console.log('First endpoint failed, trying alternative endpoint');
            return fetch(`/books/${bookId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
        }
        return response;
    })
    .then(response => {
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check content type to handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Server returned non-JSON response:', contentType);
            return response.text().then(text => {
                console.error('Response body:', text.substring(0, 200) + '...');
                throw new Error('Session may have expired. Please refresh the page and try again.');
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Book details response data:', data);
        
        // Handle different response formats
        let book;
        if (data.success && data.book) {
            book = data.book;
        } else if (data.success && data.books && data.books.length > 0) {
            // If the response has a books array, use the first book
            book = data.books.find(b => b.id == bookId) || data.books[0];
        } else if (data.id) {
            // Direct book object
            book = data;
        } else {
            throw new Error('Book data not found in response');
        }
        
        // Update book details in the modal
        if (bookDetailsContainer) {
            bookDetailsContainer.innerHTML = `
                <div class="book-image">
                    <img src="${book.cover_image || '/images/book-placeholder.png'}" alt="${book.title}" onerror="this.src='/images/book-placeholder.png'">
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p><strong>Author:</strong> ${book.author || 'Unknown'}</p>
                    <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                    <p><strong>Available Copies:</strong> ${book.available_copies || 0}</p>
                </div>
            `;
        }
        
        // Update form with book details if needed
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            // Set max quantity to available copies
            quantityInput.max = book.available_copies || 1;
            // Ensure default is 1 or max available if less than 1
            quantityInput.value = Math.min(1, book.available_copies || 0);
            // Disable if no copies available
            quantityInput.disabled = !book.available_copies || book.available_copies < 1;
        }
        
        // Update submit button based on availability
        const submitBtn = document.getElementById('submitBorrow');
        if (submitBtn) {
            submitBtn.disabled = !book.available_copies || book.available_copies < 1;
            if (!book.available_copies || book.available_copies < 1) {
                submitBtn.textContent = 'No Copies Available';
            } else {
                submitBtn.textContent = 'Borrow Book';
            }
        }
    })
    .catch(error => {
        console.error('Error fetching book details:', error);
        if (bookDetailsContainer) {
            // Provide a more user-friendly error message
            bookDetailsContainer.innerHTML = `
                <div class="error-message">
                    <p>Unable to load book details. ${error.message}</p>
                    <p>Try refreshing the page or contact support if the issue persists.</p>
                </div>
            `;
        }
        
        // Enable the form anyway with basic information from the book card
        if (foundBook) {
            // Update submit button to be usable
            const submitBtn = document.getElementById('submitBorrow');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Borrow Book';
            }
        }
    });
}

// Helper function to display book in the modal
function displayBookInModal(book) {
    const bookDetailsContainer = document.getElementById('bookDetails');
    if (!bookDetailsContainer) return;
    
    // Determine if the book is available
    const isAvailable = book.available === undefined ? true : Boolean(book.available);
    
    // Create HTML for book details with proper handling for missing cover image
    let coverHtml;
    if (book.cover_image) {
        coverHtml = `<img src="${book.cover_image}" alt="${book.title}" style="max-width: 150px; max-height: 200px; object-fit: contain;" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'no-image-icon\\'><i class=\\'fas fa-book\\'></i><span>No Cover</span></div>';">`;
    } else {
        coverHtml = `<div class="no-image-icon"><i class="fas fa-book"></i><span>No Cover</span></div>`;
    }
    
    bookDetailsContainer.innerHTML = `
        <div class="modal-book-cover">
            ${coverHtml}
        </div>
        <div class="modal-book-info">
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Published:</strong> ${book.published_year || 'Unknown'}</p>
            <p class="availability-status ${isAvailable ? 'available' : 'unavailable'}">
                <strong>Status:</strong> ${isAvailable ? 'Available' : 'Unavailable'}
            </p>
        </div>
    `;
}

// Function to borrow a book
function borrowBook(bookId, borrowDate, returnDate) {
    // Show loading indicator
    const submitBtn = document.getElementById('submitBorrow');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Processing...';
    }
    
    // Create the borrow request with all necessary fields
    const borrowRequest = {
        bookId: parseInt(bookId),
        borrowDate: borrowDate,
        returnDate: returnDate
    };
    
    console.log('Sending borrow request:', borrowRequest);
    
    // Try the main endpoint with better error handling
    fetch('/student/borrow', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(borrowRequest)
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
        console.log('Borrow response:', data);
        
        if (data.success) {
            showToast('Book borrowed successfully!', 'success');
            closeModal();
            
            // Refresh the books grid to show updated availability
            loadBooks();
            
            // Update the borrowed books count in the dashboard
            updateBorrowedBooksCount();
        } else {
            showToast(data.message || 'Failed to borrow book', 'error');
        }
    })
    .catch(error => {
        console.error('Error borrowing book:', error);
        showToast(error.message || 'An error occurred while borrowing the book', 'error');
    })
    .finally(() => {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Borrow Book';
        }
    });
}

// New function to update book availability in the UI without reloading
function updateBookAvailability(bookId, isAvailable) {
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        const borrowBtn = card.querySelector('.borrow-btn');
        if (borrowBtn && borrowBtn.getAttribute('onclick') === `openBorrowModal(${bookId})`) {
            // Found the book card, update its availability
            const statusElement = card.querySelector('.book-status');
            if (statusElement) {
                statusElement.textContent = isAvailable ? 'Available' : 'Unavailable';
                statusElement.className = `book-status ${isAvailable ? 'available' : 'unavailable'}`;
            }
            
            // Update the borrow button
            borrowBtn.disabled = !isAvailable;
            if (!isAvailable) {
                borrowBtn.textContent = 'Unavailable';
            }
        }
    });
}

// Safe function to update borrowed books count
function updateBorrowedBooksCount() {
    try {
        // Clear cached data to ensure fresh data
        sessionStorage.removeItem('studentOverviewData');
        
        fetch('/student/overview', {
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
            
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.log('Non-JSON response from overview endpoint, skipping update');
                return null;
            }
            
            return response.json();
        })
        .then(data => {
            if (data && data.success) {
                // Update the UI with the overview data
                // Fix: Use the correct element ID 'borrowed-books' instead of 'borrowed-count'
                const borrowedCountEl = document.getElementById('borrowed-books');
                if (borrowedCountEl) {
                    borrowedCountEl.textContent = data.borrowedCount || 0;
                }
                
                // Fix: Use the correct element ID 'due-soon' instead of 'overdue-count'
                const dueSoonEl = document.getElementById('due-soon');
                if (dueSoonEl) {
                    dueSoonEl.textContent = data.dueSoonCount || 0;
                }
                
                // Refresh recent activity if it exists
                if (typeof window.initRecentActivity === 'function') {
                    window.initRecentActivity(false);
                }
            }
        })
        .catch(error => {
            console.error('Error updating borrowed books count:', error);
        });
    } catch (error) {
        console.error('Error in updateBorrowedBooksCount:', error);
    }
}

// Function to display books
function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    
    if (!books || books.length === 0) {
        // Show a more helpful message based on whether we're searching or not
        const searchInput = document.getElementById('browseSearchInput');
        const isSearching = searchInput && searchInput.value.trim() !== '';
        const searchType = document.getElementById('browseSearchType');
        const searchTypeValue = searchType ? searchType.value : '';
        
        if (isSearching) {
            let message = 'No books found matching your search criteria.';
            
            // Add specific guidance for year searches
            if (searchTypeValue === 'year') {
                const query = searchInput.value.trim();
                if (query.length < 4) {
                    message += ' Try entering a complete 4-digit year (e.g., 2020).';
                }
            }
            
            message += ' Try different search terms.';
            booksGrid.innerHTML = `<div class="no-books">${message}</div>`;
        } else {
            booksGrid.innerHTML = '<div class="no-books">No books available in the database. Please check back later.</div>';
        }
        return;
    }
    
    booksGrid.innerHTML = '';
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Check if cover image exists or is valid
        let coverImageHtml;
        if (book.cover_image) {
            coverImageHtml = `<img src="${book.cover_image}" alt="${book.title}" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'no-image-icon\\'><i class=\\'fas fa-book\\'></i><span>No Cover</span></div>';">`;
        } else {
            // Use a book icon when no image is available
            coverImageHtml = `<div class="no-image-icon"><i class="fas fa-book"></i><span>No Cover</span></div>`;
        }
        
        // FIXED: Updated availability check to handle available=1 case
        // Consider a book available if any of these conditions are true:
        // 1. It has an available_quantity property that's greater than 0
        // 2. It has an 'available' property that's truthy (true or 1)
        // 3. It doesn't have either property (assume available by default)
        const hasQuantityProperty = typeof book.available_quantity !== 'undefined';
        const hasAvailableProperty = typeof book.available !== 'undefined';
        
        // Default to available if neither property exists
        let isAvailable = true;
        
        if (hasQuantityProperty && hasAvailableProperty) {
            // If both properties exist, book is available if either condition is true
            isAvailable = (book.available_quantity > 0) || Boolean(book.available);
        } else if (hasQuantityProperty) {
            // If only quantity property exists
            isAvailable = book.available_quantity > 0;
        } else if (hasAvailableProperty) {
            // If only available property exists - convert to boolean (handles both true and 1)
            isAvailable = Boolean(book.available);
        }
        
        // For debugging
        console.log(`Book ${book.id} - ${book.title}: available_quantity=${book.available_quantity}, available=${book.available}, isAvailable=${isAvailable}`);
        
        bookCard.innerHTML = `
            <div class="book-cover">
                ${coverImageHtml}
            </div>
            <div class="book-details">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">By ${book.author}</p>
                <p class="book-year">Published: ${book.published_year || 'Unknown'}</p>
                <span class="book-status ${isAvailable ? 'available' : 'unavailable'}">
                    ${isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <button class="borrow-btn" onclick="openBorrowModal(${book.id})" ${!isAvailable ? 'disabled' : ''}>
                    ${isAvailable ? 'Borrow Book' : 'Unavailable'}
                </button>
            </div>
        `;
        
        booksGrid.appendChild(bookCard);
    });
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('borrowModal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error("Modal not found when trying to close");
    }
}

// Make sure the function is available globally
window.closeModal = closeModal;
window.handleBorrowSubmit = handleBorrowSubmit;
window.openBorrowModal = openBorrowModal;

// Function to handle borrow form submission
function handleBorrowSubmit(event) {
    // Prevent the default form submission which causes page refresh
    event.preventDefault();
    
    console.log("Form submission started");
    
    const form = document.getElementById('borrowForm');
    if (!form) {
        console.error("Borrow form not found");
        showToast('Form not found. Please try again.', 'error');
        return;
    }
    
    const bookId = form.dataset.bookId;
    
    // Check if elements exist before accessing their values
    const borrowDateInput = document.getElementById('borrowDate');
    const returnDateTimeInput = document.getElementById('returnDateTime');
    
    console.log("Form elements check:", {
        form: !!form,
        bookId: bookId,
        borrowDateInput: !!borrowDateInput,
        returnDateTimeInput: !!returnDateTimeInput
    });
    
    if (!bookId) {
        showToast('Book ID is missing. Please try again.', 'error');
        return;
    }
    
    if (!borrowDateInput || !returnDateTimeInput) {
        showToast('Date inputs are missing. Please try again.', 'error');
        return;
    }
    
    // Get values from form
    const borrowDate = borrowDateInput.value;
    const returnDate = returnDateTimeInput.value;
    
    console.log("Form values:", {
        bookId: bookId,
        borrowDate: borrowDate,
        returnDate: returnDate
    });
    
    // Validate dates
    if (!borrowDate || !returnDate) {
        showToast('Please select both borrow and return dates.', 'error');
        return;
    }
    
    // Ensure both dates include time component
    const borrowDateTime = new Date(borrowDate);
    const returnDateTime = new Date(returnDate);
    
    // If borrow date has no time (00:00:00), set it to current time
    if (borrowDateTime.getHours() === 0 && borrowDateTime.getMinutes() === 0 && borrowDateTime.getSeconds() === 0) {
        const now = new Date();
        borrowDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }
    
    // Convert to ISO string format which includes time
    const formattedBorrowDate = borrowDateTime.toISOString();
    const formattedReturnDate = returnDateTime.toISOString();
    
    console.log("Formatted dates:", {
        borrowDate: formattedBorrowDate,
        returnDate: formattedReturnDate
    });
    
    // Call the borrow function with the validated data
    borrowBook(bookId, formattedBorrowDate, formattedReturnDate);
}

// Debounce function to limit how often the search is triggered
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Function to search books - now used for live search
function searchBooks() {
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
    
    // Show loading spinner
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        booksGrid.innerHTML = `
            <div class="loading-spinner">
                <i data-lucide="loader" class="spinner-icon"></i>
                <p>Searching books...</p>
            </div>
        `;
        
        // Initialize Lucide icons for the loading spinner
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Fetch filtered books from the server
    fetch(`/student/books?type=${searchTypeValue}&query=${encodeURIComponent(searchTerm)}`, {
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
        console.log('Search results:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to search books');
        }
        
        displayBooks(data.books);
    })
    .catch(error => {
        console.error('Error searching books:', error);
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Error searching books. Please try again later.</p>
                    <p>${error.message}</p>
                    <button onclick="searchBooks()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    });
}

// Remove the resetSearch function since we're removing the reset button

// Add this function to show toast notifications
function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add this CSS to the top of your browsebooks.js file or in a <style> tag in your HTML
function addToastStyles() {
    if (document.getElementById('toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
        }
        .toast {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 10px;
            color: white;
            font-weight: 500;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        .toast.success {
            background-color: #4caf50;
        }
        .toast.error {
            background-color: #f44336;
        }
        .toast.info {
            background-color: #2196f3;
        }
    `;
    document.head.appendChild(style);
}

// Updated showToast function
function showToast(message, type = 'info') {
    // Add toast styles if not already added
    addToastStyles();
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}
