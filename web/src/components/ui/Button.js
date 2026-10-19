const variants = {
  primary: "bg-brand-900 text-white",
  outline: "border-2 border-brand-900 bg-white text-brand-900",
};

export default function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`h-[52px] w-full rounded-xl text-base font-bold disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}