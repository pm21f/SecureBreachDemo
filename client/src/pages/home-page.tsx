import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Post } from "@shared/schema";
import PostCard from "@/components/post-card";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <div className="flex-1 bg-gray-50 p-8 overflow-auto">
          <div className="space-y-6">
            <Card className="bg-white shadow rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Welcome, {user?.name || user?.username}!</h2>
                <p className="text-gray-600">This is an interactive learning environment for understanding IDOR vulnerabilities.</p>
                <p className="text-gray-600 mt-2">Your user ID is: <code className="bg-gray-100 px-2 py-1 rounded text-primary">{user?.id}</code></p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">What is IDOR?</h2>
                <p className="text-gray-600 mb-4">
                  Insecure Direct Object Reference (IDOR) is a security vulnerability that occurs when an application 
                  uses client-provided input to directly access objects and resources without proper authorization.
                </p>
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <Button asChild>
                    <Link href="/api-doc">View API Documentation</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/posts">Try Posting Content</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
                {isLoading ? (
                  <div className="p-4 text-center">Loading posts...</div>
                ) : posts && posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.slice(0, 3).map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No posts yet</p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link href="/posts">Create your first post</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
