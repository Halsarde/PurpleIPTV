import React from "react";
import { useAuth, AuthProvider } from "./context/AuthContext";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      {user ? <HomeScreen /> : <LoginScreen />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
