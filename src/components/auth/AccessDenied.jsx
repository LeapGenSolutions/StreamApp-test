import { ShieldAlert } from "lucide-react";

const AccessDenied = ({
  title = "Access denied",
  description = "You do not have permission to view this area.",
}) => {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default AccessDenied;
