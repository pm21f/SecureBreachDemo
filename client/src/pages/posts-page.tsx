import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Post } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Loader2 } from "lucide-react";
import PostCard from "@/components/post-card";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  visibility: z.enum(["public", "private"], {
    required_error: "You must select a visibility",
  }),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function PostsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      visibility: "public",
    },
  });
  
  const { data: userPosts, isLoading } = useQuery<Post[]>({
    queryKey: [`/api/user/${user?.id}/posts`],
    refetchOnWindowFocus: true,
  });
  
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      const res = await apiRequest("POST", "/api/posts", {
        ...data,
        userId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/posts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset({
        title: "",
        content: "",
        visibility: "public",
      });
      toast({
        title: "Post created",
        description: "Your post has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/post/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/posts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PostFormValues) => {
    createPostMutation.mutate(data);
  };
  
  const handleDelete = (postId: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  };
  
  const filteredPosts = userPosts?.filter(post => {
    if (filter === "all") return true;
    return post.visibility === filter;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <div className="flex-1 bg-gray-50 p-8 overflow-auto">
          <div className="space-y-6">
            {/* Create post form */}
            <Card className="bg-white shadow rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Create New Post</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter post title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write your post content here..." 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Visibility</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex items-center space-x-6"
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="public" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Public
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="private" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Private
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Post"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* User posts */}
            <Card className="bg-white shadow rounded-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Your Posts</h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant={filter === "all" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      All
                    </Button>
                    <Button 
                      variant={filter === "public" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilter("public")}
                    >
                      Public
                    </Button>
                    <Button 
                      variant={filter === "private" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilter("private")}
                    >
                      Private
                    </Button>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2">Loading your posts...</p>
                  </div>
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPosts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onDelete={() => handleDelete(post.id)}
                        showActions
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-gray-300 rounded-md">
                    <p className="text-gray-500">
                      {filter === "all" 
                        ? "You haven't created any posts yet." 
                        : `You don't have any ${filter} posts.`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* IDOR vulnerability information */}
            <Card className="bg-white shadow rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Post API Endpoints</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2">Get Post</h3>
                    <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
                      <code>GET /api/post/<span className="text-yellow-300">:id</span></code>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-medium mb-2">Update Post</h3>
                    <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
                      <code>PUT /api/post/<span className="text-yellow-300">:id</span></code>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-medium mb-2">Delete Post</h3>
                    <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
                      <code>DELETE /api/post/<span className="text-yellow-300">:id</span></code>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Vulnerability:</strong> Try accessing or modifying posts that don't belong to you by changing the ID parameter in the URL.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
