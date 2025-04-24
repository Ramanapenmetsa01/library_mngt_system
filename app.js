require('dotenv').config();  
const express       = require('express');
const mysql         = require('mysql2');
const bodyParser    = require('body-parser');
const session       = require('express-session');
const path          = require('path');
const cors          = require('cors');
const multer        = require('multer');
const fs            = require('fs');
const MySQLStore    = require('express-mysql-session')(session); // Require the MySQL session store
const dotenv        = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
// OAuth2 client for full‑page redirect flow
const redirectClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/auth/google-callback`
);

// Load environment variables
dotenv.config();
const app  = express();
const port = process.env.PORT || 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const dbOptions = {
  host: 'localhost',
  user: 'root',
  password: '7788',
  database: 'librarydb'
};
const sessionStore = new MySQLStore(dbOptions);
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // Use the persistent MySQL session store
  cookie: {
    secure: false,      // set to true if using https
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
const db = mysql.createConnection(dbOptions);
app.use((req, res, next) => {
  const skipLoggingPaths = ['/check-auth','/api/auth/check-session','/session','/uploads','/css','/js','/img','/favicon.ico'];
  // Check if the current path should be skipped
  const shouldSkipLogging = skipLoggingPaths.some(path => 
    req.path.startsWith(path) || req.path.includes(path)
  );
  if (process.env.NODE_ENV === 'development' && !shouldSkipLogging) {
    console.log('Path:', req.path);
    if (req.session && req.session.user) {
      console.log('Session ID:', req.sessionID);
      console.log('Session User:', req.session.user);
    }
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('*.css', (req, res, next) => {
  res.type('text/css');
  next();
});
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
function checkAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  next();
}
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL.');
  // Check if published_year column exists before adding it
  db.query(`
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'librarydb' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'profile_picture'
  `, (err, results) => {
    if (err) {
      console.error('Error checking column existence:', err);
    } else if (results.length === 0) {
      db.query(`
        ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255)
      `, (err, result) => {
        if (err) {
          console.error('Error adding profile_picture column:', err);
        } else {
          console.log('Added profile_picture column to users table');
        }
      });
    }
  });
  
  // Check if google_auth column exists
  db.query(`
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'librarydb' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'google_auth'
  `, (err, results) => {
    if (err) {
      console.error('Error checking column existence:', err);
    } else if (results.length === 0) {
      db.query(`
        ALTER TABLE users ADD COLUMN google_auth BOOLEAN DEFAULT FALSE
      `, (err, result) => {
        if (err) {
          console.error('Error adding google_auth column:', err);
        } else {
          console.log('Added google_auth column to users table');
        }
      });
    }
  });
  
  // Check if created_at column exists
  db.query(`
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'librarydb' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'created_at'
  `, (err, results) => {
    if (err) {
      console.error('Error checking column existence:', err);
    } else if (results.length === 0) {
      db.query(`
        ALTER TABLE users ADD COLUMN created_at DATETIME
      `, (err, result) => {
        if (err) {
          console.error('Error adding created_at column:', err);
        } else {
          console.log('Added created_at column to users table');
        }
      });
    }
  });
});
// ── ROUTES ─────────────────────────────────────────────────────────────────────
// Get all books endpoint
app.get('/books', (req, res) => {
  const query = 'SELECT * FROM books';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    // Ensure cover_image paths are correct
    results.forEach(book => {
      if (book.cover_image && !book.cover_image.startsWith('/uploads/')) {
        book.cover_image = `/uploads/${book.cover_image}`;
      }
    });
    res.json({ success: true, books: results });
  });
});
// Get books for admin with search functionality
app.get('/admin/books', checkAdmin, (req, res) => {
  const { type, query } = req.query;
  let sqlQuery = 'SELECT * FROM books';
  if (query && type) {
    sqlQuery += ` WHERE ${type} LIKE ?`;
    db.query(sqlQuery, [`%${query}%`], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, books: results });
    });
  } else {
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, books: results });
    });
  }
});
// Get a single book by ID for the edit functionality
app.get('/admin/books/:id', checkAdmin, (req, res) => {
  const bookId = req.params.id;
  // Set headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  db.query('SELECT * FROM books WHERE id = ?', [bookId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    // Return the book data
    res.json({ success: true, book: results[0] });
  });
});
// Update a book
app.put('/admin/books/:id', checkAdmin, upload.single('cover_image'), (req, res) => {
  const bookId = req.params.id;
  const { title, author, published_year, available } = req.body;
  console.log('Update book request:', req.body);
  console.log('File upload:', req.file);
  // First, check if the book exists and get current image if needed
  db.query('SELECT cover_image FROM books WHERE id = ?', [bookId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;
    let updateQuery;
    let queryParams;
    if (coverImage) {
      updateQuery = `
        UPDATE books 
        SET title = ?, author = ?, published_year = ?, available = ?, cover_image = ? 
        WHERE id = ?
      `;
      queryParams = [title, author, published_year, available === 'true' ? 1 : 0, coverImage, bookId]; 
      // Delete old image file if it exists
      if (results[0].cover_image) {
        const oldImagePath = path.join(__dirname, 'public', results[0].cover_image);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log(`Deleted old image: ${oldImagePath}`);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if image deletion fails
        }
      }
    } else {
      updateQuery = `
        UPDATE books 
        SET title = ?, author = ?, published_year = ?, available = ? 
        WHERE id = ?
      `;
      queryParams = [title, author, published_year, available === 'true' ? 1 : 0, bookId];
    }
    db.query(updateQuery, queryParams, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      } 
      res.json({ success: true, message: 'Book updated successfully' });
    });
  });
});
// Delete a book
app.delete('/admin/books/:id', checkAdmin, (req, res) => {
  const bookId = req.params.id;
  // First check if the book exists
  db.query('SELECT * FROM books WHERE id = ?', [bookId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    // Book exists, proceed with deletion
    db.query('DELETE FROM books WHERE id = ?', [bookId], (err, result) => {
      if (err) {
        console.error('Error deleting book:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete book' });
      }   
      res.json({ success: true, message: 'Book deleted successfully' });
    });
  });
});
// Toggle book availability
app.put('/admin/books/:id/availability', checkAdmin, (req, res) => {
  const bookId = req.params.id;
  const { available } = req.body;
  // Set headers
  res.setHeader('Content-Type', 'application/json');
  // Update the book availability
  const query = `
    UPDATE books 
    SET available = ? 
    WHERE id = ?
  `;
  db.query(query, [available ? 1 : 0, bookId], (err, result) => {
    if (err) {
      console.error('Error updating book availability:', err);
      return res.status(500).json({ success: false, message: 'Failed to update book availability' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    } 
    res.json({ success: true, message: 'Book availability updated successfully' });
  });
});
// Create a new book
app.post('/admin/books', checkAdmin, upload.single('cover_image'), (req, res) => {
  const { title, author, published_year, available } = req.body;
  // Get the file path if a file was uploaded
  const coverImage = req.file ? `/uploads/${req.file.filename}` : null;
  // Insert into database with image path
  const query = `
    INSERT INTO books (title, author, published_year, available, cover_image) 
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [title, author, published_year, available === 'true' ? 1 : 0, coverImage], function(err, result) {
    if (err) {
      console.error('Error adding book:', err);
      return res.json({ success: false, message: 'Failed to add book' });
    } 
    res.json({ success: true, id: result.insertId });
  });
});
// Serve the admin dashboard only if logged in as admin
app.get('/admin/dashboard.html', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/index.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
// Session check endpoint
app.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(401).json({ success: false, message: 'No active session' });
  }
});
// Login endpoint
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASS  = 'adminpassword';
// Fix the login endpoint to properly handle student logins
app.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  console.log('Login attempt:', { email, role });
  
  if (role === 'admin') {
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      req.session.user = { id: 0, name: 'Admin', email, role: 'admin' };
      return req.session.save(() => {
        res.json({ success: true, role: 'admin' });
      });
    } else {
      return res.json({ success: false, message: 'Invalid admin credentials' });
    }
  } else {
    // For student login, use a more detailed query
    const query = 'SELECT id, name, email, role FROM users WHERE email = ? AND password = ? AND role = "student"';
    db.query(query, [email, password], (err, results) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }   
      console.log('Student login query results:', results);
      if (results.length === 0) {
        return res.json({ success: false, message: 'Invalid credentials' });
      }
      req.session.user = results[0];
      console.log('Setting session user:', req.session.user);
      return req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, message: 'Session error' });
        }     
        console.log('Session saved successfully');
        return res.json({ 
          success: true,
          role: 'student',
          user: {
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            role: results[0].role
          }
        });
      });
    });
  }
});

