import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Post } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit, Trash, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  showActions?: boolean;
}

const postUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  visibility: z.enum(["public", "private"]),
});

type PostUpdateValues = z.infer<typeof postUpdateSchema>;

export default function PostCard({ post, onDelete, showActions = false }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  
  const isOwner = post.userId === user?.id;
  
  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    defaultValues: {
      title: post.title,
      content: post.content,
      visibility: post.visibility as "public" | "private",
    },
  });
  
  const updatePostMutation = useMutation({
    mutationFn: async (data: PostUpdateValues) => {
      const res = await apiRequest("PUT", `/api/post/${post.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/posts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PostUpdateValues) => {
    updatePostMutation.mutate(data);
  };
  
  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return "some time ago";
    }
  };
  
  return (
    <>
      <div className="border border-gray-200 rounded-md p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{post.title}</h3>
            <p className="text-xs text-gray-500">
              Posted {post.createdAt ? formatDate(post.createdAt) : "recently"} • 
              {post.visibility === "private" ? (
                <Badge variant="destructive" className="ml-1">Private</Badge>
              ) : (
                <Badge variant="success" className="ml-1 bg-green-600">Public</Badge>
              )}
            </p>
          </div>
          
          {showActions && (
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsApiDialogOpen(true)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View API
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <p className="mt-2 text-gray-600">{post.content}</p>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <Label htmlFor="public">Public</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <Label htmlFor="private">Private</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePostMutation.isPending}>
                  {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* API Info Dialog */}
      <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Post API Endpoints</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Get Post</h3>
              <div className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto text-sm">
                <code>GET /api/post/{post.id}</code>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Update Post</h3>
              <div className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto text-sm">
                <code>PUT /api/post/{post.id}</code>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Delete Post</h3>
              <div className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto text-sm">
                <code>DELETE /api/post/{post.id}</code>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
              <p className="text-yellow-700">
                <strong>Note:</strong> Try these endpoints with different post IDs to see if you can access or modify other users' posts!
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" onClick={() => setIsApiDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
