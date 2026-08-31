import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { AuthService } from "~/services/auth.service";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AuthService.getToken();
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    }
  };

  
  if (isLoggedIn === null) {
    return null; 
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/sign-in" />;
  }
}
