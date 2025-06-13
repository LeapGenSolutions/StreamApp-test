import { useEffect } from "react";

function NotFound() {

  useEffect(() => {
      document.title = "NotFound - Seismic Connect";
    }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg text-gray-600">Page not found</p>
      </div>
    </div>
  );
}

export default NotFound;
