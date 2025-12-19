import { useState, useEffect } from "react";
// import { lumi } from "../lib/lumi";

// export function useAuth() {
//   const [user, setUser] = useState(lumi.auth.user);
//   const [isAuthenticated, setIsAuthenticated] = useState(lumi.auth.isAuthenticated);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     const unsubscribe = lumi.auth.onAuthChange(({ isAuthenticated, user }) => {
//       setUser(user);
//       setIsAuthenticated(isAuthenticated);
//     });
//     return unsubscribe;
//   }, []);

//   const signIn = async () => {
//     try {
//       setIsLoading(true);
//       await lumi.auth.signIn();
//     } catch (error) {
//       console.error("Login erro:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const signOut = () => {
//     lumi.auth.signOut();
//   };

//   return {
//     user,
//     isAuthenticated,
//     isLoading,
//     isAdmin: user?.userRole === "ADMIN",
//     isUser: user?.userRole === "USER",
//     signIn,
//     signOut,
//   };
// }
