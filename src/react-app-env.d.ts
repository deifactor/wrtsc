// Putting this first means it'll match before *.svg below.
declare module "jsx:*.svg" {
  import React from "react";
  const component: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default component;
}

declare module "*.svg" {
  const url: string;
  export default url;
}
