import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  
  try {
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${API_URL}/api/admin/system-payment/${params.id}/default`, {
      method: 'PATCH',
      headers: {
        'Authorization': token || '',
      },
    });

    if (response.status === 204 || response.status === 200) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error setting default payment gateway:', error);
    return NextResponse.json({ error: 'Failed to set default payment gateway' }, { status: 500 });
  }
}
