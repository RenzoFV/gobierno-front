import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium leading-none text-foreground", className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

type SelectChangeEvent = { target: { value: string } };

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  onChange?: (event: SelectChangeEvent) => void;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(String(defaultValue ?? ""));
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectedValue = String(value ?? internalValue);
    const options = React.Children.toArray(children).flatMap((child) => {
      if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) return [];
      const optionValue = String(child.props.value ?? "");
      return [{
        value: optionValue,
        label: child.props.children?.toString() ?? optionValue,
        disabled: child.props.disabled,
      }];
    });
    const selected = options.find((option) => option.value === selectedValue);

    return (
      <div
        ref={containerRef}
        className={cn("relative w-full", className)}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !selected?.value && "text-muted-foreground",
          )}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <span className="truncate">{selected?.label || "Selecciona una opcion"}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-44 overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-lg ring-1 ring-border"
            role="listbox"
          >
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === selectedValue}
                  disabled={option.disabled}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
                    option.value === selectedValue && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setInternalValue(option.value);
                    onChange?.({ target: { value: option.value } });
                    setOpen(false);
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {option.value === selectedValue && <Check className="h-4 w-4" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
