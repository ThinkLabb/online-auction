import { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  name: string;
  email: string;
};

const UserContext = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
}>({ user: null, setUser: () => {} });

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);

export type CategoryContextType = {
  activeLevel1: string;
  setActiveLevel1: (value: string) => void;
};

export const CategoryContext = createContext<CategoryContextType>({
  activeLevel1: '',
  setActiveLevel1: () => {}, // hàm rỗng
});
