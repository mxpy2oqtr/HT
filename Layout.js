import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  Activity, 
  Utensils, 
  Moon, 
  Target, 
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Droplets,
  TrendingUp,
  Bell,
  MessageCircle
} from "lucide-react";
import { NotificationProvider } from "@/components/reminders/NotificationService";
import ChatWidget from "@/components/chat/ChatWidget";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const navigation = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { name: "Actividad", page: "Activities", icon: Activity },
    { name: "Nutrición", page: "Nutrition", icon: Utensils },
    { name: "Sueño", page: "Sleep", icon: Moon },
    { name: "Hidratación", page: "Hydration", icon: Droplets },
    { name: "Metas", page: "Goals", icon: Target },
    { name: "Progreso", page: "Progress", icon: TrendingUp },
    { name: "Recordatorios", page: "Reminders", icon: Bell },
    { name: "Asistente IA", page: "Chat", icon: MessageCircle },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <NotificationProvider>
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --green-primary: #10B981;
          --green-secondary: #059669;
          --green-light: #D1FAE5;
          --green-dark: #047857;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.5 2 5 5.5 5 9C5 12.5 8.5 16 12 16C15.5 16 19 12.5 19 9C19 5.5 15.5 2 12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M8 14C6 16.5 4 18 4 21C4 23 7 24 12 24C17 24 20 23 20 21C20 18 18 16.5 16 14" fill="white" fillOpacity="0.7"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                HealthTrack
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : ""}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium text-gray-700">
                        {user.full_name || user.email?.split("@")[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Settings")} className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Iniciar sesión
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : ""}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Chat Widget - Floating */}
      {currentPageName !== "Chat" && <ChatWidget />}

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.5 2 5 5.5 5 9C5 12.5 8.5 16 12 16C15.5 16 19 12.5 19 9C19 5.5 15.5 2 12 2Z" fill="#10B981"/>
                </svg>
              </div>
              <span>© 2024 HealthTrack. Cuida tu salud.</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link to={createPageUrl("Settings")} className="hover:text-emerald-600 transition-colors">
                Configuración
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </NotificationProvider>
  );
}