'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se está logado
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0D] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" />
    </div>
  );
}

