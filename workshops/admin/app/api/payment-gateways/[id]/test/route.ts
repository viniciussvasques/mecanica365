import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  
  try {
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${API_URL}/api/admin/system-payment/${params.id}/test`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error testing payment gateway:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to test payment gateway' 
    }, { status: 500 });
  }
}
