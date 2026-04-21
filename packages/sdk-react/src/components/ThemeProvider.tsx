import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * 테마 타입
 */
export type Theme = "dark" | "light";

/**
 * 테마 컨텍스트 인터페이스
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * 테마 컨텍스트 생성
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider Props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

/**
 * 테마 제공자 컴포넌트
 * 다크/라이트 테마 상태를 관리하고 localStorage에 저장합니다.
 * 
 * @param children - 자식 컴포넌트
 * @param defaultTheme - 기본 테마 (기본값: "dark")
 */
export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // localStorage에서 저장된 테마 불러오기
    const savedTheme = localStorage.getItem("cad-theme") as Theme | null;
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      return savedTheme;
    }
    return defaultTheme;
  });

  // 테마 변경 시 document에 클래스 적용 및 localStorage 저장
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("cad-theme", theme);
  }, [theme]);

  /**
   * 테마 토글 함수
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 테마 훅
 * 컴포넌트에서 테마 상태와 토글 함수를 사용할 수 있습니다.
 * 
 * @returns 테마 컨텍스트 값
 * @throws ThemeProvider 내부에서 사용하지 않을 경우 에러
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
