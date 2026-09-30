import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-8">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-500 mb-8">La página que buscas no existe.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
