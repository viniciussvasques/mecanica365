import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    
    const response = await fetch(`${API_URL}/api/admin/system-payment/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    return NextResponse.json({ error: 'Failed to update payment gateway' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  
  try {
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${API_URL}/api/admin/system-payment/${params.id}`, {
      method: 'DELETE',
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
    console.error('Error deleting payment gateway:', error);
    return NextResponse.json({ error: 'Failed to delete payment gateway' }, { status: 500 });
  }
}
