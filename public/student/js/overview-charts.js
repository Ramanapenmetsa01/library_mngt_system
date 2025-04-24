// Student Dashboard Overview Charts
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in overview-charts.js');
    // Initialize charts if we're on the overview page
    if (document.getElementById('reading-progress-chart') || 
        document.getElementById('recent-activity-list')) {
        console.log('Chart elements found, initializing...');
        initializeOverviewCharts();
    }
});

// Initialize all overview charts and data
function initializeOverviewCharts() {
    console.log('Initializing overview charts...');
    
    // Initialize reading progress chart
    if (document.getElementById('reading-progress-chart')) {
        initReadingProgressChart();
    }
    
    // Initialize recent activity
    if (document.getElementById('recent-activity-list')) {
        initRecentActivity();
    }

    // Call the debugging function
    debugOverviewData();

    // Set up refresh interval (every 60 seconds)
    setInterval(function() {
        console.log('Refreshing chart data...');
        if (document.getElementById('reading-progress-chart')) {
            initReadingProgressChart(false); // Don't show loading indicator on refresh
        }

        console.log('Refreshing activity data...');
        if (document.getElementById('recent-activity-list')) {
            initRecentActivity(false); // Don't show loading indicator on refresh
        }
    }, 60000);
}


// Fetch latest data from server
// Update the fetchLatestData function to ensure we're getting fresh data
function fetchLatestData() {
    console.log('Fetching latest data from server...');
    
    // Check if we have cached data
    const cachedData = sessionStorage.getItem('studentOverviewData');
    if (cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            const cacheTime = parsedData.timestamp || 0;
            const now = new Date().getTime();
            
            // Use cached data if it's less than 5 minutes old
            if (now - cacheTime < 5 * 60 * 1000) {
                console.log('Using cached data from', new Date(cacheTime));
                return Promise.resolve(parsedData.data);
            }
        } catch (e) {
            console.error('Error parsing cached data:', e);
            // Continue to fetch fresh data
        }
    }
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    return fetch(`/student/overview?_=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('DEBUG - Raw overview data:', data);
        console.log('DEBUG - Books data:', {
            borrowedBooks: data.borrowedBooks || [],
            returnedBooks: data.returnedBooks || [],
            borrowedCount: data.borrowedCount || 0
        });
        
        // Ensure chartData has the correct structure
        if (!data.chartData) {
            data.chartData = {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [{
                    label: 'Books Borrowed',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            };
        }
        
        // Cache the data with timestamp
        const cacheData = {
            timestamp: new Date().getTime(),
            data: data
        };
        sessionStorage.setItem('studentOverviewData', JSON.stringify(cacheData));
        
        console.log('Fresh data fetched and cached');
        return data;
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        
        // Return default data structure on error
        return {
            success: false,
            error: error.message,
            borrowedBooks: [],
            returnedBooks: [],
            borrowedCount: 0,
            returnedCount: 0,
            dueSoonCount: 0,
            overdueCount: 0,
            chartData: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [{
                    label: 'Books Borrowed',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            }
        };
    });
}

// Reading Progress Chart
// In the initReadingProgressChart function, update the chart data generation for days view
// Update the initReadingProgressChart function to create a line graph instead of a bar graph
function initReadingProgressChart(showLoading = true) {
    console.log('Initializing reading progress chart...');
    const chartContainer = document.getElementById('reading-progress-chart-container');
    
    if (!chartContainer) {
        console.error('Chart container not found');
        return;
    }
    
    if (showLoading) {
        chartContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading chart data...</p></div>';
    }
    
    // Fetch the latest data
    fetchLatestData()
        .then(data => {
            console.log('Chart data received:', data.chartData);
            
            // Clear the container and create a new canvas
            chartContainer.innerHTML = '';
            const canvas = document.createElement('canvas');
            canvas.id = 'borrowing-chart';
            // Use the container's clientWidth; if 0, fallback to 300
            canvas.width = chartContainer.clientWidth || 300;
            canvas.height = 250;
            canvas.style.width = '100%';
            canvas.style.height = '250px';
            canvas.style.display = 'block';
            chartContainer.appendChild(canvas);
            
            // Log canvas dimensions for debugging
            console.log('Canvas dimensions:', {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight
            });
            
            // Get the canvas context
            const ctx = canvas.getContext('2d');
            
            // Ensure we have valid chart data
            if (!data.chartData || !data.chartData.labels || !data.chartData.datasets) {
                console.error('Invalid chart data structure:', data.chartData);
                chartContainer.innerHTML = '<div class="error-message">Error: Invalid chart data</div>';
                return;
            }
            
            // Destroy existing chart if exists
            if (window.borrowingChart) {
                window.borrowingChart.destroy();
            }
            
            // Update the dataset for a line chart (optional: adjust line tension, remove fill, etc.)
            const updatedDataset = {
                ...data.chartData.datasets[0],
                fill: true,       // Do not fill the area under the line
                tension: 0.4,      // Slight curve to the line
                borderWidth: 2     // Thicker line for better visibility
            };
            
            const updatedChartData = {
                labels: data.chartData.labels,
                datasets: [updatedDataset]
            };
            
            // Create the chart as a line graph
            window.borrowingChart = new Chart(ctx, {
                type: 'line', // Changed from 'bar' to 'line'
                data: updatedChartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x:{
                            grid:{
                                display: true
                            },

                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            },
                            grid:{
                                display: false
                            },
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
            
            // Force a resize to ensure proper rendering
            setTimeout(() => {
                if (window.borrowingChart) {
                    window.borrowingChart.resize();
                    console.log('Chart resized successfully');
                }
            }, 100);
        })
        .catch(error => {
            console.error('Error initializing chart:', error);
            chartContainer.innerHTML = `
                <div class="error-message">
                    <p>Error loading chart data. Please try again later.</p>
                    <button onclick="initReadingProgressChart()" class="retry-btn">Retry</button>
                </div>
            `;
        });
}



// Helper function to show no data message
function showNoDataMessage(container, message) {
    if (!container) return;
    
    // Remove any existing no-data message first
    const existingNoData = container.querySelector('.no-data-message');
    if (existingNoData) {
        existingNoData.remove();
    }
    
    const noDataMessage = document.createElement('div');
    noDataMessage.className = 'no-data-message';
    noDataMessage.textContent = message;
    container.appendChild(noDataMessage);
    
    // Position the message in the center of the chart
    noDataMessage.style.position = 'absolute';
    noDataMessage.style.top = '50%';
    noDataMessage.style.left = '50%';
    noDataMessage.style.transform = 'translate(-50%, -50%)';
    noDataMessage.style.textAlign = 'center';
    noDataMessage.style.color = '#666';
    noDataMessage.style.width = '80%';
    
    // Make sure the container has position relative
    container.style.position = 'relative';
}

// Recent Activity
function initRecentActivity(showLoading = true) {
    console.log('Initializing recent activity...');
    const activityList = document.getElementById('recent-activity-list');
    
    if (!activityList) {
        console.error('Recent activity list element not found!');
        return;
    }
    
    if (showLoading) {
        activityList.innerHTML = '<div class="loading-spinner">Loading activity...</div>';
    }
    
    // Clear cached data to ensure fresh data
    sessionStorage.removeItem('studentOverviewData');
    
    fetchLatestData()
    .then(data => {
        console.log('Activity data received:', data);
        
        // Generate activity data
        const activities = generateRecentActivityData(data);
        
        // Display activities
        if (activities.length === 0) {
            activityList.innerHTML = '<div class="no-activity">No recent activity to display.</div>';
            return;
        }
        
        activityList.innerHTML = '';
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = `activity-item ${activity.type}`;
            
            // Use the formatActivityTimestamp function
            const formattedTime = formatActivityTimestamp(activity.timestamp);
            
            // Get the appropriate icon for the activity type
            const icon = getActivityIcon(activity.type);
            
            // Updated to use Lucide icons instead of Font Awesome
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-description">${activity.description}</p>
                    <p class="activity-time">${formattedTime}</p>
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
        
        // Initialize Lucide icons for the newly added content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            console.error('Lucide library not available for icons');
        }
    })
    .catch(error => {
        console.error('Error loading activity data:', error);
        activityList.innerHTML = '<div class="error-message">Error loading activity data.</div>';
    });
}

// Helper function to generate recent activity data
function generateRecentActivityData(data) {
    const activities = [];
    const borrowedBooks = data.borrowedBooks || [];
    const returnedBooks = data.returnedBooks || [];
    const borrowedCount = data.borrowedCount || 0;
    const dueSoonCount = data.dueSoonCount || 0;
    const overdueCount = data.overdueCount || 0;
    
    console.log('Generating activity data with:', {
        borrowedBooks: borrowedBooks.length,
        returnedBooks: returnedBooks.length,
        borrowedCount,
        dueSoonCount,
        overdueCount
    });
    
    // Add login activity with accurate timestamp
    const loginTime = new Date();
    activities.push({
        type: 'login',
        description: 'You logged into the library system',
        timestamp: loginTime.toISOString()
    });
    
    // If we have actual borrowed books data, use it
    if (borrowedBooks && borrowedBooks.length > 0) {
        console.log('Adding borrowed books to activity:', borrowedBooks);
        
        // Sort borrowed books by date, newest first
        const sortedBooks = [...borrowedBooks].sort((a, b) => 
            new Date(b.borrow_date || 0) - new Date(a.borrow_date || 0)
        );
        
        // Add each borrowed book as a separate activity (up to 4 to leave room for login activity)
        sortedBooks.slice(0, 4).forEach(book => {
            activities.push({
                type: 'borrow',
                description: `You borrowed "${book.title || 'a book'}"`,
                timestamp: book.borrow_date || new Date().toISOString()
            });
        });
    } 
    // If we don't have book details but know the count, create a single summary entry
    else if (borrowedCount > 0) {
        console.log('No detailed book data available, creating summary entry');
        
        // Create a single summary entry instead of fake individual entries
        activities.push({
            type: 'borrow',
            description: `You have ${borrowedCount} borrowed book${borrowedCount !== 1 ? 's' : ''}`,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        });
    }
    
    // Add returned books if available (up to 2 to keep total activities manageable)
    if (returnedBooks && returnedBooks.length > 0) {
        console.log('Adding returned books to activity:', returnedBooks);
        
        // Sort returned books by date, newest first
        const sortedReturned = [...returnedBooks].sort((a, b) => 
            new Date(b.return_date || 0) - new Date(a.return_date || 0)
        );
        
        // Add up to 2 most recent returned books
        sortedReturned.slice(0, 2).forEach(book => {
            if (book && book.return_date) {
                activities.push({
                    type: 'return',
                    description: `You returned "${book.title || 'a book'}"`,
                    timestamp: book.return_date
                });
            }
        });
    }
    
    // Add due soon activity if there are books due soon (only one entry)
    if (dueSoonCount > 0) {
        const now = new Date();
        activities.push({
            type: 'due',
            description: `You have ${dueSoonCount} book${dueSoonCount !== 1 ? 's' : ''} due soon`,
            timestamp: now.toISOString()
        });
    }
    
    // Add overdue activity if there are overdue books (only one entry)
    if (overdueCount > 0) {
        const now = new Date();
        activities.push({
            type: 'overdue',
            description: `You have ${overdueCount} overdue book${overdueCount !== 1 ? 's' : ''}`,
            timestamp: now.toISOString()
        });
    }
    
    // Sort all activities by timestamp, newest first
    const sortedActivities = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Return only the 5 most recent activities
    return sortedActivities.slice(0, 5);
}

// Helper function to get icon for activity type
function getActivityIcon(type) {
    switch (type) {
        case 'login': return 'log-in';
        case 'borrow': return 'book';
        case 'return': return 'rotate-ccw';
        case 'due': return 'clock';
        case 'overdue': return 'alert-circle';
        case 'info': return 'info';
        default: return 'circle';
    }
}

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
        });
    }
}


// Add this debugging function to your overview-charts.js file
function debugOverviewData() {
    fetch('/student/overview', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('DEBUG - Raw overview data:', data);
        console.log('DEBUG - Books data:', {
            borrowedBooks: data.borrowedBooks || [],
            returnedBooks: data.returnedBooks || [],
            borrowedCount: data.borrowedCount || 0
        });
    })
    .catch(error => {
        console.error('DEBUG - Error fetching overview data:', error);
    });
}

// Call this function at the end of initializeOverviewCharts
function initializeOverviewCharts() {
    console.log('Initializing overview charts...');
    
    // Initialize reading progress chart
    if (document.getElementById('reading-progress-chart')) {
        initReadingProgressChart();
    }
    
    // Initialize recent activity
    if (document.getElementById('recent-activity-list')) {
        initRecentActivity();
    }
    
    // Set up refresh interval (every 60 seconds)
    setInterval(function() {
        console.log('Refreshing chart data...');
        if (document.getElementById('reading-progress-chart')) {
            initReadingProgressChart(false); // Don't show loading indicator on refresh
        }
        
        console.log('Refreshing activity data...');
        if (document.getElementById('recent-activity-list')) {
            initRecentActivity(false); // Don't show loading indicator on refresh
        }
    }, 60000);
    
    // Add debug call
    debugOverviewData();
}

// Add this function to manually refresh chart data
function refreshChartData() {
    console.log('Manually refreshing chart data...');
    
    // Clear the cached data
    sessionStorage.removeItem('studentOverviewData');
    
    // Show a loading indicator on the refresh button
    const refreshBtn = document.getElementById('refresh-chart-btn');
    if (refreshBtn) {
        const originalContent = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        
        // FIXED: Ensure chart is destroyed before re-initializing
        if (window.readingProgressChart) {
            console.log('Destroying chart before refresh');
            window.readingProgressChart.destroy();
            window.readingProgressChart = null;
        }
        
        // Re-initialize the charts
        setTimeout(() => {
            initReadingProgressChart();
            initRecentActivity();
            
            // Reset the button after a delay
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = originalContent;
            }, 1000);
        }, 100); // Small delay to ensure DOM is ready
    } else {
        // If button not found, just refresh the charts
        if (window.readingProgressChart) {
            window.readingProgressChart.destroy();
            window.readingProgressChart = null;
        }
        setTimeout(() => {
            initReadingProgressChart();
            initRecentActivity();
        }, 100);
    }
}

// Add this function to format timestamps for activity items
// Add this function if it doesn't exist
function formatActivityTimestamp(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const activityDate = new Date(timestamp);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(activityDate.getTime())) return 'Invalid date';
    
    // Calculate time difference in milliseconds
    const diffMs = now - activityDate;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Format based on how long ago the activity occurred
    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        // For older activities, show the actual date
        return activityDate.toLocaleDateString();
    }
}