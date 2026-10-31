import React from "react";

interface MyCollegeLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "hero" | "login";
  type?: "full" | "shield";
}

export const MyCollegeLogo: React.FC<MyCollegeLogoProps> = ({
  className = "",
  size = "md",
  type = "full",
}) => {
  const sizeMap = {
    xs: "w-7 h-7",
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20 sm:w-24 sm:h-24",
    "2xl": "w-36 h-36 sm:w-44 sm:h-44",
    "3xl": "w-52 h-52 sm:w-60 sm:h-60",
    hero: "w-64 h-64 sm:w-72 sm:h-72",
    login: "w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96",
  };

  const currentClass = sizeMap[size] || sizeMap.md;
  const imageSrc = type === "shield" ? "/my-college-shield.svg" : "/my-college-logo.svg";

  return (
    <img
      src={imageSrc}
      alt="My College"
      className={`${currentClass} aspect-square object-contain select-none ${className}`}
    />
  );
};