// Add this endpoint for Google login (students only)

// Signup endpoint
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  const insert = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "student")';
  db.query(insert, [name, email, password], err => {
    if (err) {
      console.error('DB error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
         return res.status(400).json({ success: false, message: 'Account exists. Please login.' });
      }
      return res.status(500).json({ success: false, message: 'Signup failed' });
    }
    res.json({ success: true });
  });
});

// 1) Kick off the OAuth2 redirect
// Google OAuth routes
app.get('/auth/google', (req, res) => {
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  res.redirect(`${googleAuthUrl}?${params.toString()}`);
});
// Google OAuth callback
app.get('/auth/google-callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.redirect('/index.html?error=auth_failed');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Error getting tokens:', tokens.error);
      return res.redirect('/index.html?error=token_error');
    }
    
    // Get user info with the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    const userInfo = await userInfoResponse.json();
    
    // Check if user exists in database, if not create a new user
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [userInfo.email], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.redirect('/index.html?error=database_error');
      }
      
      let user;
      
      if (results.length === 0) {
        // User doesn't exist, create a new one
        const newUser = {
          name: userInfo.name,
          email: userInfo.email,
          role: 'student',
          google_auth: true,
          created_at: new Date()
        };
        
        db.query('INSERT INTO users SET ?', newUser, (err, result) => {
          if (err) {
            console.error('Error creating user:', err);
            return res.redirect('/index.html?error=user_creation_failed');
          }
          
          user = {
            id: result.insertId,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          };
          
          // Set user in session
          req.session.user = user;
          
          // Redirect to student dashboard
          return res.redirect('/student/dashboard.html');
        });
      } else {
        // User exists
        user = {
          id: results[0].id,
          name: results[0].name,
          email: results[0].email,
          role: results[0].role || 'student'
        };
        
        // Update google_auth flag if needed
        if (!results[0].google_auth) {
          db.query('UPDATE users SET google_auth = true WHERE id = ?', [user.id]);
        }
        
        // Set user in session
        req.session.user = user;
        
        // Redirect to student dashboard
        return res.redirect('/student/dashboard.html');
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect('/index.html?error=server_error');
  }
});

