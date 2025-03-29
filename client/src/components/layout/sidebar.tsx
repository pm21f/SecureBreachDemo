import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, User, FileText, FileCode } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
    {
      name: "Posts",
      path: "/posts",
      icon: FileText,
    },
    {
      name: "API Documentation",
      path: "/api-doc",
      icon: FileCode,
    },
  ];
  
  return (
    <div className="w-64 bg-white shadow-md hidden md:block">
      <div className="py-4 px-6">
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={cn(
                "flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary",
                isActive(item.path) && "bg-indigo-50 text-primary border-l-4 border-primary"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
