import React from "react";

export type SvgType = {
  path: string;
  fill?: string;
  bgColor?: string;
  color?: string;
  size?: string;
  viewBox?: string;
  width?: string;
  height?: string;
  className?: string;
  children?: JSX.Element | JSX.Element[];
};