// ... rest of your code ...
// Add a specific admin logout endpoint
app.post('/admin/logout', (req, res) => {
  // Check if user is logged in and is admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  } 
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});
// Admin overview endpoint
app.get('/admin/overview', (req, res) => {
  console.log('Session user:', req.session.user);
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  Promise.all([
    db.promise().query('SELECT COUNT(*) AS totalUsers FROM users WHERE role = "student"'),
    db.promise().query('SELECT COUNT(*) AS availableBooks FROM books WHERE available = 1'),
    db.promise().query('SELECT COUNT(*) AS issuedBooks FROM books WHERE available = 0')
  ])
  .then(([[userRows], [bookRows], [issuedRows]]) => {
    res.json({
      success: true,
      totalUsers: userRows[0].totalUsers,
      availableBooks: bookRows[0].availableBooks,
      issuedBooks: issuedRows[0].issuedBooks
    });
  })
  .catch(err => {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  });
});
// Get users endpoint
app.get('/admin/users', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  const { type, query } = req.query;
  let sqlQuery = 'SELECT id, name, email, password FROM users WHERE role = "student"';
  if (query && type) {
    sqlQuery += ` AND ${type} LIKE ?`;
    db.query(sqlQuery, [`%${query}%`], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, users: results });
    });
  } else {
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, users: results });
    });
  }
});
// Delete user endpoint
app.delete('/admin/users/:id', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id = ? AND role = "student"';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  });
});
// Update user endpoint
app.put('/admin/users/:id', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  const userId = req.params.id;
  const { password } = req.body;
  const query = 'UPDATE users SET password = ? WHERE id = ? AND role = "student"';
  db.query(query, [password, userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Password updated successfully' });
  });
});
// Books Due routes
app.get('/admin/books-due', (req, res) => {
  // Check if user is logged in and is admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const query = req.query.query;
  const type = req.query.type;
  let sql = `
    SELECT bd.id, u.name as user_name, b.title as book_title, 
    bd.borrowed_date, bd.due_date, bd.returned_date, bd.status
    FROM books_due bd
    JOIN users u ON bd.user_id = u.id
    JOIN books b ON bd.book_id = b.id
    WHERE bd.status IN ('borrowed', 'overdue')
  `;
  // Add search conditions if query parameters are provided
  if (query && type) {
    if (type === 'user') {
      sql += ` AND u.name LIKE '%${query}%'`;
    } else if (type === 'book') {
      sql += ` AND b.title LIKE '%${query}%'`;
    } else if (type === 'status') {
      sql += ` AND bd.status LIKE '%${query}%'`;
    }
  }
  sql += ` ORDER BY bd.due_date ASC`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching books due:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    // Update status for overdue books
    const today = new Date();
    results.forEach(book => {
      const dueDate = new Date(book.due_date);
      if (dueDate < today && book.status === 'borrowed') {
        book.status = 'overdue';  
        // Update status in database
        db.query(
          'UPDATE books_due SET status = "overdue" WHERE id = ? AND status = "borrowed"',
          [book.id],
          (err) => {
            if (err) {
              console.error(`Error updating status for book due ID ${book.id}:`, err);
            }
          }
        );
      }
   });  
    res.json({ success: true, booksDue: results });
  });
});
// Add this middleware function before your history routes
const authenticateStudent = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'student') {
    // User is authenticated as a student
    next();
  } else {
    // User is not authenticated as a student
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required. Please log in as a student.' 
    });
  }
};

