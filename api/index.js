import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// In-memory user and post storage for serverless functions
const users = new Map();
const posts = new Map();
let userIdCounter = 1;
let postIdCounter = 1;

// Password hashing functions
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Simple session storage for serverless functions
const sessions = new Map();

// Helper function to get user by session
function getUserBySession(sessionId) {
  const userId = sessions.get(sessionId);
  if (!userId) return null;
  return users.get(userId);
}

// Main handler for all API routes
export default async function handler(req, res) {
  // Extract the path from the request
  const path = req.url.split('?')[0];
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract session from cookie if present
  const sessionId = req.cookies && req.cookies.sessionId;
  const currentUser = sessionId ? getUserBySession(sessionId) : null;

  // Handle different API routes
  try {
    // Login route
    if (path === '/api/login' && req.method === 'POST') {
      const { username, password } = req.body;
      
      // Find user by username
      let foundUser = null;
      for (const user of users.values()) {
        if (user.username === username) {
          foundUser = user;
          break;
        }
      }
      
      if (!foundUser || !(await comparePasswords(password, foundUser.password))) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Create session
      const newSessionId = randomBytes(32).toString('hex');
      sessions.set(newSessionId, foundUser.id);
      
      // Set session cookie
      res.setHeader('Set-Cookie', `sessionId=${newSessionId}; Path=/; HttpOnly; SameSite=Lax`);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = foundUser;
      return res.status(200).json(userWithoutPassword);
    }
    
    // Logout route
    if (path === '/api/logout' && req.method === 'POST') {
      if (sessionId) {
        sessions.delete(sessionId);
        res.setHeader('Set-Cookie', 'sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      }
      return res.status(200).json({ success: true });
    }
    
    // Register route
    if (path === '/api/register' && req.method === 'POST') {
      const { username, password, name, bio } = req.body;
      
      // Check if username already exists
      for (const user of users.values()) {
        if (user.username === username) {
          return res.status(400).json({ error: 'Username already exists' });
        }
      }
      
      // Create user with hashed password
      const id = userIdCounter++;
      const hashedPassword = await hashPassword(password);
      const newUser = {
        id,
        username,
        password: hashedPassword,
        name: name || username,
        bio: bio || '',
        createdAt: new Date().toISOString()
      };
      
      users.set(id, newUser);
      
      // Create session
      const newSessionId = randomBytes(32).toString('hex');
      sessions.set(newSessionId, id);
      
      // Set session cookie
      res.setHeader('Set-Cookie', `sessionId=${newSessionId}; Path=/; HttpOnly; SameSite=Lax`);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    }
    
    // Current user route
    if (path === '/api/user' && req.method === 'GET') {
      if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = currentUser;
      return res.status(200).json(userWithoutPassword);
    }
    
    // Update current user route
    if (path === '/api/user' && req.method === 'PATCH') {
      if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const { name, bio } = req.body;
      
      // Update user
      const updatedUser = {
        ...currentUser,
        name: name || currentUser.name,
        bio: bio || currentUser.bio
      };
      
      users.set(currentUser.id, updatedUser);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    }
    
    // Create post route
    if (path === '/api/posts' && req.method === 'POST') {
      if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const { title, content } = req.body;
      
      // Validate input
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }
      
      // Create post
      const id = postIdCounter++;
      const newPost = {
        id,
        userId: currentUser.id,
        title,
        content,
        createdAt: new Date().toISOString()
      };
      
      posts.set(id, newPost);
      
      return res.status(201).json(newPost);
    }
    
    // List all posts (IDOR vulnerability - shows all posts without authentication)
    if (path === '/api/posts' && req.method === 'GET') {
      return res.status(200).json(Array.from(posts.values()));
    }
    
    // Get single post (IDOR vulnerability - can access any post by ID)
    if (path.match(/^\/api\/posts\/\d+$/) && req.method === 'GET') {
      const postId = parseInt(path.split('/').pop());
      const post = posts.get(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      return res.status(200).json(post);
    }
    
    // Update post (IDOR vulnerability - can update any post without checking ownership)
    if (path.match(/^\/api\/posts\/\d+$/) && req.method === 'PATCH') {
      if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const postId = parseInt(path.split('/').pop());
      const post = posts.get(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      const { title, content } = req.body;
      
      // Update post without checking if it belongs to the current user (IDOR vulnerability)
      const updatedPost = {
        ...post,
        title: title || post.title,
        content: content || post.content
      };
      
      posts.set(postId, updatedPost);
      
      return res.status(200).json(updatedPost);
    }
    
    // Delete post (IDOR vulnerability - can delete any post without checking ownership)
    if (path.match(/^\/api\/posts\/\d+$/) && req.method === 'DELETE') {
      if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const postId = parseInt(path.split('/').pop());
      const post = posts.get(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Delete post without checking if it belongs to the current user (IDOR vulnerability)
      posts.delete(postId);
      
      return res.status(200).json({ success: true });
    }
    
    // Get posts by user (IDOR vulnerability - can see any user's posts)
    if (path.match(/^\/api\/posts\/user\/\d+$/) && req.method === 'GET') {
      const userId = parseInt(path.split('/').pop());
      
      // Filter posts by userId
      const userPosts = Array.from(posts.values()).filter(post => post.userId === userId);
      
      return res.status(200).json(userPosts);
    }
    
    // If no route matches
    return res.status(404).json({ error: 'API route not found' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}