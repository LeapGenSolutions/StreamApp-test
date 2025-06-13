import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../../lib/utils";

const THEMES = { light: "", dark: ".dark" };

const Chart = React.forwardRef(
  ({ config, data, type, className, ...props }, ref) => {
    const Component = RechartsPrimitive[type];
    if (!Component) return null;

    return (
      <Component data={data} className={cn("", className)} ref={ref} {...props}>
        {config &&
          Object.entries(config).map(([key, value]) => {
            const El = RechartsPrimitive[key];
            if (!El) return null;

            let props = {};
            if (value.color) props.stroke = value.color;
            if (value.theme) {
              const colors = {};
              for (const [theme, color] of Object.entries(value.theme)) {
                colors[THEMES[theme]] = color;
              }
              props.stroke = colors[""]; // Default to light theme
            }
            return <El key={key} {...props} />;
          })}
      </Component>
    );
  }
);
Chart.displayName = "Chart";

export { Chart };
