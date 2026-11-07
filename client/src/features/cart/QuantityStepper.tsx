import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuantityStepperProps = {
  name: string;
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
};

export function QuantityStepper({ name, quantity, max, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Decrease quantity of ${name}`}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus className="size-4" />
      </Button>
      <span className="w-8 text-center text-sm font-medium" aria-live="polite">
        {quantity}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Increase quantity of ${name}`}
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
