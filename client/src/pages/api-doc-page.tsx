import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default function ApiDocPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <div className="flex-1 bg-gray-50 p-8 overflow-auto">
          <Card className="bg-white shadow rounded-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">API Documentation</h2>
              <p className="text-gray-600 mb-6">
                This documentation describes the REST API endpoints available in the SecureStack platform. 
                These endpoints are intentionally vulnerable to IDOR attacks for educational purposes.
              </p>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 mb-2"><strong>POST /api/login</strong></p>
                    <p className="text-sm text-gray-600">Login with username and password to authenticate.</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Example request:</p>
                      <pre className="bg-gray-800 text-white p-2 rounded-md text-xs overflow-x-auto"><code>{`{
  "username": "user123",
  "password": "yourpassword"
}`}</code></pre>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <p className="text-sm text-gray-700 mb-2"><strong>POST /api/register</strong></p>
                    <p className="text-sm text-gray-600">Register a new user account.</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Example request:</p>
                      <pre className="bg-gray-800 text-white p-2 rounded-md text-xs overflow-x-auto"><code>{`{
  "username": "newuser",
  "password": "securepwd123",
  "name": "New User",
  "email": "newuser@example.com",
  "bio": "Security enthusiast"
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">User Endpoints</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 mb-2"><strong>GET /api/user/:id</strong></p>
                      <p className="text-sm text-gray-600">Retrieve user profile information.</p>
                      <div className="mt-2 flex items-center">
                        <Badge variant="destructive" className="mr-2">IDOR Vulnerable</Badge>
                        <span className="text-xs text-gray-500">No authorization check on user ID</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 mb-2"><strong>PUT /api/user/:id</strong></p>
                      <p className="text-sm text-gray-600">Update user profile information.</p>
                      <div className="mt-2 flex items-center">
                        <Badge variant="destructive" className="mr-2">IDOR Vulnerable</Badge>
                        <span className="text-xs text-gray-500">No authorization check on user ID</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Example request:</p>
                        <pre className="bg-gray-800 text-white p-2 rounded-md text-xs overflow-x-auto"><code>{`{
  "name": "Updated Name",
  "email": "updated@example.com",
  "bio": "Updated bio information"
}`}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Post Endpoints</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 mb-2"><strong>GET /api/post/:id</strong></p>
                      <p className="text-sm text-gray-600">Retrieve a post by ID.</p>
                      <div className="mt-2 flex items-center">
                        <Badge variant="destructive" className="mr-2">IDOR Vulnerable</Badge>
                        <span className="text-xs text-gray-500">No ownership check, even for private posts</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 mb-2"><strong>PUT /api/post/:id</strong></p>
                      <p className="text-sm text-gray-600">Update a post by ID.</p>
                      <div className="mt-2 flex items-center">
                        <Badge variant="destructive" className="mr-2">IDOR Vulnerable</Badge>
                        <span className="text-xs text-gray-500">No ownership check before update</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Example request:</p>
                        <pre className="bg-gray-800 text-white p-2 rounded-md text-xs overflow-x-auto"><code>{`{
  "title": "Updated Title",
  "content": "Updated content for this post",
  "visibility": "public"
}`}</code></pre>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 mb-2"><strong>DELETE /api/post/:id</strong></p>
                      <p className="text-sm text-gray-600">Delete a post by ID.</p>
                      <div className="mt-2 flex items-center">
                        <Badge variant="destructive" className="mr-2">IDOR Vulnerable</Badge>
                        <span className="text-xs text-gray-500">No ownership check before deletion</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Testing the Vulnerabilities</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-start mb-4">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">
                        To exploit the IDOR vulnerabilities in this application:
                      </p>
                    </div>
                    <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 ml-4">
                      <li>Create some posts with your account</li>
                      <li>Note the IDs of your posts (visible in the API responses)</li>
                      <li>Try incrementing or decrementing the IDs to access other users' content</li>
                      <li>Try modifying or deleting other users' content using the PUT and DELETE endpoints</li>
                      <li>Try accessing or modifying other users' profiles by changing the ID in user endpoints</li>
                    </ol>
                    
                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                      <h4 className="font-medium text-blue-800 mb-2">Real-world Impact</h4>
                      <p className="text-sm text-blue-700">
                        IDOR vulnerabilities can have serious consequences in real applications, including:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-700 mt-2 ml-2">
                        <li>Unauthorized access to sensitive user information</li>
                        <li>Data tampering or destruction</li>
                        <li>Account takeover</li>
                        <li>Privacy violations</li>
                      </ul>
                    </div>
                    
                    <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-md">
                      <h4 className="font-medium text-green-800 mb-2">How to Fix IDOR Vulnerabilities</h4>
                      <ul className="list-disc list-inside text-sm text-green-700 ml-2">
                        <li>Always verify that the authenticated user has permission to access the requested resource</li>
                        <li>Implement proper access control checks based on user roles and ownership</li>
                        <li>Use indirect references (e.g., UUIDs) instead of sequential IDs when possible</li>
                        <li>Validate all input parameters against authorized resources</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
