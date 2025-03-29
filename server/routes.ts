import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User routes with IDOR vulnerability
  app.get("/api/user/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Vulnerable: No authorization check to verify if the user is accessing their own data
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't return the hashed password
    const safeUser = { ...user };
    delete safeUser.password;
    
    res.json(safeUser);
  });

  app.put("/api/user/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Vulnerable: No authorization check to verify if the user is modifying their own profile
    const userId = parseInt(req.params.id);
    
    // Basic validation - don't allow changing username or password through this endpoint
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      bio: req.body.bio,
    };
    
    const updatedUser = await storage.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't return the hashed password
    const safeUser = { ...updatedUser };
    delete safeUser.password;
    
    res.json(safeUser);
  });

  // Post routes with IDOR vulnerability
  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const postData = {
        ...req.body,
        userId: req.user.id
      };
      
      const validatedData = insertPostSchema.parse(postData);
      const post = await storage.createPost(validatedData);
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Get all public posts, plus the user's own private posts
    const allPosts = await storage.getAllPosts();
    const filteredPosts = allPosts.filter(post => 
      post.visibility === "public" || post.userId === req.user.id
    );
    
    res.json(filteredPosts);
  });

  app.get("/api/user/:userId/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = parseInt(req.params.userId);
    const isOwnPosts = userId === req.user.id;
    
    const posts = await storage.getUserPosts(userId);
    
    // If viewing someone else's posts, only show public ones
    const filteredPosts = isOwnPosts 
      ? posts 
      : posts.filter(post => post.visibility === "public");
    
    res.json(filteredPosts);
  });

  // IDOR vulnerable endpoints
  app.get("/api/post/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Vulnerable: No authorization check to verify if the user is allowed to view this post
    const postId = parseInt(req.params.id);
    const post = await storage.getPost(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json(post);
  });

  app.put("/api/post/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Vulnerable: No authorization check to verify if the user is the owner of the post
    const postId = parseInt(req.params.id);
    
    const updateData = {
      title: req.body.title,
      content: req.body.content,
      visibility: req.body.visibility
    };
    
    const updatedPost = await storage.updatePost(postId, updateData);
    
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json(updatedPost);
  });

  app.delete("/api/post/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Vulnerable: No authorization check to verify if the user is the owner of the post
    const postId = parseInt(req.params.id);
    
    const deleted = await storage.deletePost(postId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.status(200).json({ message: "Post deleted successfully" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