app.post('/admin/return-book/:id', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const bookDueId = req.params.id;
  // First get the book due details
  db.query('SELECT * FROM books_due WHERE id = ?', [bookDueId], (err, results) => {
    if (err) {
      console.error('Error fetching book due details:', err);
      return res.json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.json({ success: false, message: 'Book due record not found' });
    }
    const bookDue = results[0];
    db.query(
      'UPDATE books_due SET returned_date = NOW(), status = "returned" WHERE id = ?',
      [bookDueId],
      (err) => {
        if (err) {
          console.error('Error updating book due record:', err);
          return res.json({ success: false, message: 'Database error' });
        }
        db.query(
          'UPDATE books SET available = true WHERE id = ?',
          [bookDue.book_id],
          (err) => {
            if (err) {
              console.error('Error updating book availability:', err);
              return res.json({ success: false, message: 'Database error' });
            }        
            res.json({ success: true });
          }
        );
      }
    );
  });
});
app.post('/admin/borrow-book', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const { userId, bookId, dueDate } = req.body;
  if (!userId || !bookId || !dueDate) {
    return res.json({ success: false, message: 'Missing required fields' });
  }
  db.query('SELECT available FROM books WHERE id = ?', [bookId], (err, results) => {
    if (err) {
      console.error('Error checking book availability:', err);
      return res.json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.json({ success: false, message: 'Book not found' });
    }
    if (!results[0].available) {
      return res.json({ success: false, message: 'Book is not available' });
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    db.query(
      'INSERT INTO books_due (user_id, book_id, due_date) VALUES (?, ?, ?)',
      [userId, bookId, dueDate],
      (err) => {
        if (err) {
          console.error('Error creating books_due record:', err);
          return res.json({ success: false, message: 'Database error' });
        }
        db.query(
          'UPDATE books SET available = false WHERE id = ?',
          [bookId],
          (err) => {
            if (err) {
              console.error('Error updating book availability:', err);
              return res.json({ success: false, message: 'Database error' });
            }
            res.json({ success: true, message: 'Book borrowed successfully' });
          }
        );
      }
    );
  });
});
app.get('/check-auth', (req, res) => {
res.setHeader('Content-Type', 'application/json');
if (req.session && req.session.user) {
return res.json({
authenticated: true,
user: {
id: req.session.user.id,
name: req.session.user.name,
role: req.session.user.role,
email: req.session.user.email
}
});
} else {
return res.json({
authenticated: false,
message: 'No valid session found'
});
}
});
app.get('/student/books', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  const available = req.query.available === '1' ? 1 : 0;
  const countOnly = req.query.countOnly === 'true';
  if(countOnly){
    const query = 'SELECT COUNT(*) as count FROM books WHERE available = ?';
        
        db.query(query, [available], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            return res.json({ 
                success: true, 
                count: results[0].count 
            });
        });
    } else {
  const { query, type } = req.query;
  let sqlQuery = 'SELECT * FROM books WHERE available = 1';
  if (query && type) {
    if (type === 'published_year') {
      sqlQuery += ` AND ${type} = ?`;
      const yearValue = parseInt(query);
      if (isNaN(yearValue)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid year format' 
        });
      }     
      db.query(sqlQuery, [yearValue], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        console.log(`Year search results for ${yearValue}:`, results.length);
        res.json({ success: true, books: results });
      });
    } 
    else if (type === 'published_year_like') {
      sqlQuery += ` AND published_year LIKE ?`;
      db.query(sqlQuery, [`%${query}%`], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        console.log(`Partial year search results for ${query}:`, results.length);
        res.json({ success: true, books: results });
      });
    }
    else {
      sqlQuery += ` AND ${type} LIKE ?`;
      db.query(sqlQuery, [`%${query}%`], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        console.log(`Search results for ${type}=${query}:`, results.length);
        res.json({ success: true, books: results });
      });
    }
  } else {
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      console.log('All available books:', results.length);
      res.json({ success: true, books: results });
    });
  }
}
});
app.get('/student/borrowed-books', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const userId = req.session.user.id;
  const query = `
    SELECT bd.id, bd.book_id, b.title, b.author, b.cover_image, 
           bd.borrowed_date, bd.due_date, bd.status, b.published_year
    FROM books_due bd
    JOIN books b ON bd.book_id = b.id
    WHERE bd.user_id = ? AND bd.status != 'returned'
    ORDER BY bd.due_date ASC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching borrowed books:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    const books = results.map(book => {
      return {
        id: book.id,
        book_id: book.book_id,
        title: book.title,
        author: book.author,
        cover_image: book.cover_image,
        borrowed_date: book.borrowed_date,
        due_date: book.due_date,
        status: book.status,
        published_year: book.published_year
      };
    });
    res.json({ success: true, books: books });
  });
});
app.post('/student/borrow', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { bookId, borrowDate, returnDate, timezoneOffset } = req.body;
    const userId = req.session.user.id;
    if (!bookId || !borrowDate || !returnDate) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    console.log('Received borrow request:', {
        bookId,
        borrowDate,
        returnDate,
        timezoneOffset
    });
    const borrowDateObj = new Date(borrowDate);
    const returnDateObj = new Date(returnDate);
    const adjustedBorrowDate = formatDateForMySQL(borrowDateObj);
    const adjustedReturnDate = formatDateForMySQL(returnDateObj);
    console.log('Formatted dates for database:', {
        borrowDate: adjustedBorrowDate,
        returnDate: adjustedReturnDate
    });
    db.query(
        'SELECT available FROM books WHERE id = ?',
        [bookId],
        (err, results) => {
            if (err) {
                console.error('Error checking book availability:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'Book not found' });
            }
            if (results[0].available !== 1) {
                return res.status(400).json({ success: false, message: 'Book is not available for borrowing' });
            }
            console.log('Processing borrow request for user:', userId, 'book:', bookId);
            db.query(
                'INSERT INTO books_due (user_id, book_id, borrowed_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
                [userId, bookId, adjustedBorrowDate, adjustedReturnDate, 'borrowed'],
                (err, result) => {
                    if (err) {
                        console.error('Error inserting borrow record:', err);
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }
                    console.log('Inserting borrow record into database');
                    db.query(
                        'UPDATE books SET available = 0 WHERE id = ?',
                        [bookId],
                        (err) => {
                            if (err) {
                                console.error('Error updating book availability:', err);
                                return res.status(500).json({ success: false, message: 'Database error' });
                            }
                            console.log('Book borrowed successfully and marked as unavailable');
                            db.query(
                                'SELECT COUNT(*) as count FROM books WHERE available = 1',
                                (err, countResults) => {
                                    const availableCount = err ? 0 : countResults[0].count;
                                    console.log('All available books:', availableCount);
                                    return res.json({
                                        success: true,
                                        message: 'Book borrowed successfully',
                                        availableBooks: availableCount
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});
function formatDateForMySQL(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
app.get('/student/overview', (req, res) => {
    const userId = req.session && req.session.user ? req.session.user.id : null;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    console.log('Student overview requested for user ID:', userId);
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7); 
    const borrowedBooksQuery = `
        SELECT bd.id, bd.book_id, b.title, b.author, b.cover_image, 
               bd.borrowed_date, bd.due_date, bd.status, b.published_year
        FROM books_due bd
        JOIN books b ON bd.book_id = b.id
        WHERE bd.user_id = ? AND bd.status = 'borrowed'
        ORDER BY bd.due_date ASC
    `;    
    const returnedBooksQuery = `
        SELECT bd.id, bd.book_id, b.title, b.author, b.cover_image, 
               bd.borrowed_date, bd.due_date, bd.returned_date, b.published_year
        FROM books_due bd
        JOIN books b ON bd.book_id = b.id
        WHERE bd.user_id = ? AND bd.status = 'returned'
        ORDER BY bd.returned_date DESC
        LIMIT 10
    `;
    const dueSoonQuery = `
        SELECT COUNT(*) as count
        FROM books_due
        WHERE user_id = ? AND status = 'borrowed' 
        AND due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    `;
    const overdueQuery = `
        SELECT COUNT(*) as count
        FROM books_due
        WHERE user_id = ? AND status = 'borrowed' AND due_date < NOW()
    `;
    const runQuery = (query, params) => {
        return new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    };
    Promise.all([
        runQuery(borrowedBooksQuery, [userId]).catch(err => {
            console.error('Error in borrowed books query:', err);
            return []; // Return empty array on error
        }),
        runQuery(returnedBooksQuery, [userId]).catch(err => {
            console.error('Error in returned books query:', err);
            return []; // Return empty array on error
        }),
        runQuery(dueSoonQuery, [userId]).catch(err => {
            console.error('Error in due soon query:', err);
            return [{ count: 0 }]; // Return zero count on error
        }),
        runQuery(overdueQuery, [userId]).catch(err => {
            console.error('Error in overdue query:', err);
            return [{ count: 0 }]; // Return zero count on error
        })
    ])
    .then(([borrowedBooks, returnedBooks, dueSoonResults, overdueResults]) => {
        const dueSoonCount = dueSoonResults[0]?.count || 0;
        const overdueCount = overdueResults[0]?.count || 0;
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        const monthlyCounts = Array(12).fill(0);
        const allBooks = [...borrowedBooks, ...returnedBooks];
        allBooks.forEach(book => {
            if (book.borrowed_date) {
                const date = new Date(book.borrowed_date);
                const month = date.getMonth();
                monthlyCounts[month]++;
            }
        });
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        const last6MonthsData = [];
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            last6Months.push(months[monthIndex]);
            last6MonthsData.push(monthlyCounts[monthIndex]);
        }
        console.log('Sending overview response with data');
        res.json({
            success: true,
            borrowedBooks: borrowedBooks || [],
            returnedBooks: returnedBooks || [],
            borrowedCount: borrowedBooks ? borrowedBooks.length : 0,
            returnedCount: returnedBooks ? returnedBooks.length : 0,
            dueSoonCount,
            overdueCount,
            totalBooks: (borrowedBooks ? borrowedBooks.length : 0) + (returnedBooks ? returnedBooks.length : 0),
            chartData: {
                labels: last6Months,
                datasets: [{
                    label: 'Books Borrowed',
                    data: last6MonthsData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            recentActivity: [
                ...borrowedBooks.map(book => ({
                    id: book.id,
                    title: book.title,
                    status: 'borrowed',
                    date: book.borrowed_date
                })),
                ...returnedBooks.map(book => ({
                    id: book.id,
                    title: book.title,
                    status: 'returned',
                    date: book.returned_date
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
        });
    })
    .catch(error => {
        console.error('Error fetching overview data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error', 
            error: error.message,
            borrowedBooks: [],
            returnedBooks: [],
            borrowedCount: 0,
            returnedCount: 0,
            dueSoonCount: 0,
            overdueCount: 0,
            totalBooks: 0,
            chartData: {
                labels: ["January", "February", "March", "April", "May", "June"],
                datasets: [{
                    label: 'Books Borrowed',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            recentActivity: []
        });
    });
});
// Update this endpoint for student book returns
app.post('/student/return-book', (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  // Check if user is a student
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  
  const { borrowId, penalty } = req.body;
  const userId = req.session.user.id;
  
  console.log('Return book request:', { borrowId, penalty, userId });
  
  // Start a transaction to ensure data consistency
  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    // 1. Get the book ID from the borrow record - FIXED: using books_due table instead of borrowed_books
    db.query('SELECT book_id FROM books_due WHERE id = ? AND user_id = ?', [borrowId, userId], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error getting book ID:', err);
          res.status(500).json({ success: false, message: 'Database error' });
        });
      }
      
      if (results.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ success: false, message: 'Borrow record not found' });
        });
      }
      
      const bookId = results[0].book_id;
      
      // 2. Update the books_due record with return date - FIXED: using books_due table
      db.query('UPDATE books_due SET returned_date = NOW(), status = "returned" WHERE id = ?', [borrowId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error updating return date:', err);
            res.status(500).json({ success: false, message: 'Database error' });
          });
        }
        
        // 3. Update the book availability
        db.query('UPDATE books SET available = 1 WHERE id = ?', [bookId], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error updating book availability:', err);
              res.status(500).json({ success: false, message: 'Database error' });
            });
          }
          
          // 4. If there's a penalty, create a penalty record
          if (penalty && penalty > 0) {
            db.query('INSERT INTO penalties (user_id, book_due_id, amount,paid, created_at) VALUES (?, ?, ?,1, NOW())', 
              [userId, borrowId, penalty], (err, result) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error creating penalty record:', err);
                  res.status(500).json({ success: false, message: 'Database error' });
                });
              }
              
              // Commit the transaction
              db.commit(err => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Error committing transaction:', err);
                    res.status(500).json({ success: false, message: 'Database error' });
                  });
                }
                
                res.json({ 
                  success: true, 
                  message: 'Book returned successfully with penalty',
                  penalty: penalty,
                  penaltyId: result.insertId
                });
              });
            });
          } else {
            // No penalty, just commit the transaction
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', err);
                  res.status(500).json({ success: false, message: 'Database error' });
                });
              }
              
              res.json({ 
                success: true, 
                message: 'Book returned successfully'
              });
            });
          }
        });
      });
    });
  });
});
// Update the pay-penalty endpoint to properly handle the request
// Update your pay-penalty endpoint to record payments
// Update your pay-penalty endpoint to record payments
// Update the pay-penalty endpoint to correctly update the penalties table
app.post('/student/pay-penalty', (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  // Check if user is a student
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  
  try {
    const { penaltyId, penaltyAmount, bookTitle, bookId } = req.body;
    const studentId = req.session.user.id;
    
    // Validate input
    if (!penaltyAmount || isNaN(parseFloat(penaltyAmount)) || parseFloat(penaltyAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid penalty amount'
      });
    }
    
    console.log('Processing penalty payment:', {
      studentId,
      penaltyId,
      penaltyAmount,
      bookTitle
    });
    
    // Start a transaction
    db.beginTransaction(err => {
      if (err) {
        console.error('Transaction error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      // Update the penalty record to mark it as paid
      const updatePenaltyQuery = `
        UPDATE penalties 
        SET paid = 1 
        WHERE id = ? AND user_id = ?
      `;
      
      db.query(updatePenaltyQuery, [penaltyId, studentId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error updating penalty record:', err);
            res.status(500).json({ success: false, message: 'Database error' });
          });
        }
        
        // If no rows were affected, the penalty might not exist or doesn't belong to this user
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ success: false, message: 'Penalty record not found' });
          });
        }
        
        // Commit the transaction
        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              console.error('Error committing transaction:', err);
              res.status(500).json({ success: false, message: 'Database error' });
            });
          }
          
          res.json({
            success: true,
            message: 'Penalty payment processed successfully'
          });
        });
      });
    });
  } catch (error) {
    console.error('Error processing penalty payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process penalty payment',
      error: error.message
    });
  }
});
// ... existing code ...
app.get('/student/book-history', authenticateStudent, (req, res) => {
  const studentId = req.session.user.id; // Changed from req.session.userId
  
  // Query to get book borrowing history with book details
  const query = `
      SELECT 
          bd.id AS borrowId,
          b.id AS bookId,
          b.title AS bookTitle,
          b.author,
          bd.borrowed_date AS borrowDate,
          bd.due_date AS dueDate,
          bd.returned_date AS returnDate,
          CASE 
              WHEN bd.returned_date IS NULL THEN 'borrowed'
              ELSE 'returned'
          END AS status
      FROM 
          books_due bd
      JOIN 
          books b ON bd.book_id = b.id
      WHERE 
          bd.user_id = ?
      ORDER BY 
          bd.borrowed_date DESC
  `;
  
  db.query(query, [studentId], (err, results) => {
      if (err) {
          console.error('Error fetching book history:', err);
          return res.status(500).json({ 
              success: false, 
              message: 'Error fetching book history' 
          });
      }
      
      res.json({
          success: true,
          history: results
      });
  });
});
// ... existing code ...

// Book History Route - Fix the query to use books_due table instead of borrows
// ... existing code ...

// Add this route to handle borrowing history requests
// ... existing code ...

// Add this route to handle borrowing history requests
app.get('/student/borrowing-history', authenticateStudent, (req, res) => {
  const studentId = req.session.user.id;
  
  // Query to get book borrowing history with book details
  const query = `
      SELECT 
          bd.id AS borrowId,
          b.id AS bookId,
          b.title AS bookTitle,
          b.author,
          bd.borrowed_date AS borrowDate,
          bd.due_date AS dueDate,
          bd.returned_date AS returnDate,
          CASE 
              WHEN bd.returned_date IS NULL AND bd.due_date < CURRENT_DATE THEN 'overdue'
              WHEN bd.returned_date IS NULL THEN 'active'
              ELSE 'returned'
          END AS status
      FROM 
          books_due bd
      JOIN 
          books b ON bd.book_id = b.id
      WHERE 
          bd.user_id = ?
      ORDER BY 
          bd.borrowed_date DESC
  `;
  
  db.query(query, [studentId], (err, results) => {
      if (err) {
          console.error('Error fetching borrowing history:', err);
          return res.status(500).json({ 
              success: false, 
              message: 'Failed to fetch borrowing history' 
          });
      }
      
      // Format the data for the client
      const history = results.map(item => ({
          bookId: item.bookId,
          bookTitle: item.bookTitle,
          borrowDate: item.borrowDate,
          expectedReturnDate: item.dueDate,
          actualReturnDate: item.returnDate,
          status: item.status
      }));
      
      res.json({
          success: true,
          history: history
      });
  });
});
// Add this endpoint to your app.js file

// Payment history endpoint
// Payment history endpoint - Fix the session variable and query method
// Payment history endpoint - Fix to use penalties table instead of payments
// Payment history endpoint - Fix the status conversion
app.get('/student/payment-history', authenticateStudent, (req, res) => {
  try {
    const studentId = req.session.user.id;
    
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    console.log('Fetching payment history for student ID:', studentId);
    
    // Fix the CASE statement to correctly convert paid column (0/1) to status
    const query = `
      SELECT 
        p.id,
        p.amount,
        p.created_at AS date,
        IF(p.paid = 1, 'paid', 'unpaid') AS status,
        'Late return fee' AS description,
        b.title AS bookTitle,
        b.id AS bookId
      FROM 
        penalties p
      LEFT JOIN 
        books_due bd ON p.book_due_id = bd.id
      LEFT JOIN 
        books b ON bd.book_id = b.id
      WHERE 
        p.user_id = ?
      ORDER BY 
        p.created_at DESC
    `;
    
    db.query(query, [studentId], (err, penalties) => {
      if (err) {
        console.error('Database error when fetching payment history:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch payment history',
          error: err.message
        });
      }
      
      // Format the data for the frontend
      const formattedPayments = penalties.map(penalty => ({
        id: penalty.id,
        amount: penalty.amount,
        date: penalty.date,
        status: penalty.status,
        description: penalty.description || 'Late return fee',
        bookTitle: penalty.bookTitle || 'Unknown book',
        bookId: penalty.bookId
      }));
      
      res.json({
        success: true,
        payments: formattedPayments
      });
    });
  } catch (error) {
    console.error('Error in payment history endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});
app.post('/student/record-penalty', (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  // Check if user is a student
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  
  try {
    const { bookTitle, penaltyAmount, borrowId, bookId } = req.body;
    const studentId = req.session.user.id;
    
    // Validate input
    if (!penaltyAmount || isNaN(parseFloat(penaltyAmount)) || parseFloat(penaltyAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid penalty amount'
      });
    }
    
    // Record the unpaid penalty in the payments table
    const insertPaymentQuery = `
      INSERT INTO payments 
      (student_id, book_id, amount, status, description) 
      VALUES (?, ?, ?, 'unpaid', ?)
    `;
    
    db.query(insertPaymentQuery, [
      studentId, 
      bookId || null, 
      parseFloat(penaltyAmount),
      `Late return fee for "${bookTitle || 'a book'}"`
    ], (err, result) => {
      if (err) {
        console.error('Error recording penalty:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to record penalty',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        message: 'Penalty recorded successfully'
      });
    });
  } catch (error) {
    console.error('Error recording penalty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record penalty',
      error: error.message
    });
  }
});
// Add these routes to your app.js file

// Get all penalties collected
// Add this middleware function before your penalties routes
const authenticateAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    // User is authenticated as an admin
    next();
  } else {
    // User is not authenticated as an admin
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required. Please log in as an admin.' 
    });
  }
};
// Add this helper function for database queries with promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
// ... existing code ...
// ... existing code ...

// Get all penalties collected - Updated to work with your database structure
app.get('/admin/penalties-collected', authenticateAdmin, (req, res) => {
  try {
    const { type, query: searchQuery } = req.query;
    
    // Log the request for debugging
    console.log('Fetching penalties collected with params:', { type, searchQuery });
    
    // Basic query to get all paid penalties
    let sql = `
      SELECT p.id, p.amount, p.created_at AS payment_date, 
             IF(p.paid = 1, 'paid', 'unpaid') AS status,
             u.name as user_name, b.title as book_title
      FROM penalties p
      JOIN users u ON p.user_id = u.id
      JOIN books_due bd ON p.book_due_id = bd.id
      JOIN books b ON bd.book_id = b.id
      WHERE p.paid = 1
    `;
    
    const params = [];
    
    // Add search filters if provided
    if (type && searchQuery) {
      if (type === 'student') {
        sql += ` AND u.name LIKE ?`;
        params.push(`%${searchQuery}%`);
      } else if (type === 'book') {
        sql += ` AND b.title LIKE ?`;
        params.push(`%${searchQuery}%`);
      } else if (type === 'date') {
        sql += ` AND p.created_at LIKE ?`;
        params.push(`%${searchQuery}%`);
      } else if (type === 'amount') {
        sql += ` AND p.amount LIKE ?`;
        params.push(`%${searchQuery}%`);
      }
    }
    sql += ` ORDER BY p.created_at DESC`;
    // Execute the query
    db.query(sql, params, (err, penalties) => {
      if (err) {
        console.error('Database error when fetching penalties:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch penalties',
          error: err.message
        });
      }
      
      console.log(`Found ${penalties.length} penalties`);
      
      res.json({
        success: true,
        penalties: penalties
      });
    });
  } catch (error) {
    console.error('Error in penalties-collected endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch penalties',
      error: error.message
    });
  }
});
// ... existing code ...
// ... existing code ...

// Test endpoint for penalties that doesn't require authentication
app.get('/admin/test-penalties-public', (req, res) => {
  console.log('Public test penalties endpoint called');
  res.json({
    success: true,
    message: 'Penalties API is working',
    penalties: [
      {
        id: 1,
        user_name: 'Test User',
        book_title: 'Test Book',
        amount: 5.00,
        payment_date: new Date(),
        status: 'paid'
      }
    ]
  });
});


// Get penalty details by ID
app.get('/admin/penalties/:id', authenticateAdmin, (req, res) => {
  try {
    const penaltyId = req.params.id;
    console.log('Fetching details for penalty ID:', penaltyId);
    
    const sql = `
      SELECT p.id, p.amount, p.created_at AS payment_date, 
             IF(p.paid = 1, 'paid', 'unpaid') AS status,
             'Late return fee' AS description,
             u.name as user_name, b.title as book_title
      FROM penalties p
      JOIN users u ON p.user_id = u.id
      JOIN books_due bd ON p.book_due_id = bd.id
      JOIN books b ON bd.book_id = b.id
      WHERE p.id = ?
    `;
    
    db.query(sql, [penaltyId], (err, results) => {
      if (err) {
        console.error('Database error when fetching penalty details:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch penalty details',
          error: err.message
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Penalty not found'
        });
      }
      
      res.json({
        success: true,
        penalty: results[0]
      });
    });
  } catch (error) {
    console.error('Error in penalty details endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch penalty details',
      error: error.message
    });
  }
});

// Process penalty refund
app.post('/admin/penalties/:id/refund', authenticateAdmin, async (req, res) => {
  try {
    const penaltyId = req.params.id;
    
    // Get penalty details first
    const penaltyQuery = `
      SELECT * FROM penalties WHERE id = ?
    `;
    
    const penalties = await query(penaltyQuery, [penaltyId]);
    
    if (penalties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Penalty not found'
      });
    }
    
    const penalty = penalties[0];
    
    // Check if penalty is already paid
    if (!penalty.paid) {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund an unpaid penalty'
      });
    }
    
    // Update penalty status to refunded
    const updateSql = `
      UPDATE penalties
      SET paid = 0, status = 'refunded', refund_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(updateSql, [penaltyId]);
    
    // Add a record to the refunds table
    const refundSql = `
      INSERT INTO refunds (penalty_id, amount, refund_date)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    await query(refundSql, [penaltyId, penalty.amount]);
    
    res.json({
      success: true,
      message: 'Penalty refunded successfully'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});
// Add these routes to your app.js file
app.get('/admin/books-history', authenticateAdmin, (req, res) => {
  try {
    const query = req.query.query || '';
    const type = req.query.type || 'book_title';
    
    let sql = `
      SELECT bd.id, bd.book_id, bd.user_id, bd.borrowed_date as borrow_date, 
             bd.due_date, bd.returned_date as return_date, 
             CASE 
                WHEN bd.returned_date IS NULL AND bd.due_date < CURRENT_DATE THEN 'overdue'
                WHEN bd.returned_date IS NULL THEN 'borrowed'
                ELSE 'returned'
             END AS status,
             b.title as book_title, u.name as user_name
      FROM books_due bd
      LEFT JOIN books b ON bd.book_id = b.id
      LEFT JOIN users u ON bd.user_id = u.id
    `;
    
    // Add search conditions if query is provided
    const params = [];
    if (query && query.trim() !== '') {
      if (type === 'book_title') {
        sql += ` WHERE b.title LIKE ?`;
        params.push(`%${query}%`);
      } else if (type === 'user_name') {
        sql += ` WHERE u.name LIKE ?`;
        params.push(`%${query}%`);
      } else if (type === 'status') {
        sql += ` WHERE (
          CASE 
            WHEN bd.returned_date IS NULL AND bd.due_date < CURRENT_DATE THEN 'overdue'
            WHEN bd.returned_date IS NULL THEN 'borrowed'
            ELSE 'returned'
          END
        ) LIKE ?`;
        params.push(`%${query}%`);
      }
    }
    
    sql += ` ORDER BY bd.borrowed_date DESC`;
    
    console.log('Books history SQL:', sql, 'Params:', params);
    
    db.query(sql, params, (err, history) => {
      if (err) {
        console.error('Error searching books history:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to search books history'
        });
      }
      
      console.log(`Found ${history.length} books history records`);
      
      res.json({
        success: true,
        history: history
      });
    });
  } catch (error) {
    console.error('Error fetching books history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books history'
    });
  }
});
// ... existing code ...

// Delete book route// Add this route to your app.js file
// Delete book route// DELETE a book and its history/penalties
// DELETE a book and all its history & penalties
app.delete('/admin/books/:id', authenticateAdmin, (req, res) => {
  const bookId = req.params.id;

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // 1) Delete any penalty records for this book
    const deletePenalties = `
      DELETE p
      FROM penalties p
      JOIN books_due bd ON p.book_due_id = bd.id
      WHERE bd.book_id = ?
    `;
    db.query(deletePenalties, [bookId], err => {
      if (err) {
        console.error('Error deleting penalties:', err);
        return db.rollback(() =>
          res.status(500).json({ success: false, message: 'Failed to delete penalties' })
        );
      }

      // 2) Delete all borrow‑history rows for this book
      db.query('DELETE FROM books_due WHERE book_id = ?', [bookId], err => {
        if (err) {
          console.error('Error deleting books_due rows:', err);
          return db.rollback(() =>
            res.status(500).json({ success: false, message: 'Failed to delete borrow history' })
          );
        }

        // 3) Finally delete the book itself
        db.query('DELETE FROM books WHERE id = ?', [bookId], (err, result) => {
          if (err) {
            console.error('Error deleting book:', err);
            return db.rollback(() =>
              res.status(500).json({ success: false, message: 'Failed to delete book' })
            );
          }
          if (result.affectedRows === 0) {
            return db.rollback(() =>
              res.status(404).json({ success: false, message: 'Book not found' })
            );
          }

          // Commit all three deletions
          db.commit(err => {
            if (err) {
              console.error('Commit error:', err);
              return res.status(500).json({ success: false, message: 'Transaction failed' });
            }
            console.log(`Book ${bookId} and related records deleted`);
            res.json({ success: true, message: 'Book deleted successfully' });
          });
        });
      });
    });
  });
});

// Get specific book history entry
app.get('/admin/books-history/:id', authenticateAdmin, (req, res) => {
  try {
    const historyId = req.params.id;
    
    const sql = `
      SELECT bd.*, b.title as book_title, u.name as user_name
      FROM books_due bd
      LEFT JOIN books b ON bd.book_id = b.id
      LEFT JOIN users u ON bd.user_id = u.id
      WHERE bd.id = ?
    `;
    
    db.query(sql, [historyId], (err, results) => {
      if (err) {
        console.error('Error fetching book history entry:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch book history entry'
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Book history entry not found'
        });
      }
      
      res.json({
        success: true,
        history: results[0]
      });
    });
  } catch (error) {
    console.error('Error fetching book history entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book history entry'
    });
  }
});
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});
