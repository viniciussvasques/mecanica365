'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subdomain, setSubdomain] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Limpar dados de onboarding do localStorage após pagamento bem-sucedido
    localStorage.removeItem('onboarding_tenant_id');
    
    // Tentar recuperar subdomain do localStorage
    const savedSubdomain = localStorage.getItem('onboarding_subdomain');
    if (savedSubdomain) {
      setSubdomain(savedSubdomain);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`
        max-w-lg w-full bg-white shadow-2xl rounded-3xl p-8 md:p-12 text-center
        transform transition-all duration-700 ease-out
        ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
      `}>
        {/* Success Icon with Animation */}
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg animate-bounce">
            <svg
              className="h-10 w-10 text-white animate-scale-in"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-2 h-2 rounded-full
                ${i % 3 === 0 ? 'bg-green-500' : i % 3 === 1 ? 'bg-blue-500' : 'bg-yellow-500'}
                animate-confetti
              `}
              style={{
                left: `${(i * 8.33)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 animate-fade-in">
          Pagamento Confirmado! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-6 animate-fade-in-delay">
          Sua conta foi ativada com sucesso!
        </p>

        {/* Email Notification Box */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 animate-fade-in-delay-2">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Email Enviado! 📧
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Enviamos um email com suas credenciais de acesso para o endereço cadastrado.
              </p>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  ⚠️ Não recebeu o email?
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Verifique sua <strong>caixa de entrada</strong></li>
                  <li>Confira a pasta de <strong>spam/lixo eletrônico</strong></li>
                  <li>O email pode levar alguns minutos para chegar</li>
                  <li>Verifique se o endereço de email está correto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {sessionId && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in-delay-3">
            <p className="text-xs text-gray-500 font-mono break-all">
              ID: {sessionId}
            </p>
          </div>
        )}

        <div className="space-y-4 animate-fade-in-delay-5">
          {subdomain ? (
            <Link
              href={`/login?subdomain=${subdomain}`}
              className="block w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Fazer Login
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Fazer Login
            </Link>
          )}
          <Link
            href="/"
            className="block w-full bg-white text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }
        .animate-fade-in-delay-3 {
          animation: fade-in 0.6s ease-out 0.6s both;
        }
        .animate-fade-in-delay-4 {
          animation: fade-in 0.6s ease-out 0.8s both;
        }
        .animate-fade-in-delay-5 {
          animation: fade-in 0.6s ease-out 1s both;
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
